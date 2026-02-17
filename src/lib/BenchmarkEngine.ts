import type { MetricInput, BenchmarkInput } from "./RevenueHealthCalculator";

export interface BusinessProfileInput {
  businessType: string;
  revenueStage: string;
  primaryChannel?: string;
  currentRevenue: number;
}

export interface BenchmarkComparison {
  revenueGap: number;
  closeRateGap: number;
  performanceTier: "Top Performer" | "Above Average" | "Average" | "Below Average" | "Underperforming";
  improvementPotential: number;
  benchmark: BenchmarkInput;
}

// Default benchmarks by businessType + revenueStage
const DEFAULT_BENCHMARKS: Record<string, Record<string, BenchmarkInput>> = {
  freelancer: {
    "pre-revenue": {
      avgRevenueGrowth: 5,
      avgCloseRate: 0.15,
      avgFollowUpTime: 48,
      avgLeadConsistency: 5,
    },
    "early": {
      avgRevenueGrowth: 10,
      avgCloseRate: 0.2,
      avgFollowUpTime: 36,
      avgLeadConsistency: 10,
    },
    "growing": {
      avgRevenueGrowth: 15,
      avgCloseRate: 0.25,
      avgFollowUpTime: 24,
      avgLeadConsistency: 20,
    },
    "established": {
      avgRevenueGrowth: 8,
      avgCloseRate: 0.3,
      avgFollowUpTime: 12,
      avgLeadConsistency: 30,
    },
  },
  solopreneur: {
    "pre-revenue": {
      avgRevenueGrowth: 8,
      avgCloseRate: 0.1,
      avgFollowUpTime: 48,
      avgLeadConsistency: 8,
    },
    "early": {
      avgRevenueGrowth: 12,
      avgCloseRate: 0.18,
      avgFollowUpTime: 30,
      avgLeadConsistency: 15,
    },
    "growing": {
      avgRevenueGrowth: 18,
      avgCloseRate: 0.22,
      avgFollowUpTime: 18,
      avgLeadConsistency: 30,
    },
    "established": {
      avgRevenueGrowth: 10,
      avgCloseRate: 0.28,
      avgFollowUpTime: 12,
      avgLeadConsistency: 50,
    },
  },
  agency: {
    "pre-revenue": {
      avgRevenueGrowth: 10,
      avgCloseRate: 0.12,
      avgFollowUpTime: 36,
      avgLeadConsistency: 10,
    },
    "early": {
      avgRevenueGrowth: 15,
      avgCloseRate: 0.2,
      avgFollowUpTime: 24,
      avgLeadConsistency: 20,
    },
    "growing": {
      avgRevenueGrowth: 20,
      avgCloseRate: 0.25,
      avgFollowUpTime: 16,
      avgLeadConsistency: 40,
    },
    "established": {
      avgRevenueGrowth: 12,
      avgCloseRate: 0.3,
      avgFollowUpTime: 8,
      avgLeadConsistency: 60,
    },
  },
  saas: {
    "pre-revenue": {
      avgRevenueGrowth: 15,
      avgCloseRate: 0.05,
      avgFollowUpTime: 24,
      avgLeadConsistency: 50,
    },
    "early": {
      avgRevenueGrowth: 20,
      avgCloseRate: 0.08,
      avgFollowUpTime: 18,
      avgLeadConsistency: 100,
    },
    "growing": {
      avgRevenueGrowth: 25,
      avgCloseRate: 0.12,
      avgFollowUpTime: 12,
      avgLeadConsistency: 200,
    },
    "established": {
      avgRevenueGrowth: 15,
      avgCloseRate: 0.15,
      avgFollowUpTime: 6,
      avgLeadConsistency: 500,
    },
  },
  ecommerce: {
    "pre-revenue": {
      avgRevenueGrowth: 10,
      avgCloseRate: 0.02,
      avgFollowUpTime: 72,
      avgLeadConsistency: 100,
    },
    "early": {
      avgRevenueGrowth: 15,
      avgCloseRate: 0.03,
      avgFollowUpTime: 48,
      avgLeadConsistency: 300,
    },
    "growing": {
      avgRevenueGrowth: 20,
      avgCloseRate: 0.04,
      avgFollowUpTime: 24,
      avgLeadConsistency: 1000,
    },
    "established": {
      avgRevenueGrowth: 12,
      avgCloseRate: 0.05,
      avgFollowUpTime: 12,
      avgLeadConsistency: 3000,
    },
  },
};

const FALLBACK_BENCHMARK: BenchmarkInput = {
  avgRevenueGrowth: 10,
  avgCloseRate: 0.2,
  avgFollowUpTime: 24,
  avgLeadConsistency: 20,
};

/**
 * Resolve benchmark from DB record or fall back to hardcoded defaults.
 */
export function resolveBenchmark(
  profile: BusinessProfileInput,
  dbBenchmark?: BenchmarkInput | null
): BenchmarkInput {
  if (dbBenchmark) return dbBenchmark;

  const byType = DEFAULT_BENCHMARKS[profile.businessType.toLowerCase()];
  if (!byType) return FALLBACK_BENCHMARK;

  const byStage = byType[profile.revenueStage.toLowerCase()];
  return byStage || FALLBACK_BENCHMARK;
}

function getPerformanceTier(
  ratio: number
): BenchmarkComparison["performanceTier"] {
  if (ratio >= 1.3) return "Top Performer";
  if (ratio >= 1.1) return "Above Average";
  if (ratio >= 0.9) return "Average";
  if (ratio >= 0.7) return "Below Average";
  return "Underperforming";
}

/**
 * Compare user metrics against resolved benchmark.
 * Returns gap analysis and performance tier.
 */
export function compareToBenchmark(
  metrics: MetricInput,
  profile: BusinessProfileInput,
  benchmark: BenchmarkInput
): BenchmarkComparison {
  // Revenue gap: difference between benchmark growth rate applied to current revenue vs actual trend
  const expectedMonthlyGrowth =
    profile.currentRevenue * (benchmark.avgRevenueGrowth / 100);
  const actualMonthlyGrowth =
    profile.currentRevenue * (metrics.revenueTrend30d / 100);
  const revenueGap = Math.round(expectedMonthlyGrowth - actualMonthlyGrowth);

  // Close rate gap
  const closeRateGap =
    Math.round((benchmark.avgCloseRate - metrics.closeRate) * 1000) / 1000;

  // Composite performance ratio
  const growthRatio =
    benchmark.avgRevenueGrowth > 0
      ? metrics.revenueTrend30d / benchmark.avgRevenueGrowth
      : 1;
  const closeRatio =
    benchmark.avgCloseRate > 0
      ? metrics.closeRate / benchmark.avgCloseRate
      : 1;
  const compositeRatio = growthRatio * 0.6 + closeRatio * 0.4;

  const performanceTier = getPerformanceTier(compositeRatio);

  // Improvement potential: estimated monthly revenue gain if gaps closed
  const improvementPotential = Math.max(0, revenueGap);

  return {
    revenueGap: Math.max(0, revenueGap),
    closeRateGap: Math.max(0, closeRateGap),
    performanceTier,
    improvementPotential,
    benchmark,
  };
}
