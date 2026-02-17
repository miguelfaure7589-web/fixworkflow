import type { MetricInput, BenchmarkInput } from "./RevenueHealthCalculator";

export interface BottleneckResult {
  primaryBottleneck: string;
  secondaryBottlenecks: string[];
  severityScore: number;
}

interface Rule {
  id: string;
  label: string;
  severity: number;
  test: (metrics: MetricInput, benchmark: BenchmarkInput) => boolean;
}

const PRIMARY_RULES: Rule[] = [
  {
    id: "conversion_decline",
    label: "Conversion",
    severity: 90,
    test: (m, _b) => m.revenueTrend30d < -10 && m.leadCount > 0,
  },
  {
    id: "acquisition_decline",
    label: "Acquisition",
    severity: 95,
    test: (m, b) =>
      m.revenueTrend30d < -10 && m.leadCount < b.avgLeadConsistency * 0.7,
  },
  {
    id: "operational_overload",
    label: "Operational Overload",
    severity: 80,
    test: (m, _b) =>
      m.revenueTrend7d >= -5 &&
      m.revenueTrend7d <= 5 &&
      m.burnoutRiskScore >= 70,
  },
  {
    id: "follow_up_leak",
    label: "Follow-Up Leak",
    severity: 75,
    test: (m, b) => m.followUpDelayHours > b.avgFollowUpTime * 2,
  },
  {
    id: "pricing_inefficiency",
    label: "Pricing Inefficiency",
    severity: 70,
    test: (m, b) =>
      m.closeRate >= b.avgCloseRate * 0.9 &&
      m.revenueTrend30d < 0 &&
      m.averageDealValue < m.revenue / Math.max(m.leadCount * m.closeRate, 1) * 0.7,
  },
];

const SECONDARY_RULES: Rule[] = [
  {
    id: "sales_optimization",
    label: "Sales Optimization",
    severity: 50,
    test: (m, b) => m.revenueTrend30d > 0 && m.closeRate < b.avgCloseRate,
  },
  {
    id: "lead_quality",
    label: "Lead Quality",
    severity: 45,
    test: (m, b) =>
      m.leadCount >= b.avgLeadConsistency && m.closeRate < b.avgCloseRate * 0.6,
  },
  {
    id: "content_gap",
    label: "Content Gap",
    severity: 40,
    test: (m, _b) => m.contentFrequency < 2,
  },
  {
    id: "capacity_constraint",
    label: "Capacity Constraint",
    severity: 55,
    test: (m, _b) => m.taskCompletionRate < 50 && m.burnoutRiskScore > 60,
  },
  {
    id: "revenue_concentration",
    label: "Revenue Concentration Risk",
    severity: 60,
    test: (m, _b) =>
      m.leadCount <= 3 && m.averageDealValue > m.revenue * 0.4,
  },
];

export function detectBottlenecks(
  metrics: MetricInput,
  benchmark: BenchmarkInput
): BottleneckResult {
  // Evaluate primary rules — highest severity match wins
  const matchedPrimary = PRIMARY_RULES
    .filter((rule) => rule.test(metrics, benchmark))
    .sort((a, b) => b.severity - a.severity);

  // Evaluate secondary rules
  const matchedSecondary = SECONDARY_RULES
    .filter((rule) => rule.test(metrics, benchmark))
    .sort((a, b) => b.severity - a.severity);

  const primaryBottleneck =
    matchedPrimary.length > 0
      ? matchedPrimary[0].label
      : matchedSecondary.length > 0
        ? matchedSecondary[0].label
        : "None Detected";

  const primaryLabel = matchedPrimary[0]?.label;
  const secondaryBottlenecks = [
    ...matchedPrimary.slice(1).map((r) => r.label),
    ...matchedSecondary.map((r) => r.label),
  ].filter((label) => label !== primaryLabel);

  const severityScore =
    matchedPrimary.length > 0
      ? matchedPrimary[0].severity
      : matchedSecondary.length > 0
        ? matchedSecondary[0].severity
        : 0;

  return {
    primaryBottleneck,
    secondaryBottlenecks,
    severityScore,
  };
}
