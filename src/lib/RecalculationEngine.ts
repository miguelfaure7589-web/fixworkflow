import { prisma } from "./prisma";
import {
  calculateRevenueHealthScore,
  type MetricInput,
  type RevenueHealthResult,
} from "./RevenueHealthCalculator";
import { detectBottlenecks, type BottleneckResult } from "./BottleneckDetector";
import {
  resolveBenchmark,
  compareToBenchmark,
  type BenchmarkComparison,
  type BusinessProfileInput,
} from "./BenchmarkEngine";

export interface RecalculationResult {
  healthResult: RevenueHealthResult;
  bottleneck: BottleneckResult;
  benchmarkComparison: BenchmarkComparison;
  snapshotId: string;
}

/**
 * Full recalculation: pull latest metrics, calculate everything, persist snapshot.
 */
export async function fullRecalculation(
  userId: string
): Promise<RecalculationResult | null> {
  // Get latest metric snapshot
  const latestMetric = await prisma.metricSnapshot.findFirst({
    where: { userId },
    orderBy: { timestamp: "desc" },
  });

  if (!latestMetric) return null;

  // Get business profile
  const businessProfile = await prisma.businessProfile.findFirst({
    where: { userId },
    orderBy: { lastUpdated: "desc" },
  });

  if (!businessProfile) return null;

  // Check for DB benchmark, fall back to defaults
  const dbBenchmark = await prisma.benchmarkProfile.findUnique({
    where: {
      businessType_revenueStage: {
        businessType: businessProfile.businessType,
        revenueStage: businessProfile.revenueStage,
      },
    },
  });

  const profileInput: BusinessProfileInput = {
    businessType: businessProfile.businessType,
    revenueStage: businessProfile.revenueStage,
    currentRevenue: businessProfile.currentRevenue,
  };

  const benchmark = resolveBenchmark(
    profileInput,
    dbBenchmark
      ? {
          avgRevenueGrowth: dbBenchmark.avgRevenueGrowth,
          avgCloseRate: dbBenchmark.avgCloseRate,
          avgFollowUpTime: dbBenchmark.avgFollowUpTime,
          avgLeadConsistency: dbBenchmark.avgLeadConsistency,
        }
      : null
  );

  const metrics: MetricInput = {
    revenue: latestMetric.revenue,
    revenueTrend7d: latestMetric.revenueTrend7d,
    revenueTrend30d: latestMetric.revenueTrend30d,
    leadCount: latestMetric.leadCount,
    closeRate: latestMetric.closeRate,
    averageDealValue: latestMetric.averageDealValue,
    taskCompletionRate: latestMetric.taskCompletionRate,
    followUpDelayHours: latestMetric.followUpDelayHours,
    contentFrequency: latestMetric.contentFrequency,
    burnoutRiskScore: latestMetric.burnoutRiskScore,
  };

  // Calculate
  const healthResult = calculateRevenueHealthScore(metrics, benchmark);
  const bottleneck = detectBottlenecks(metrics, benchmark);
  const benchmarkComparison = compareToBenchmark(metrics, profileInput, benchmark);

  // Persist RevenueHealthSnapshot
  const snapshot = await prisma.revenueHealthSnapshot.create({
    data: {
      userId,
      totalScore: healthResult.totalScore,
      componentScores: JSON.stringify(healthResult.componentBreakdown),
      primaryBottleneck: bottleneck.primaryBottleneck,
      revenueGap: benchmarkComparison.revenueGap,
      interpretationBand: healthResult.interpretationBand,
    },
  });

  // Persist BottleneckAssessment
  await prisma.bottleneckAssessment.create({
    data: {
      userId,
      primaryBottleneck: bottleneck.primaryBottleneck,
      secondaryBottlenecks: JSON.stringify(bottleneck.secondaryBottlenecks),
      severityScore: bottleneck.severityScore,
    },
  });

  return {
    healthResult,
    bottleneck,
    benchmarkComparison,
    snapshotId: snapshot.id,
  };
}

/**
 * Micro update: recalculate only affected components without full DB round-trip.
 * Returns whether a significant delta was detected.
 */
export async function microUpdate(
  userId: string,
  updatedMetrics: Partial<MetricInput>
): Promise<{ significantDelta: boolean; newScore?: number }> {
  // Get previous snapshot
  const previousSnapshot = await prisma.revenueHealthSnapshot.findFirst({
    where: { userId },
    orderBy: { calculatedAt: "desc" },
  });

  if (!previousSnapshot) {
    // No previous snapshot — trigger full recalculation
    const result = await fullRecalculation(userId);
    return {
      significantDelta: true,
      newScore: result?.healthResult.totalScore,
    };
  }

  // Get latest metrics and merge updates
  const latestMetric = await prisma.metricSnapshot.findFirst({
    where: { userId },
    orderBy: { timestamp: "desc" },
  });

  if (!latestMetric) return { significantDelta: false };

  const businessProfile = await prisma.businessProfile.findFirst({
    where: { userId },
    orderBy: { lastUpdated: "desc" },
  });

  if (!businessProfile) return { significantDelta: false };

  const profileInput: BusinessProfileInput = {
    businessType: businessProfile.businessType,
    revenueStage: businessProfile.revenueStage,
    currentRevenue: businessProfile.currentRevenue,
  };

  const benchmark = resolveBenchmark(profileInput, null);

  const metrics: MetricInput = {
    revenue: updatedMetrics.revenue ?? latestMetric.revenue,
    revenueTrend7d: updatedMetrics.revenueTrend7d ?? latestMetric.revenueTrend7d,
    revenueTrend30d: updatedMetrics.revenueTrend30d ?? latestMetric.revenueTrend30d,
    leadCount: updatedMetrics.leadCount ?? latestMetric.leadCount,
    closeRate: updatedMetrics.closeRate ?? latestMetric.closeRate,
    averageDealValue: updatedMetrics.averageDealValue ?? latestMetric.averageDealValue,
    taskCompletionRate: updatedMetrics.taskCompletionRate ?? latestMetric.taskCompletionRate,
    followUpDelayHours: updatedMetrics.followUpDelayHours ?? latestMetric.followUpDelayHours,
    contentFrequency: updatedMetrics.contentFrequency ?? latestMetric.contentFrequency,
    burnoutRiskScore: updatedMetrics.burnoutRiskScore ?? latestMetric.burnoutRiskScore,
  };

  const healthResult = calculateRevenueHealthScore(metrics, benchmark);
  const scoreDelta = Math.abs(healthResult.totalScore - previousSnapshot.totalScore);
  const bottleneckChanged =
    detectBottlenecks(metrics, benchmark).primaryBottleneck !==
    previousSnapshot.primaryBottleneck;

  const significantDelta = scoreDelta >= 10 || bottleneckChanged;

  if (significantDelta) {
    const bottleneck = detectBottlenecks(metrics, benchmark);
    const benchmarkComparison = compareToBenchmark(metrics, profileInput, benchmark);

    await prisma.revenueHealthSnapshot.create({
      data: {
        userId,
        totalScore: healthResult.totalScore,
        componentScores: JSON.stringify(healthResult.componentBreakdown),
        primaryBottleneck: bottleneck.primaryBottleneck,
        revenueGap: benchmarkComparison.revenueGap,
        interpretationBand: healthResult.interpretationBand,
      },
    });
  }

  return {
    significantDelta,
    newScore: healthResult.totalScore,
  };
}

/**
 * Check if AI insight regeneration is needed.
 */
export async function shouldRegenerateInsight(
  userId: string
): Promise<boolean> {
  const [latestSnapshot, previousSnapshot, latestInsight] = await Promise.all([
    prisma.revenueHealthSnapshot.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    }),
    prisma.revenueHealthSnapshot.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
      skip: 1,
    }),
    prisma.insight.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!latestSnapshot) return false;
  if (!latestInsight) return true;

  // Regenerate if no previous snapshot to compare
  if (!previousSnapshot) return true;

  // Score change > 10%
  const scoreDelta = Math.abs(
    latestSnapshot.totalScore - previousSnapshot.totalScore
  );
  if (scoreDelta >= 10) return true;

  // Primary bottleneck changed
  if (
    latestSnapshot.primaryBottleneck !== previousSnapshot.primaryBottleneck
  )
    return true;

  // Revenue drop > 15%
  if (
    previousSnapshot.totalScore > 0 &&
    latestSnapshot.totalScore < previousSnapshot.totalScore * 0.85
  )
    return true;

  return false;
}

/**
 * Get cached snapshot for dashboard load. Never recalculates synchronously.
 */
export async function getCachedSnapshot(userId: string) {
  const snapshot = await prisma.revenueHealthSnapshot.findFirst({
    where: { userId },
    orderBy: { calculatedAt: "desc" },
  });

  if (!snapshot) return null;

  return {
    totalScore: snapshot.totalScore,
    componentScores: JSON.parse(snapshot.componentScores),
    primaryBottleneck: snapshot.primaryBottleneck,
    revenueGap: snapshot.revenueGap,
    interpretationBand: snapshot.interpretationBand,
    calculatedAt: snapshot.calculatedAt,
  };
}
