/**
 * Integration Sync Engine
 *
 * Orchestrates data pulls from connected integrations,
 * maps to pillar metrics, recalculates scores, and stores history.
 */

import { prisma } from "@/lib/prisma";
import { getProvider } from "./registry";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";
import type { SyncResult, PillarMetrics } from "./types";
import { sendWeeklyScoreUpdateEmail, shouldSendEmail } from "@/lib/email";

// ── Helpers ──

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = start of week
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ── Score change reason generator ──

function generateScoreChangeReason(
  prevSnapshot: { pillarRevenue: number; pillarProfitability: number; pillarRetention: number; pillarAcquisition: number; pillarOps: number },
  newPillars: { revenue: { score: number; reasons: string[] }; profitability: { score: number; reasons: string[] }; retention: { score: number; reasons: string[] }; acquisition: { score: number; reasons: string[] }; ops: { score: number; reasons: string[] } },
): string | null {
  const pillarMap: { key: string; label: string; prev: number; curr: number; reasons: string[] }[] = [
    { key: "revenue", label: "Revenue", prev: prevSnapshot.pillarRevenue, curr: newPillars.revenue.score, reasons: newPillars.revenue.reasons },
    { key: "profitability", label: "Profitability", prev: prevSnapshot.pillarProfitability, curr: newPillars.profitability.score, reasons: newPillars.profitability.reasons },
    { key: "retention", label: "Retention", prev: prevSnapshot.pillarRetention, curr: newPillars.retention.score, reasons: newPillars.retention.reasons },
    { key: "acquisition", label: "Acquisition", prev: prevSnapshot.pillarAcquisition, curr: newPillars.acquisition.score, reasons: newPillars.acquisition.reasons },
    { key: "ops", label: "Operations", prev: prevSnapshot.pillarOps, curr: newPillars.ops.score, reasons: newPillars.ops.reasons },
  ];

  let biggest = pillarMap[0];
  for (const p of pillarMap) {
    if (Math.abs(p.curr - p.prev) > Math.abs(biggest.curr - biggest.prev)) {
      biggest = p;
    }
  }

  const delta = biggest.curr - biggest.prev;
  if (delta === 0) return null;

  const direction = delta > 0 ? "improved" : "dropped";
  const reasonSuffix = biggest.reasons[0] ? ` — ${biggest.reasons[0]}` : "";
  const full = `${biggest.label} ${direction}${reasonSuffix}`;
  return full.length > 100 ? full.slice(0, 97) + "..." : full;
}

// ── Sync a single integration ──

export async function syncIntegration(integrationId: string): Promise<SyncResult> {
  const startTime = Date.now();

  const integration = await prisma.integration.findUnique({
    where: { id: integrationId },
    include: { user: { include: { revenueProfile: true } } },
  });

  if (!integration) {
    return {
      integrationId,
      provider: "unknown",
      status: "failed",
      metricsUpdated: {},
      pillarImpact: {},
      changes: [],
      error: "Integration not found",
      duration: Date.now() - startTime,
    };
  }

  const provider = getProvider(integration.provider);
  if (!provider) {
    await prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncStatus: "failed", lastSyncError: "Provider not found in registry" },
    });
    return {
      integrationId,
      provider: integration.provider,
      status: "failed",
      metricsUpdated: {},
      pillarImpact: {},
      changes: [],
      error: "Provider not found in registry",
      duration: Date.now() - startTime,
    };
  }

  // Mark as syncing
  await prisma.integration.update({
    where: { id: integrationId },
    data: { status: "syncing" },
  });

  try {
    // Check token refresh if provider supports it
    if (provider.refreshAccessToken && integration.tokenExpiresAt) {
      const now = new Date();
      if (integration.tokenExpiresAt < now) {
        const refreshed = await provider.refreshAccessToken(integration);
        await prisma.integration.update({
          where: { id: integrationId },
          data: {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken ?? integration.refreshToken,
            tokenExpiresAt: refreshed.tokenExpiresAt,
          },
        });
        // Re-fetch with updated token
        Object.assign(integration, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken ?? integration.refreshToken,
          tokenExpiresAt: refreshed.tokenExpiresAt,
        });
      }
    }

    // Pull data
    const data = await provider.pullData(integration);

    // Map to pillar metrics
    const profile = integration.user.revenueProfile;
    const pillarMetrics: PillarMetrics = provider.mapToPillars(data, profile);

    // Build the metricsUpdated and pillarImpact maps
    const metricsUpdated: Record<string, boolean> = {};
    const pillarImpact: Record<string, number> = {};
    const allChanges: string[] = [];

    // Update RevenueProfile with integration data
    const profileUpdate: Record<string, any> = {};
    const metricSourcesUpdate: Record<string, string> = {};

    if (data.metrics.totalRevenue !== undefined) {
      const extrapolated = data.metrics.totalRevenue * (30 / 7);
      profileUpdate.revenueMonthly = extrapolated;
      metricSourcesUpdate.revenueMonthly = integration.provider;
      metricsUpdated.revenue = true;
    }
    if (data.metrics.averageOrderValue !== undefined) {
      profileUpdate.avgOrderValue = data.metrics.averageOrderValue;
      metricSourcesUpdate.avgOrderValue = integration.provider;
      metricsUpdated.avgOrderValue = true;
    }
    if (data.metrics.grossMargin !== undefined) {
      profileUpdate.grossMarginPct = data.metrics.grossMargin;
      metricSourcesUpdate.grossMarginPct = integration.provider;
      metricsUpdated.grossMargin = true;
    }
    if (data.metrics.conversionRate !== undefined) {
      profileUpdate.conversionRatePct = data.metrics.conversionRate;
      metricSourcesUpdate.conversionRatePct = integration.provider;
      metricsUpdated.conversionRate = true;
    }
    if (data.metrics.churnRate !== undefined) {
      profileUpdate.churnMonthlyPct = data.metrics.churnRate;
      metricSourcesUpdate.churnMonthlyPct = integration.provider;
      metricsUpdated.churnRate = true;
    }
    if (data.metrics.sessions !== undefined) {
      profileUpdate.trafficMonthly = data.metrics.sessions * (30 / 7);
      metricSourcesUpdate.trafficMonthly = integration.provider;
      metricsUpdated.traffic = true;
    }

    // Update RevenueProfile if we have data
    if (Object.keys(profileUpdate).length > 0 && profile) {
      // Merge metric sources
      const existingSources = (profile as any).metricSources || {};
      const mergedSources = { ...existingSources, ...metricSourcesUpdate };

      await prisma.revenueProfile.update({
        where: { id: profile.id },
        data: profileUpdate,
      });

      // Update metric sources on business profile if it exists
      const bp = await prisma.businessProfile.findFirst({ where: { userId: integration.userId } });
      if (bp) {
        await prisma.businessProfile.update({
          where: { id: bp.id },
          data: { metricSources: mergedSources },
        });
      }
    }

    // Recalculate Revenue Health Score
    if (profile) {
      const updatedProfile = await prisma.revenueProfile.findUnique({
        where: { userId: integration.userId },
      });

      if (updatedProfile) {
        const inputs: RevenueInputs = {
          revenueMonthly: updatedProfile.revenueMonthly ?? undefined,
          grossMarginPct: updatedProfile.grossMarginPct ?? undefined,
          netProfitMonthly: updatedProfile.netProfitMonthly ?? undefined,
          runwayMonths: updatedProfile.runwayMonths ?? undefined,
          churnMonthlyPct: updatedProfile.churnMonthlyPct ?? undefined,
          conversionRatePct: updatedProfile.conversionRatePct ?? undefined,
          trafficMonthly: updatedProfile.trafficMonthly ?? undefined,
          avgOrderValue: updatedProfile.avgOrderValue ?? undefined,
          cac: updatedProfile.cac ?? undefined,
          ltv: updatedProfile.ltv ?? undefined,
          opsHoursPerWeek: updatedProfile.opsHoursPerWeek ?? undefined,
          fulfillmentDays: updatedProfile.fulfillmentDays ?? undefined,
          supportTicketsPerWeek: updatedProfile.supportTicketsPerWeek ?? undefined,
        };

        const bt = (updatedProfile.businessType as BusinessTypeName) ?? undefined;
        const result = computeRevenueHealthScore(inputs, bt);

        // Store pillar impact
        for (const [key, p] of Object.entries(result.pillars)) {
          pillarImpact[key] = p.score;
        }

        // Save previous score data to User before creating new snapshot
        const prevSnapshot = await prisma.revenueScoreSnapshot.findFirst({
          where: { userId: integration.userId },
          orderBy: { createdAt: "desc" },
        });
        if (prevSnapshot) {
          const reason = generateScoreChangeReason(prevSnapshot, result.pillars as any);
          await prisma.user.update({
            where: { id: integration.userId },
            data: {
              previousScore: prevSnapshot.score,
              previousPillarScores: {
                revenue: prevSnapshot.pillarRevenue,
                profitability: prevSnapshot.pillarProfitability,
                retention: prevSnapshot.pillarRetention,
                acquisition: prevSnapshot.pillarAcquisition,
                ops: prevSnapshot.pillarOps,
              },
              scoreChangeReason: reason,
            },
          });
        }

        // Save score snapshot
        await prisma.revenueScoreSnapshot.create({
          data: {
            userId: integration.userId,
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

        // Save MetricHistory for each pillar
        const weekOf = getWeekStart(new Date());
        for (const [pillarName, pillar] of Object.entries(result.pillars)) {
          await prisma.metricHistory.upsert({
            where: {
              userId_pillar_weekOf: {
                userId: integration.userId,
                pillar: pillarName,
                weekOf,
              },
            },
            create: {
              userId: integration.userId,
              pillar: pillarName,
              score: pillar.score,
              metrics: pillar as any,
              source: integration.provider,
              weekOf,
            },
            update: {
              score: pillar.score,
              metrics: pillar as any,
              source: integration.provider,
            },
          });
        }

        // Send weekly score update email (fire-and-forget, respect prefs)
        const user = integration.user;
        if (user.email) {
          // Get previous snapshot for delta calculation
          const previousSnapshot = await prisma.revenueScoreSnapshot.findFirst({
            where: { userId: integration.userId },
            orderBy: { createdAt: "desc" },
            skip: 1, // skip the one we just created
          });
          const previousScore = previousSnapshot?.score ?? result.score;

          const pillarNames: Record<string, string> = {
            revenue: "Revenue",
            profitability: "Profitability",
            retention: "Retention",
            acquisition: "Acquisition",
            ops: "Operations",
          };
          const pillarChanges = Object.entries(result.pillars).map(
            ([key, p]) => ({
              name: pillarNames[key] || key,
              score: p.score,
              delta:
                p.score -
                (previousSnapshot
                  ? {
                      revenue: previousSnapshot.pillarRevenue,
                      profitability: previousSnapshot.pillarProfitability,
                      retention: previousSnapshot.pillarRetention,
                      acquisition: previousSnapshot.pillarAcquisition,
                      ops: previousSnapshot.pillarOps,
                    }[key] ?? p.score
                  : p.score),
            }),
          );

          console.log("[EMAIL] Triggering weekly-score-update for:", user.email, "score:", result.score);
          shouldSendEmail(integration.userId, "scoreUpdates").then((ok) => {
            console.log("[EMAIL] scoreUpdates pref check for weekly sync:", ok);
            if (ok) {
              sendWeeklyScoreUpdateEmail(
                user.email!,
                result.score,
                previousScore,
                pillarChanges,
              ).catch((err) =>
                console.error("[EMAIL ERROR] Weekly score email failed:", err),
              );
            }
          });
        }
      }
    }

    // Collect changes from pillar mapping
    for (const p of Object.values(pillarMetrics)) {
      if (p?.changes) allChanges.push(...p.changes);
    }

    // Create SyncLog
    await prisma.syncLog.create({
      data: {
        integrationId,
        status: "success",
        metricsUpdated,
        dataSnapshot: data.raw,
        pillarImpact,
        duration: Date.now() - startTime,
      },
    });

    // Update integration status
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: "connected",
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        lastSyncError: null,
      },
    });

    return {
      integrationId,
      provider: integration.provider,
      status: "success",
      metricsUpdated,
      pillarImpact,
      changes: allChanges,
      duration: Date.now() - startTime,
    };
  } catch (err: any) {
    const errorMsg = err?.message || "Unknown sync error";

    // Log failure
    await prisma.syncLog.create({
      data: {
        integrationId,
        status: "failed",
        error: errorMsg,
        duration: Date.now() - startTime,
      },
    });

    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: "error",
        lastSyncStatus: "failed",
        lastSyncError: errorMsg,
      },
    });

    return {
      integrationId,
      provider: integration.provider,
      status: "failed",
      metricsUpdated: {},
      pillarImpact: {},
      changes: [],
      error: errorMsg,
      duration: Date.now() - startTime,
    };
  }
}

// ── Sync all integrations for a user ──

export async function syncAllForUser(userId: string): Promise<SyncResult[]> {
  const integrations = await prisma.integration.findMany({
    where: { userId, status: { in: ["connected", "error"] } },
  });

  const results: SyncResult[] = [];
  for (const integration of integrations) {
    const result = await syncIntegration(integration.id);
    results.push(result);
  }
  return results;
}

// ── Weekly cron: sync all connected integrations ──

export async function runWeeklySync(): Promise<{
  totalIntegrations: number;
  synced: number;
  failed: number;
  results: SyncResult[];
}> {
  const integrations = await prisma.integration.findMany({
    where: { status: { in: ["connected", "error"] } },
  });

  const results: SyncResult[] = [];
  let synced = 0;
  let failed = 0;

  for (const integration of integrations) {
    const result = await syncIntegration(integration.id);
    results.push(result);
    if (result.status === "success") synced++;
    else failed++;
  }

  return {
    totalIntegrations: integrations.length,
    synced,
    failed,
    results,
  };
}
