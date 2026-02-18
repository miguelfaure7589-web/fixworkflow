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
