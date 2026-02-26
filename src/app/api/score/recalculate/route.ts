import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(session.user as Record<string, unknown>).isPremium) {
    return Response.json({ error: "Premium required" }, { status: 402 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const profile = await prisma.revenueProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return Response.json({ error: "No revenue profile found. Please fill out your business metrics first." }, { status: 404 });
  }

  const inputs: RevenueInputs = {
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

  const bt = (profile.businessType as BusinessTypeName | null) ?? undefined;
  const result = computeRevenueHealthScore(inputs, bt);

  // Save previous score data to User before creating new snapshot
  const prevSnapshot = await prisma.revenueScoreSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (prevSnapshot) {
    const pillarMap = [
      { label: "Revenue", prev: prevSnapshot.pillarRevenue, curr: result.pillars.revenue.score, reasons: result.pillars.revenue.reasons },
      { label: "Profitability", prev: prevSnapshot.pillarProfitability, curr: result.pillars.profitability.score, reasons: result.pillars.profitability.reasons },
      { label: "Retention", prev: prevSnapshot.pillarRetention, curr: result.pillars.retention.score, reasons: result.pillars.retention.reasons },
      { label: "Acquisition", prev: prevSnapshot.pillarAcquisition, curr: result.pillars.acquisition.score, reasons: result.pillars.acquisition.reasons },
      { label: "Operations", prev: prevSnapshot.pillarOps, curr: result.pillars.ops.score, reasons: result.pillars.ops.reasons },
    ];
    let biggest = pillarMap[0];
    for (const p of pillarMap) {
      if (Math.abs(p.curr - p.prev) > Math.abs(biggest.curr - biggest.prev)) biggest = p;
    }
    const delta = biggest.curr - biggest.prev;
    const direction = delta > 0 ? "improved" : "dropped";
    const reasonSuffix = biggest.reasons[0] ? ` — ${biggest.reasons[0]}` : "";
    const reasonFull = delta !== 0 ? `${biggest.label} ${direction}${reasonSuffix}` : null;
    const scoreChangeReason = reasonFull && reasonFull.length > 100 ? reasonFull.slice(0, 97) + "..." : reasonFull;

    await prisma.user.update({
      where: { id: userId },
      data: {
        previousScore: prevSnapshot.score,
        previousPillarScores: {
          revenue: prevSnapshot.pillarRevenue,
          profitability: prevSnapshot.pillarProfitability,
          retention: prevSnapshot.pillarRetention,
          acquisition: prevSnapshot.pillarAcquisition,
          ops: prevSnapshot.pillarOps,
        },
        scoreChangeReason,
      },
    });
  }

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

  return Response.json({
    ok: true,
    result,
    updatedAt: snapshot.createdAt.toISOString(),
  });
}
