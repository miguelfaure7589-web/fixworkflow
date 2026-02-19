import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const { id } = await params;

  try {
    // Only allow deleting own entries
    const entry = await prisma.weeklyLog.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.weeklyLog.delete({ where: { id } });

    // Recalculate score from remaining logs
    const recentLogs = await prisma.weeklyLog.findMany({
      where: { userId },
      orderBy: { weekOf: "desc" },
      take: 4,
    });

    if (recentLogs.length > 0) {
      const avgWeeklyRevenue = recentLogs.reduce((s, l) => s + l.revenue, 0) / recentLogs.length;
      const monthlyRevenue = Math.round(avgWeeklyRevenue * 4.33);

      await prisma.revenueProfile.update({
        where: { userId },
        data: { revenueMonthly: monthlyRevenue },
      });

      const profile = await prisma.revenueProfile.findUnique({ where: { userId } });
      if (profile) {
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
      }
    }

    return Response.json({ ok: true });
  } catch (err: unknown) {
    console.error("[TRACKER DELETE] ERROR:", err);
    console.error("[TRACKER DELETE] Stack:", err instanceof Error ? err.stack : "no stack");
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
