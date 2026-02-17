import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import { generateActionPlan } from "@/lib/revenue-health/actionPlan";
import {
  getRecommendationParams,
  buildToolRecommendations,
} from "@/lib/revenue-health/recommendations";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";

export async function GET() {
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
    return Response.json({ ok: true, actionPlan: null, toolsByPillar: null });
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
  const scoreResult = computeRevenueHealthScore(inputs, bt);
  const actionPlan = generateActionPlan(scoreResult, inputs);

  // Get tool recommendations
  const { pillarsToQuery } = getRecommendationParams(scoreResult, inputs);

  // Collect all categories needed
  const allCategories = [...new Set(pillarsToQuery.flatMap((p) => p.categories))];

  const tools = await prisma.tool.findMany({
    where: { category: { in: allCategories } },
    orderBy: { rating: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      affiliateUrl: true,
      hasFreeTier: true,
      pricing: true,
      rating: true,
      commissionRate: true,
    },
  });

  const toolsByPillar = buildToolRecommendations(tools, pillarsToQuery, inputs);

  return Response.json({ ok: true, actionPlan, toolsByPillar });
}
