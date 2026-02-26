import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

// Map pillar names to the integrations that feed them
const PILLAR_SOURCE_MAP: Record<string, string[]> = {
  revenue: ["shopify", "stripe"],
  profitability: ["shopify", "stripe"],
  retention: ["shopify", "stripe"],
  acquisition: ["shopify"],
  ops: [],
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as Record<string, unknown>;
  if (!user.isPremium) {
    return Response.json({ error: "Premium required" }, { status: 402 });
  }

  const userId = user.id as string;

  try {
    // ── 1. Revenue Overview ──
    const logs = await prisma.weeklyLog.findMany({
      where: { userId },
      orderBy: { weekOf: "desc" },
      take: 12,
    });

    // Monthly summary
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

    const thisMonthLogs = logs.filter(
      (l) => l.weekOf >= monthStart && l.weekOf <= monthEnd
    );

    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59));

    const lastMonthLogs = await prisma.weeklyLog.findMany({
      where: {
        userId,
        weekOf: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      orderBy: { weekOf: "desc" },
    });

    const thisMonthRevenue = thisMonthLogs.reduce((s, l) => s + l.revenue, 0);
    const lastMonthRevenue = lastMonthLogs.reduce((s, l) => s + l.revenue, 0);
    const avgWeeklyRevenue = thisMonthLogs.length > 0
      ? thisMonthRevenue / thisMonthLogs.length
      : 0;

    const profile = await prisma.revenueProfile.findUnique({
      where: { userId },
      select: { revenueMonthly: true },
    });

    const monthlyTarget = profile?.revenueMonthly ?? null;
    const targetPct = monthlyTarget && monthlyTarget > 0
      ? Math.round((thisMonthRevenue / monthlyTarget) * 100)
      : null;

    const trend = lastMonthRevenue > 0
      ? (thisMonthRevenue >= lastMonthRevenue ? "up" as const : "down" as const)
      : null;

    // ── 2. Pillar Health ──
    const [snapshot, userData, integrations] = await Promise.all([
      prisma.revenueScoreSnapshot.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { previousScore: true, scoreChangeReason: true, previousPillarScores: true },
      }),
      prisma.integration.findMany({
        where: { userId },
        select: { provider: true, lastSyncAt: true, status: true },
      }),
    ]);

    // Pillar history (last 2 weeks for delta)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const history = await prisma.metricHistory.findMany({
      where: { userId, weekOf: { gte: twoWeeksAgo } },
      orderBy: { weekOf: "desc" },
    });

    const pillarsByWeek: Record<string, { weekOf: string; score: number }[]> = {};
    for (const h of history) {
      if (!pillarsByWeek[h.pillar]) pillarsByWeek[h.pillar] = [];
      pillarsByWeek[h.pillar].push({ weekOf: h.weekOf.toISOString(), score: h.score });
    }

    // Build pillar data from snapshot + history
    const pillarNames = ["revenue", "profitability", "retention", "acquisition", "ops"];
    const pillarsData: Record<string, {
      score: number;
      prev: number | null;
      delta: number;
      reasons: string[];
      levers: string[];
      sources: string[];
    }> = {};

    const parsedPillars = snapshot ? JSON.parse(snapshot.pillarsJson) : null;
    const connectedProviders = integrations.map((i) => i.provider);

    for (const name of pillarNames) {
      const pillarDetail = parsedPillars?.[name];
      const historyEntries = pillarsByWeek[name];
      const current = pillarDetail?.score ?? 0;
      const prev = historyEntries && historyEntries.length >= 2
        ? historyEntries[1].score
        : null;

      // Determine sources for this pillar
      const autoSources = (PILLAR_SOURCE_MAP[name] || []).filter((s) =>
        connectedProviders.includes(s)
      );
      // Always include "tracker" if user has weekly logs
      const sources = logs.length > 0 ? [...autoSources, "tracker"] : autoSources;

      pillarsData[name] = {
        score: current,
        prev,
        delta: prev != null ? current - prev : 0,
        reasons: pillarDetail?.reasons ?? [],
        levers: pillarDetail?.levers ?? [],
        sources: [...new Set(sources)],
      };
    }

    // ── 3. Integration Summary ──
    const connectedProvidersList = integrations.map((i) => ({
      provider: i.provider,
      lastSyncAt: i.lastSyncAt?.toISOString() ?? null,
      status: i.status,
    }));

    return Response.json({
      ok: true,
      // Revenue overview
      weeklyLogs: logs,
      monthly: {
        thisMonthRevenue,
        lastMonthRevenue,
        avgWeeklyRevenue,
        monthlyTarget,
        targetPct,
        trend,
        weeksLogged: thisMonthLogs.length,
      },
      monthlyTarget,

      // Pillar health
      pillars: pillarsData,
      overallScore: snapshot?.score ?? 0,
      previousScore: userData?.previousScore ?? null,
      scoreChangeReason: userData?.scoreChangeReason ?? null,

      // Integration summary
      connectedProviders: connectedProvidersList,
    });
  } catch (err: unknown) {
    console.error("[COMMAND CENTER]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
