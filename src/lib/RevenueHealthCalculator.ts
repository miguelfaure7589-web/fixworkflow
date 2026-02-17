export interface MetricInput {
  revenue: number;
  revenueTrend7d: number;
  revenueTrend30d: number;
  leadCount: number;
  closeRate: number;
  averageDealValue: number;
  taskCompletionRate: number;
  followUpDelayHours: number;
  contentFrequency: number;
  burnoutRiskScore: number;
}

export interface BenchmarkInput {
  avgRevenueGrowth: number;
  avgCloseRate: number;
  avgFollowUpTime: number;
  avgLeadConsistency: number;
}

export type InterpretationBand =
  | "Highly Efficient"
  | "Stable but Optimizable"
  | "Revenue Constrained"
  | "Structural Revenue Risk";

export interface ComponentBreakdown {
  trend: number;
  conversion: number;
  leadConsistency: number;
  stability: number;
  followUp: number;
  leverage: number;
}

export interface RevenueHealthResult {
  totalScore: number;
  componentBreakdown: ComponentBreakdown;
  weakestComponent: keyof ComponentBreakdown;
  interpretationBand: InterpretationBand;
}

const WEIGHTS = {
  trend: 0.3,
  conversion: 0.2,
  leadConsistency: 0.15,
  stability: 0.15,
  followUp: 0.1,
  leverage: 0.1,
} as const;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Score based on 7d and 30d revenue trends.
 * Positive growth scores high. Decline scores low.
 * 30d trend weighted more heavily for stability signal.
 */
export function calculateTrendScore(metrics: MetricInput): number {
  const trend7d = metrics.revenueTrend7d;
  const trend30d = metrics.revenueTrend30d;

  // Normalize: +20% growth = 100, -20% = 0, 0% = 50
  const score7d = clamp(50 + trend7d * 2.5);
  const score30d = clamp(50 + trend30d * 2.5);

  return clamp(score7d * 0.4 + score30d * 0.6);
}

/**
 * Score based on close rate vs benchmark.
 * At benchmark = 70. Above = up to 100. Below = scaled down.
 */
export function calculateConversionScore(
  metrics: MetricInput,
  benchmark: BenchmarkInput
): number {
  if (benchmark.avgCloseRate === 0) return 50;

  const ratio = metrics.closeRate / benchmark.avgCloseRate;

  if (ratio >= 1.3) return 100;
  if (ratio >= 1.0) return 70 + (ratio - 1.0) * 100;
  return clamp(ratio * 70);
}

/**
 * Score based on lead count consistency.
 * Compares current lead count against benchmark consistency.
 * Higher lead count relative to benchmark = higher score.
 */
export function calculateLeadConsistencyScore(
  metrics: MetricInput,
  benchmark: BenchmarkInput
): number {
  if (benchmark.avgLeadConsistency === 0) return 50;

  const ratio = metrics.leadCount / benchmark.avgLeadConsistency;

  if (ratio >= 1.5) return 100;
  if (ratio >= 1.0) return 70 + (ratio - 1.0) * 60;
  return clamp(ratio * 70);
}

/**
 * Revenue stability score.
 * Low variance between 7d and 30d trends = stable = high score.
 * High divergence = volatile = low score.
 */
export function calculateStabilityScore(metrics: MetricInput): number {
  const divergence = Math.abs(metrics.revenueTrend7d - metrics.revenueTrend30d);

  if (divergence <= 2) return 100;
  if (divergence <= 5) return 85;
  if (divergence <= 10) return 70;
  if (divergence <= 20) return 50;
  return clamp(30 - (divergence - 20));
}

/**
 * Follow-up efficiency score.
 * Lower delay hours vs benchmark = higher score.
 */
export function calculateFollowUpScore(
  metrics: MetricInput,
  benchmark: BenchmarkInput
): number {
  if (benchmark.avgFollowUpTime === 0) return 50;

  const ratio = metrics.followUpDelayHours / benchmark.avgFollowUpTime;

  if (ratio <= 0.5) return 100;
  if (ratio <= 1.0) return 100 - (ratio - 0.5) * 60;
  if (ratio <= 2.0) return 70 - (ratio - 1.0) * 40;
  return clamp(30 - (ratio - 2.0) * 15);
}

/**
 * Revenue leverage potential score.
 * Combines task completion rate and burnout risk.
 * High completion + low burnout = high leverage capacity.
 */
export function calculateLeverageScore(metrics: MetricInput): number {
  const completionScore = metrics.taskCompletionRate; // 0-100
  const burnoutPenalty = metrics.burnoutRiskScore * 0.5; // 0-50

  return clamp(completionScore - burnoutPenalty);
}

function getInterpretationBand(score: number): InterpretationBand {
  if (score >= 85) return "Highly Efficient";
  if (score >= 70) return "Stable but Optimizable";
  if (score >= 50) return "Revenue Constrained";
  return "Structural Revenue Risk";
}

export function calculateRevenueHealthScore(
  metrics: MetricInput,
  benchmark: BenchmarkInput
): RevenueHealthResult {
  const componentBreakdown: ComponentBreakdown = {
    trend: Math.round(calculateTrendScore(metrics) * 10) / 10,
    conversion: Math.round(calculateConversionScore(metrics, benchmark) * 10) / 10,
    leadConsistency: Math.round(calculateLeadConsistencyScore(metrics, benchmark) * 10) / 10,
    stability: Math.round(calculateStabilityScore(metrics) * 10) / 10,
    followUp: Math.round(calculateFollowUpScore(metrics, benchmark) * 10) / 10,
    leverage: Math.round(calculateLeverageScore(metrics) * 10) / 10,
  };

  const totalScore = Math.round(
    componentBreakdown.trend * WEIGHTS.trend +
    componentBreakdown.conversion * WEIGHTS.conversion +
    componentBreakdown.leadConsistency * WEIGHTS.leadConsistency +
    componentBreakdown.stability * WEIGHTS.stability +
    componentBreakdown.followUp * WEIGHTS.followUp +
    componentBreakdown.leverage * WEIGHTS.leverage
  );

  const weakestComponent = (
    Object.entries(componentBreakdown) as [keyof ComponentBreakdown, number][]
  ).reduce((min, [key, val]) => (val < min[1] ? [key, val] : min))[0] as keyof ComponentBreakdown;

  return {
    totalScore: clamp(totalScore),
    componentBreakdown,
    weakestComponent,
    interpretationBand: getInterpretationBand(totalScore),
  };
}
