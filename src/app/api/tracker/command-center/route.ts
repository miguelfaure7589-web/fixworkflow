import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

// Pillar → integration sources mapping
const PILLAR_SOURCE_MAP: Record<string, string[]> = {
  revenue: ["shopify", "stripe-data"],
  profitability: ["shopify", "stripe-data", "quickbooks"],
  retention: ["shopify", "stripe-data"],
  acquisition: ["shopify", "google-analytics"],
  ops: ["quickbooks"],
};

// Key metric label per pillar (shown on card)
const PILLAR_KEY_METRIC: Record<string, { metricKey: string; label: string; format: "dollar" | "pct" | "number" }> = {
  revenue: { metricKey: "monthlyRevenue", label: "Monthly Revenue", format: "dollar" },
  profitability: { metricKey: "grossMarginPct", label: "Gross Margin", format: "pct" },
  retention: { metricKey: "repeatCustomerRate", label: "Repeat Rate", format: "pct" },
  acquisition: { metricKey: "monthlySessions", label: "Monthly Sessions", format: "number" },
  ops: { metricKey: "fulfillmentTime", label: "Fulfillment (hrs)", format: "number" },
};

function fmtMetric(value: number, format: "dollar" | "pct" | "number"): string {
  if (format === "dollar") return "$" + Math.round(value).toLocaleString("en-US");
  if (format === "pct") return value.toFixed(1) + "%";
  return Math.round(value).toLocaleString("en-US");
}

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
    // ── Parallel data fetch ──
    const [
      logs,
      snapshot,
      userData,
      integrations,
      profile,
      alerts,
    ] = await Promise.all([
      prisma.weeklyLog.findMany({
        where: { userId },
        orderBy: { weekOf: "desc" },
        take: 12,
      }),
      prisma.revenueScoreSnapshot.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { previousScore: true, scoreChangeReason: true, previousPillarScores: true, goals: true },
      }),
      prisma.integration.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          status: true,
          lastSyncAt: true,
          lastSyncStatus: true,
          syncLogs: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { dataSnapshot: true, pillarImpact: true },
          },
        },
      }),
      prisma.revenueProfile.findUnique({
        where: { userId },
        select: { revenueMonthly: true, grossMarginPct: true },
      }),
      prisma.scoreAlert.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // ── 1. Revenue Overview ──
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
    const thisMonthLogs = logs.filter((l) => l.weekOf >= monthStart && l.weekOf <= monthEnd);

    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59));
    const lastMonthLogs = await prisma.weeklyLog.findMany({
      where: { userId, weekOf: { gte: lastMonthStart, lte: lastMonthEnd } },
      orderBy: { weekOf: "desc" },
    });

    const thisMonthRevenue = thisMonthLogs.reduce((s, l) => s + l.revenue, 0);
    const lastMonthRevenue = lastMonthLogs.reduce((s, l) => s + l.revenue, 0);
    const avgWeeklyRevenue = thisMonthLogs.length > 0 ? thisMonthRevenue / thisMonthLogs.length : 0;
    const monthlyTarget = profile?.revenueMonthly ?? null;
    const targetPct = monthlyTarget && monthlyTarget > 0 ? Math.round((thisMonthRevenue / monthlyTarget) * 100) : null;
    const trend = lastMonthRevenue > 0 ? (thisMonthRevenue >= lastMonthRevenue ? "up" as const : "down" as const) : null;

    // Determine primary revenue source
    const hasShopify = integrations.some((i) => i.provider === "shopify" && i.status === "connected");
    const hasStripe = integrations.some((i) => i.provider === "stripe-data" && i.status === "connected");
    const revenueSource = hasShopify ? "shopify" : hasStripe ? "stripe-data" : logs.length > 0 ? "tracker" : null;

    // Total revenue: prefer profile (integration-synced) over manual logs
    const totalRevenue = profile?.revenueMonthly ?? thisMonthRevenue;

    // ── 2. Pillar Health ──
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const history = await prisma.metricHistory.findMany({
      where: { userId, weekOf: { gte: twoWeeksAgo } },
      orderBy: { weekOf: "desc" },
    });

    const pillarsByWeek: Record<string, { weekOf: string; score: number; metrics: Record<string, unknown>; source: string }[]> = {};
    for (const h of history) {
      if (!pillarsByWeek[h.pillar]) pillarsByWeek[h.pillar] = [];
      pillarsByWeek[h.pillar].push({
        weekOf: h.weekOf.toISOString(),
        score: h.score,
        metrics: h.metrics as Record<string, unknown>,
        source: h.source,
      });
    }

    const pillarNames = ["revenue", "profitability", "retention", "acquisition", "ops"];
    const parsedPillars = snapshot ? JSON.parse(snapshot.pillarsJson) : null;
    const connectedProviders = integrations.map((i) => i.provider);
    const pillarsData: Record<string, {
      score: number;
      prev: number | null;
      delta: number;
      reasons: string[];
      levers: string[];
      sources: string[];
      keyMetric: { label: string; value: string; source: string } | null;
    }> = {};

    for (const name of pillarNames) {
      const pillarDetail = parsedPillars?.[name];
      const historyEntries = pillarsByWeek[name];
      const current = pillarDetail?.score ?? 0;
      const prev = historyEntries && historyEntries.length >= 2 ? historyEntries[1].score : null;

      const autoSources = (PILLAR_SOURCE_MAP[name] || []).filter((s) => connectedProviders.includes(s));
      const sources = logs.length > 0 ? [...new Set([...autoSources, "tracker"])] : [...new Set(autoSources)];

      // Extract key metric for this pillar
      let keyMetric: { label: string; value: string; source: string } | null = null;
      const kmConfig = PILLAR_KEY_METRIC[name];
      if (kmConfig && historyEntries?.[0]) {
        const metricsObj = historyEntries[0].metrics as Record<string, unknown>;
        const innerMetrics = (metricsObj?.metrics ?? metricsObj) as Record<string, number>;
        const val = innerMetrics?.[kmConfig.metricKey];
        if (val !== undefined && val !== null) {
          keyMetric = {
            label: kmConfig.label,
            value: fmtMetric(val, kmConfig.format),
            source: historyEntries[0].source,
          };
        }
      }

      pillarsData[name] = {
        score: current,
        prev,
        delta: prev != null ? current - prev : 0,
        reasons: pillarDetail?.reasons ?? [],
        levers: pillarDetail?.levers ?? [],
        sources,
        keyMetric,
      };
    }

    // ── 3. Integration Data Streams ──
    const integrationStreams = await Promise.all(
      integrations.map(async (integ) => {
        const latestLog = integ.syncLogs[0];
        const rawData = (latestLog?.dataSnapshot ?? {}) as Record<string, unknown>;

        // Build provider-specific metrics
        const metrics: Record<string, number | string | null> = {};
        if (integ.provider === "shopify") {
          metrics.orders = (rawData.orders as number) ?? null;
          metrics.revenue = (rawData.totalRevenue as number) ?? null;
          metrics.aov = (rawData.averageOrderValue as number) ?? null;
          metrics.newCustomers = (rawData.newCustomers as number) ?? null;
        } else if (integ.provider === "google-analytics") {
          metrics.sessions = (rawData.sessions as number) ?? null;
          metrics.conversionRate = (rawData.conversionRate as number) ?? null;
          metrics.newUsers = (rawData.newUsers as number) ?? null;
          metrics.bounceRate = (rawData.bounceRate as number) ?? null;
        } else if (integ.provider === "quickbooks") {
          metrics.totalIncome = (rawData.totalIncome as number) ?? null;
          metrics.totalExpenses = (rawData.totalExpenses as number) ?? null;
          metrics.netIncome = (rawData.netIncome as number) ?? null;
          metrics.overdueCount = (rawData.overdueCount as number) ?? null;
        } else if (integ.provider === "stripe-data") {
          metrics.revenue = (rawData.grossRevenue as number) ?? null;
          metrics.fees = (rawData.fees as number) ?? null;
          metrics.mrr = (rawData.recurringRevenue as number) ?? null;
          metrics.activeCustomers = (rawData.activeCustomers as number) ?? null;
        }

        // Sparkline: last 8 weeks of revenue pillar scores for this provider
        const providerHistory = await prisma.metricHistory.findMany({
          where: { userId, source: integ.provider },
          orderBy: { weekOf: "asc" },
          take: 8,
          select: { score: true },
        });
        const sparkline = providerHistory.map((h) => h.score);

        return {
          id: integ.id,
          provider: integ.provider,
          status: integ.status,
          lastSyncAt: integ.lastSyncAt?.toISOString() ?? null,
          lastSyncStatus: integ.lastSyncStatus,
          metrics,
          sparkline,
        };
      })
    );

    // ── 4. Alerts & Opportunities ──
    const alertItems = alerts.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      message: a.message,
      severity: a.severity as "info" | "warning" | "critical",
      pillar: a.pillar,
      read: a.read,
      createdAt: a.createdAt.toISOString(),
    }));

    // Generate synthetic alerts from data if no real alerts exist
    if (alertItems.length === 0) {
      // Check for pillar drops
      for (const [name, data] of Object.entries(pillarsData)) {
        if (data.delta < -5) {
          alertItems.push({
            id: `synth-drop-${name}`,
            type: "pillar_drop",
            title: `${name.charAt(0).toUpperCase() + name.slice(1)} score dropped`,
            message: `${name.charAt(0).toUpperCase() + name.slice(1)} dropped by ${Math.abs(data.delta)} points. ${data.reasons[0] || "Review your metrics."}`,
            severity: data.delta < -10 ? "critical" : "warning",
            pillar: name,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
        if (data.delta > 5) {
          alertItems.push({
            id: `synth-win-${name}`,
            type: "goal_hit",
            title: `${name.charAt(0).toUpperCase() + name.slice(1)} is improving`,
            message: `+${data.delta} points this week. ${data.levers[0] || "Keep it up!"}`,
            severity: "info",
            pillar: name,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
      // Stale data alert
      const anyIntegration = integrations[0];
      if (anyIntegration?.lastSyncAt) {
        const daysSinceSync = (Date.now() - new Date(anyIntegration.lastSyncAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSync > 7) {
          alertItems.push({
            id: "synth-stale",
            type: "data_stale",
            title: "Data may be outdated",
            message: `Last sync was ${Math.round(daysSinceSync)} days ago. Sync your integrations for fresh data.`,
            severity: "warning",
            pillar: null,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // ── 5. Weekly Comparison ──
    const sortedLogs = [...logs].sort((a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime());
    const weeklyComparison = sortedLogs.slice(0, 8).map((log, i) => {
      const prevLog = sortedLogs[i + 1] ?? null;
      return {
        weekOf: log.weekOf.toISOString(),
        revenue: log.revenue,
        orders: log.orders,
        expenses: log.expenses,
        profit: log.profit,
        margin: log.margin,
        revenueDelta: prevLog ? log.revenue - prevLog.revenue : null,
        ordersDelta: prevLog && log.orders != null && prevLog.orders != null ? log.orders - prevLog.orders : null,
      };
    });

    // ── 6. Goal Tracking ──
    const goalsJson = (userData?.goals ?? {}) as Record<string, number>;
    const goals = {
      monthlyRevenue: goalsJson.monthlyRevenue ?? monthlyTarget ?? null,
      grossMargin: goalsJson.grossMargin ?? null,
      currentRevenue: totalRevenue,
      currentMargin: profile?.grossMarginPct ?? null,
    };

    // ── Response ──
    return Response.json({
      ok: true,

      // 1. Revenue overview
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
      totalRevenue,
      revenueSource,

      // 2. Pillar health
      pillars: pillarsData,
      overallScore: snapshot?.score ?? 0,
      previousScore: userData?.previousScore ?? null,
      scoreChangeReason: userData?.scoreChangeReason ?? null,

      // 3. Integration streams
      integrationStreams,

      // 4. Alerts
      alerts: alertItems,

      // 5. Weekly comparison
      weeklyComparison,

      // 6. Goals
      goals,

      // 7. Connected providers
      connectedProviders: integrations.map((i) => ({
        provider: i.provider,
        lastSyncAt: i.lastSyncAt?.toISOString() ?? null,
        status: i.status,
      })),
    });
  } catch (err: unknown) {
    console.error("[COMMAND CENTER]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
