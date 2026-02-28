import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const isPremium = (session.user as Record<string, unknown>).isPremium as boolean;

    if (!isPremium) {
      return NextResponse.json({ error: "Premium required" }, { status: 402 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // no body is fine
    }
    const force = body.force === true;

    // Check cache
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        aiSummary: true,
        aiSummaryGeneratedAt: true,
        frictionAreas: true,
        toolPain: true,
        primaryGoal: true,
        freeTextChallenge: true,
        bio: true,
        businessStage: true,
        profileGoal: true,
        scoreChange: true,
        previousScore: true,
        previousPillarScores: true,
      },
    });

    if (
      !force &&
      user?.aiSummary &&
      user?.aiSummaryGeneratedAt &&
      Date.now() - new Date(user.aiSummaryGeneratedAt).getTime() < TWENTY_FOUR_HOURS
    ) {
      return NextResponse.json({ summary: user.aiSummary, cached: true });
    }

    // Gather all user data for the prompt
    const profile = await prisma.revenueProfile.findUnique({
      where: { userId },
    });

    const latestSnapshot = await prisma.revenueScoreSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestSnapshot) {
      return NextResponse.json({ error: "No score data found. Complete onboarding first." }, { status: 400 });
    }

    const pillarsJson = JSON.parse(latestSnapshot.pillarsJson || "{}");
    const pillarScores: Record<string, number> = {
      revenue: latestSnapshot.pillarRevenue,
      profitability: latestSnapshot.pillarProfitability,
      retention: latestSnapshot.pillarRetention,
      acquisition: latestSnapshot.pillarAcquisition,
      ops: latestSnapshot.pillarOps,
    };

    // Find weakest and strongest
    const pillarEntries = Object.entries(pillarScores).sort(([, a], [, b]) => a - b);
    const weakestPillar = pillarEntries[0];
    const strongestPillar = pillarEntries[pillarEntries.length - 1];

    // Score change context
    const scoreChange = user?.scoreChange ?? 0;
    const prevScore = user?.previousScore ?? null;
    const prevPillarScores = (user?.previousPillarScores as Record<string, number>) ?? {};

    // Calculate pillar changes
    const pillarChanges: Record<string, number> = {};
    for (const [name, score] of Object.entries(pillarScores)) {
      const prev = prevPillarScores[name];
      if (prev !== undefined) {
        pillarChanges[name] = score - prev;
      }
    }
    const changesDescription = Object.entries(pillarChanges)
      .filter(([, delta]) => delta !== 0)
      .map(([name, delta]) => `${name}: ${delta > 0 ? "+" : ""}${delta}`)
      .join(", ");

    // Build data payload for Claude
    const userData = {
      businessType: profile?.businessType || "unknown",
      monthlyRevenue: profile?.revenueMonthly,
      grossMarginPct: profile?.grossMarginPct,
      conversionRatePct: profile?.conversionRatePct,
      trafficMonthly: profile?.trafficMonthly,
      avgOrderValue: profile?.avgOrderValue,
      ltv: profile?.ltv,
      cac: profile?.cac,
      ltvCacRatio: profile?.ltv && profile?.cac && profile.cac > 0
        ? Math.round((profile.ltv / profile.cac) * 10) / 10
        : null,
      churnRatePct: profile?.churnMonthlyPct,
      pillarScores,
      overallScore: latestSnapshot.score,
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
      scoreChange,
      previousScore: prevScore,
      pillarChanges: changesDescription || null,
    };

    // Build change context for prompt if score changed significantly
    let changePromptSuffix = "";
    if (Math.abs(scoreChange) >= 3 && prevScore !== null) {
      changePromptSuffix = ` The user's score changed by ${scoreChange > 0 ? "+" : ""}${scoreChange} points this week (from ${prevScore} to ${latestSnapshot.score}). The biggest pillar changes were: ${changesDescription}. Mention what improved or declined and why based on the data sources.`;
    }

    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a business analyst for FixWorkFlow. Write a concise, personalized business summary (150-250 words) for this user based on their data. Write in second person. Be specific — reference their actual numbers, not generic advice. Structure: current state assessment, biggest risk, biggest opportunity with specific math, connection to their stated challenges, 30-day priority recommendation. Do not use bullet points, headers, or formatting — write as a single flowing paragraph. Be direct and actionable.${changePromptSuffix}`,
      messages: [
        {
          role: "user",
          content: `Here is the user's business data:\n\n${JSON.stringify(userData, null, 2)}`,
        },
      ],
    });

    const summaryText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    // Save to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiSummary: summaryText,
        aiSummaryGeneratedAt: new Date(),
      },
    });

    return NextResponse.json({ summary: summaryText, cached: false });
  } catch (err: unknown) {
    console.error("AI_SUMMARY_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}
