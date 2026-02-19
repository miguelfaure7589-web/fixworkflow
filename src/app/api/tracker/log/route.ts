import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";

/** Return the Monday 00:00 UTC of the week containing `date`. */
function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as Record<string, unknown>;
  if (!user.isPremium) {
    return Response.json({ error: "Premium required" }, { status: 402 });
  }

  const userId = user.id as string;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const revenue = Number(body.revenue);
  if (!revenue || revenue < 0) {
    return Response.json({ error: "Revenue is required and must be positive" }, { status: 400 });
  }

  const orders = body.orders != null ? Math.round(Number(body.orders)) : null;
  const expenses = body.expenses != null && body.expenses !== "" ? Number(body.expenses) : null;
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : null;

  // Determine the Monday of the target week
  const weekOf = body.weekOf ? getMonday(new Date(body.weekOf as string)) : getMonday(new Date());

  // Auto-calculate derived fields
  const aov = orders && orders > 0 ? Math.round((revenue / orders) * 100) / 100 : null;
  const profit = expenses != null ? Math.round((revenue - expenses) * 100) / 100 : null;
  const margin = profit != null && revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : null;

  try {
    // Upsert the weekly log
    const entry = await prisma.weeklyLog.upsert({
      where: { userId_weekOf: { userId, weekOf } },
      create: { userId, weekOf, revenue, orders, expenses, aov, profit, margin, notes },
      update: { revenue, orders, expenses, aov, profit, margin, notes },
    });

    // ── Score integration: update RevenueProfile with rolling averages ──

    // Get last 4 weeks of logs for rolling average
    const recentLogs = await prisma.weeklyLog.findMany({
      where: { userId },
      orderBy: { weekOf: "desc" },
      take: 4,
    });

    const avgWeeklyRevenue = recentLogs.reduce((s, l) => s + l.revenue, 0) / recentLogs.length;
    const monthlyRevenue = Math.round(avgWeeklyRevenue * 4.33);

    // Calculate average AOV from logs that have orders
    const logsWithOrders = recentLogs.filter((l) => l.orders && l.orders > 0);
    const avgAov = logsWithOrders.length > 0
      ? logsWithOrders.reduce((s, l) => s + (l.aov ?? 0), 0) / logsWithOrders.length
      : undefined;

    // Calculate average margin from logs that have expenses
    const logsWithExpenses = recentLogs.filter((l) => l.margin != null);
    const avgMargin = logsWithExpenses.length > 0
      ? logsWithExpenses.reduce((s, l) => s + (l.margin ?? 0), 0) / logsWithExpenses.length
      : undefined;

    // Update RevenueProfile with tracker data
    const profileUpdate: Record<string, unknown> = {
      revenueMonthly: monthlyRevenue,
    };
    if (avgAov != null) profileUpdate.avgOrderValue = Math.round(avgAov * 100) / 100;
    if (avgMargin != null) profileUpdate.grossMarginPct = Math.round(avgMargin * 100) / 100;

    const profile = await prisma.revenueProfile.upsert({
      where: { userId },
      create: { userId, ...profileUpdate },
      update: profileUpdate,
    });

    // Recompute score
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

    // Save score snapshot
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

    // Save metric history entry
    const monday = getMonday(new Date());
    await prisma.metricHistory.upsert({
      where: { userId_pillar_weekOf: { userId, pillar: "revenue", weekOf: monday } },
      create: {
        userId,
        pillar: "revenue",
        score: result.pillars.revenue.score,
        metrics: { revenueMonthly: monthlyRevenue, avgOrderValue: avgAov, grossMarginPct: avgMargin, source: "tracker" },
        source: "tracker",
        weekOf: monday,
      },
      update: {
        score: result.pillars.revenue.score,
        metrics: { revenueMonthly: monthlyRevenue, avgOrderValue: avgAov, grossMarginPct: avgMargin, source: "tracker" },
        source: "tracker",
      },
    });

    return Response.json({
      ok: true,
      entry,
      score: result.score,
      result,
    });
  } catch (err: unknown) {
    console.error("[TRACKER LOG] ERROR:", err);
    console.error("[TRACKER LOG] Stack:", err instanceof Error ? err.stack : "no stack");
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
