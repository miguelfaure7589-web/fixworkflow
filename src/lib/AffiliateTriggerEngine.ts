import { prisma } from "./prisma";
import type { BottleneckResult } from "./BottleneckDetector";
import type { BenchmarkComparison } from "./BenchmarkEngine";

export interface AffiliateRecommendation {
  tool: string;
  reason: string;
  bottleneckType: string;
  metricGap: number;
}

// Hardcoded trigger rules mapping bottlenecks to tools.
// DB AffiliateTrigger records override these when present.
const DEFAULT_TRIGGERS: {
  bottleneckType: string;
  recommendedTool: string;
  reason: string;
  metricGapThreshold: number;
}[] = [
  {
    bottleneckType: "Acquisition",
    recommendedTool: "semrush",
    reason: "Lead acquisition below benchmark. SEO/content pipeline needs visibility tooling.",
    metricGapThreshold: 10,
  },
  {
    bottleneckType: "Acquisition",
    recommendedTool: "convertkit",
    reason: "Lead nurturing gap. Email automation captures and converts inbound leads.",
    metricGapThreshold: 5,
  },
  {
    bottleneckType: "Conversion",
    recommendedTool: "close",
    reason: "Close rate below benchmark. CRM with built-in calling and pipeline tracking.",
    metricGapThreshold: 5,
  },
  {
    bottleneckType: "Conversion",
    recommendedTool: "calendly",
    reason: "Follow-up delay contributing to conversion leak. Scheduling automation reduces friction.",
    metricGapThreshold: 3,
  },
  {
    bottleneckType: "Follow-Up Leak",
    recommendedTool: "pipedrive",
    reason: "Follow-up delay exceeds benchmark. Pipeline CRM with activity reminders.",
    metricGapThreshold: 5,
  },
  {
    bottleneckType: "Follow-Up Leak",
    recommendedTool: "calendly",
    reason: "Scheduling friction adds delay to follow-up cycle.",
    metricGapThreshold: 3,
  },
  {
    bottleneckType: "Operational Overload",
    recommendedTool: "clickup",
    reason: "Task completion low with high burnout risk. Project management reduces operational drag.",
    metricGapThreshold: 10,
  },
  {
    bottleneckType: "Operational Overload",
    recommendedTool: "zapier",
    reason: "Manual task overload. Workflow automation eliminates repetitive operations.",
    metricGapThreshold: 5,
  },
  {
    bottleneckType: "Content Gap",
    recommendedTool: "jasper",
    reason: "Content frequency below threshold. AI content generation maintains publishing cadence.",
    metricGapThreshold: 3,
  },
  {
    bottleneckType: "Sales Optimization",
    recommendedTool: "gong",
    reason: "Revenue growing but close rate trails benchmark. Conversation intelligence identifies leak points.",
    metricGapThreshold: 5,
  },
  {
    bottleneckType: "Capacity Constraint",
    recommendedTool: "notion",
    reason: "Task capacity maxed. Knowledge management and SOPs free bandwidth.",
    metricGapThreshold: 10,
  },
  {
    bottleneckType: "Pricing Inefficiency",
    recommendedTool: "stripe",
    reason: "Deal value underperforming. Billing infrastructure supports pricing experiments.",
    metricGapThreshold: 5,
  },
];

/**
 * Resolve affiliate triggers from DB first, fall back to hardcoded defaults.
 * Only triggers tools tied to detected bottlenecks with sufficient metric gap.
 */
export async function resolveAffiliateTriggers(
  bottleneck: BottleneckResult,
  benchmarkComparison: BenchmarkComparison
): Promise<AffiliateRecommendation[]> {
  const allBottlenecks = [
    bottleneck.primaryBottleneck,
    ...bottleneck.secondaryBottlenecks,
  ];

  // Try DB triggers first
  const dbTriggers = await prisma.affiliateTrigger.findMany({
    where: {
      bottleneckType: { in: allBottlenecks },
    },
  });

  const triggers =
    dbTriggers.length > 0
      ? dbTriggers.map((t) => ({
          bottleneckType: t.bottleneckType,
          recommendedTool: t.recommendedTool,
          reason: t.reason,
          metricGapThreshold: t.metricGapThreshold,
        }))
      : DEFAULT_TRIGGERS;

  const metricGap = benchmarkComparison.revenueGap;
  const recommendations: AffiliateRecommendation[] = [];
  const seenTools = new Set<string>();

  for (const trigger of triggers) {
    if (!allBottlenecks.includes(trigger.bottleneckType)) continue;
    if (metricGap < trigger.metricGapThreshold) continue;
    if (seenTools.has(trigger.recommendedTool)) continue;

    seenTools.add(trigger.recommendedTool);
    recommendations.push({
      tool: trigger.recommendedTool,
      reason: trigger.reason,
      bottleneckType: trigger.bottleneckType,
      metricGap,
    });
  }

  return recommendations;
}
