import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, RevenueHealthScoreResult, BusinessTypeName } from "@/lib/revenue-health";

function profileToInputs(profile: {
  revenueMonthly: number | null;
  grossMarginPct: number | null;
  netProfitMonthly: number | null;
  runwayMonths: number | null;
  churnMonthlyPct: number | null;
  conversionRatePct: number | null;
  trafficMonthly: number | null;
  avgOrderValue: number | null;
  cac: number | null;
  ltv: number | null;
  opsHoursPerWeek: number | null;
  fulfillmentDays: number | null;
  supportTicketsPerWeek: number | null;
}): RevenueInputs {
  return {
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
}

async function saveSnapshot(
  userId: string,
  result: RevenueHealthScoreResult,
): Promise<string> {
  const snapshot = await prisma.revenueScoreSnapshot.create({
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
  return snapshot.createdAt.toISOString();
}

function snapshotToResult(snapshot: {
  score: number;
  pillarsJson: string;
  primaryRisk: string;
  fastestLever: string;
  nextStepsJson: string;
  missingDataJson: string;
  createdAt: Date;
}): { result: RevenueHealthScoreResult; updatedAt: string } {
  return {
    result: {
      score: snapshot.score,
      pillars: JSON.parse(snapshot.pillarsJson),
      primaryRisk: snapshot.primaryRisk,
      fastestLever: snapshot.fastestLever,
      recommendedNextSteps: JSON.parse(snapshot.nextStepsJson),
      missingData: JSON.parse(snapshot.missingDataJson),
    },
    updatedAt: snapshot.createdAt.toISOString(),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const profile = await prisma.revenueProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return Response.json({ ok: true, result: null });
  }

  // Fetch user's previous score data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { previousScore: true, scoreChangeReason: true, previousPillarScores: true, scoreChange: true, lastScoringSource: true },
  });

  // Check for existing snapshot
  const existingSnapshot = await prisma.revenueScoreSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // If snapshot exists and is newer than the profile update, return it
  if (existingSnapshot && existingSnapshot.createdAt >= profile.updatedAt) {
    const { result, updatedAt } = snapshotToResult(existingSnapshot);
    return Response.json({
      ok: true,
      result,
      updatedAt,
      previousScore: user?.previousScore ?? null,
      scoreChangeReason: user?.scoreChangeReason ?? null,
      previousPillarScores: user?.previousPillarScores ?? null,
      scoreChange: user?.scoreChange ?? null,
      lastScoringSource: user?.lastScoringSource ?? null,
    });
  }

  // Profile exists but no snapshot (or stale) — compute + save
  const inputs = profileToInputs(profile);
  const bt = (profile.businessType as BusinessTypeName | null) ?? undefined;
  const result = computeRevenueHealthScore(inputs, bt);
  const updatedAt = await saveSnapshot(userId, result);

  return Response.json({
    ok: true,
    result,
    updatedAt,
    previousScore: user?.previousScore ?? null,
    scoreChangeReason: user?.scoreChangeReason ?? null,
    previousPillarScores: user?.previousPillarScores ?? null,
    scoreChange: user?.scoreChange ?? null,
    lastScoringSource: user?.lastScoringSource ?? null,
  });
}
