/**
 * Score Recalculator
 *
 * Unified entry point for recalculating a user's Revenue Health Score.
 * Merges integration data with manual inputs, tracks changes,
 * and triggers AI summary regeneration on significant shifts.
 */

import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName, PillarName } from "@/lib/revenue-health/types";
import { pullIntegrationData, mergeInputs } from "@/lib/integration-scoring";

// ── Types ──

export interface ScoreResult {
  newScore: number;
  previousScore: number | null;
  scoreChange: number;
  pillarChanges: Record<string, number>; // { revenue: +2, profitability: -1, ... }
  dataSourceBreakdown: Record<string, string>; // { revenueMonthly: 'stripe', ... }
  source: "manual" | "integration" | "cron";
  aiSummaryRegenerated: boolean;
}

// ── Change Reason Templates ──

const POSITIVE_REASONS: Record<string, string> = {
  revenue: "monthly revenue increased based on integration data",
  profitability: "margins improved or costs decreased",
  retention: "churn decreased or engagement improved",
  acquisition: "traffic and conversion metrics improved",
  ops: "operational efficiency improved",
};

const NEGATIVE_REASONS: Record<string, string> = {
  revenue: "revenue declined — check integration data for details",
  profitability: "margins compressed or costs increased",
  retention: "churn increased or engagement metrics declined",
  acquisition: "traffic or conversion rate dropped this week",
  ops: "operational load increased",
};

function getScoreChangeReason(
  pillarChanges: Record<string, number>,
  dataSources: Record<string, string>,
): string | null {
  // Find the pillar with the biggest absolute change
  let biggestPillar = "";
  let biggestDelta = 0;
  for (const [pillar, delta] of Object.entries(pillarChanges)) {
    if (Math.abs(delta) > Math.abs(biggestDelta)) {
      biggestPillar = pillar;
      biggestDelta = delta;
    }
  }

  if (biggestDelta === 0) return null;

  const pillarLabel = {
    revenue: "Revenue",
    profitability: "Profitability",
    retention: "Retention",
    acquisition: "Acquisition",
    ops: "Operations",
  }[biggestPillar] || biggestPillar;

  // Find which integration provided data for this pillar
  const sources = Object.values(dataSources);
  const sourceStr = sources.length > 0 ? sources[0] : "";

  if (biggestDelta > 0) {
    const reason = POSITIVE_REASONS[biggestPillar] || "metrics improved";
    return `${pillarLabel} improved ${biggestDelta} pts — ${reason}`;
  } else {
    const reason = NEGATIVE_REASONS[biggestPillar] || "metrics declined";
    return `${pillarLabel} dropped ${Math.abs(biggestDelta)} pts — ${reason}`;
  }
}

// ── Main Entry Point ──

export async function recalculateUserScore(
  userId: string,
  source: "manual" | "integration" | "cron",
): Promise<ScoreResult> {
  // 1. Get user's current RevenueProfile
  const profile = await prisma.revenueProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("No RevenueProfile found for user");
  }

  // 2. Get previous snapshot for change tracking
  const prevSnapshot = await prisma.revenueScoreSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const previousScore = prevSnapshot?.score ?? null;
  const previousPillarScores: Record<string, number> = prevSnapshot
    ? {
        revenue: prevSnapshot.pillarRevenue,
        profitability: prevSnapshot.pillarProfitability,
        retention: prevSnapshot.pillarRetention,
        acquisition: prevSnapshot.pillarAcquisition,
        ops: prevSnapshot.pillarOps,
      }
    : {};

  // 3. Build manual inputs from profile
  const manualInputs: RevenueInputs = {
    revenueMonthly: profile.revenueMonthly ?? undefined,
    grossMarginPct: profile.grossMarginPct ?? undefined,
    netProfitMonthly: profile.netProfitMonthly ?? undefined,
    runwayMonths: profile.runwayMonths ?? undefined,
    churnMonthlyPct: profile.churnMonthlyPct ?? undefined,
    conversionRatePct: profile.conversionRatePct ?? undefined,
    trafficMonthly: profile.trafficMonthly ?? undefined,
    avgOrderValue: profile.avgOrderValue ?? undefined,
    cac: profile.cac ?? undefined,
    ltv: profile.ltv ?? undefined,
    opsHoursPerWeek: profile.opsHoursPerWeek ?? undefined,
    fulfillmentDays: profile.fulfillmentDays ?? undefined,
    supportTicketsPerWeek: profile.supportTicketsPerWeek ?? undefined,
  };

  // 4. Pull fresh integration data
  let integrationResult = { inputs: {} as Partial<RevenueInputs>, dataSources: {} as Record<string, string> };
  try {
    integrationResult = await pullIntegrationData(userId);
  } catch (err) {
    console.error("[SCORE_RECALCULATOR] Integration data pull failed:", err);
    // Continue with manual data only
  }

  // 5. Merge: integration data takes priority over manual
  const mergedInputs = mergeInputs(manualInputs, integrationResult.inputs);

  // 6. Update RevenueProfile with any new integration data
  if (Object.keys(integrationResult.inputs).length > 0) {
    const profileUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(integrationResult.inputs)) {
      if (value !== undefined) profileUpdate[key] = value;
    }
    if (Object.keys(profileUpdate).length > 0) {
      await prisma.revenueProfile.update({
        where: { id: profile.id },
        data: profileUpdate,
      });
    }
  }

  // 7. Run scoring engine
  const bt = (profile.businessType as BusinessTypeName | null) ?? undefined;
  const result = computeRevenueHealthScore(mergedInputs, bt);

  // 8. Calculate changes
  const pillarChanges: Record<string, number> = {};
  const pillarNames: PillarName[] = ["revenue", "profitability", "retention", "acquisition", "ops"];
  for (const name of pillarNames) {
    const prev = previousPillarScores[name] ?? result.pillars[name].score;
    pillarChanges[name] = result.pillars[name].score - prev;
  }

  const scoreChange = previousScore !== null ? result.score - previousScore : 0;
  const changeReason = getScoreChangeReason(pillarChanges, integrationResult.dataSources);

  // 9. Save previous score data to User
  await prisma.user.update({
    where: { id: userId },
    data: {
      previousScore: previousScore ?? result.score,
      previousPillarScores: previousPillarScores,
      previousScoreDate: prevSnapshot?.createdAt ?? new Date(),
      scoreChange,
      scoreChangeReason: changeReason,
      lastScoringSource: source,
    },
  });

  // 10. Save new score snapshot
  await prisma.revenueScoreSnapshot.create({
    data: {
      userId,
      score: result.score,
      pillarRevenue: result.pillars.revenue.score,
      pillarProfitability: result.pillars.profitability.score,
      pillarRetention: result.pillars.retention.score,
      pillarAcquisition: result.pillars.acquisition.score,
      pillarOps: result.pillars.ops.score,
      pillarsJson: JSON.stringify(result.pillars),
      primaryRisk: result.primaryRisk,
      fastestLever: result.fastestLever,
      nextStepsJson: JSON.stringify(result.recommendedNextSteps),
      missingDataJson: JSON.stringify(result.missingData),
    },
  });

  // 11. Update BusinessProfile metricSources if integration data was used
  if (Object.keys(integrationResult.dataSources).length > 0) {
    const bp = await prisma.businessProfile.findFirst({ where: { userId } });
    if (bp) {
      const existingSources = (bp.metricSources as Record<string, string>) || {};
      await prisma.businessProfile.update({
        where: { id: bp.id },
        data: {
          metricSources: { ...existingSources, ...integrationResult.dataSources },
        },
      });
    }
  }

  // 12. Auto-regenerate AI summary if score changed by 3+ points
  let aiSummaryRegenerated = false;
  if (Math.abs(scoreChange) >= 3) {
    try {
      await regenerateAiSummary(userId, scoreChange, previousScore, result.score, pillarChanges);
      aiSummaryRegenerated = true;
    } catch (err) {
      console.error("[SCORE_RECALCULATOR] AI summary regeneration failed:", err);
    }
  }

  return {
    newScore: result.score,
    previousScore,
    scoreChange,
    pillarChanges,
    dataSourceBreakdown: integrationResult.dataSources,
    source,
    aiSummaryRegenerated,
  };
}

// ── AI Summary Regeneration ──

async function regenerateAiSummary(
  userId: string,
  scoreChange: number,
  previousScore: number | null,
  newScore: number,
  pillarChanges: Record<string, number>,
): Promise<void> {
  // Check if Anthropic API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[SCORE_RECALCULATOR] No ANTHROPIC_API_KEY — skipping AI summary regeneration");
    return;
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      frictionAreas: true,
      toolPain: true,
      primaryGoal: true,
      freeTextChallenge: true,
      bio: true,
      businessStage: true,
      profileGoal: true,
    },
  });

  const profile = await prisma.revenueProfile.findUnique({
    where: { userId },
  });

  const latestSnapshot = await prisma.revenueScoreSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!latestSnapshot) return;

  const pillarScores: Record<string, number> = {
    revenue: latestSnapshot.pillarRevenue,
    profitability: latestSnapshot.pillarProfitability,
    retention: latestSnapshot.pillarRetention,
    acquisition: latestSnapshot.pillarAcquisition,
    ops: latestSnapshot.pillarOps,
  };

  const pillarEntries = Object.entries(pillarScores).sort(([, a], [, b]) => a - b);
  const weakestPillar = pillarEntries[0];
  const strongestPillar = pillarEntries[pillarEntries.length - 1];

  // Format pillar changes for the prompt
  const changesDescription = Object.entries(pillarChanges)
    .filter(([, delta]) => delta !== 0)
    .map(([name, delta]) => `${name}: ${delta > 0 ? "+" : ""}${delta}`)
    .join(", ");

  const userData = {
    businessType: profile?.businessType || "unknown",
    monthlyRevenue: profile?.revenueMonthly,
    grossMarginPct: profile?.grossMarginPct,
    conversionRatePct: profile?.conversionRatePct,
    trafficMonthly: profile?.trafficMonthly,
    avgOrderValue: profile?.avgOrderValue,
    ltv: profile?.ltv,
    cac: profile?.cac,
    ltvCacRatio:
      profile?.ltv && profile?.cac && profile.cac > 0
        ? Math.round((profile.ltv / profile.cac) * 10) / 10
        : null,
    churnRatePct: profile?.churnMonthlyPct,
    pillarScores,
    overallScore: newScore,
    weakestPillar: { name: weakestPillar[0], score: weakestPillar[1] },
    strongestPillar: { name: strongestPillar[0], score: strongestPillar[1] },
    frictionAreas: user?.frictionAreas,
    toolPain: user?.toolPain,
    primaryGoal: user?.primaryGoal,
    freeTextChallenge: user?.freeTextChallenge,
    bio: user?.bio,
    businessStage: user?.businessStage,
    profileGoal: user?.profileGoal,
    primaryRisk: latestSnapshot.primaryRisk,
    fastestLever: latestSnapshot.fastestLever,
    // Score change context
    scoreChange,
    previousScore,
    pillarChanges: changesDescription,
  };

  const changeContext = `The user's score changed by ${scoreChange > 0 ? "+" : ""}${scoreChange} points this week (from ${previousScore} to ${newScore}). The biggest pillar changes were: ${changesDescription}. Mention what improved or declined and why based on the data sources.`;

  const anthropic = new Anthropic();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: `You are a business analyst for FixWorkFlow. Write a concise, personalized business summary (150-250 words) for this user based on their data. Write in second person. Be specific — reference their actual numbers, not generic advice. Structure: current state assessment, biggest risk, biggest opportunity with specific math, connection to their stated challenges, 30-day priority recommendation. Do not use bullet points, headers, or formatting — write as a single flowing paragraph. Be direct and actionable. ${changeContext}`,
    messages: [
      {
        role: "user",
        content: `Here is the user's business data:\n\n${JSON.stringify(userData, null, 2)}`,
      },
    ],
  });

  const summaryText = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("\n");

  await prisma.user.update({
    where: { id: userId },
    data: {
      aiSummary: summaryText,
      aiSummaryGeneratedAt: new Date(),
    },
  });
}
