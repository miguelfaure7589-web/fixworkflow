/**
 * Playbook Trigger Engine
 *
 * Evaluates which playbooks should fire based on a user's
 * RevenueProfile + RevenueHealthScoreResult.
 * Pure function — no DB calls.
 */

import type { RevenueInputs, BusinessTypeName, RevenueHealthScoreResult, PillarName } from "@/lib/revenue-health/types";

export interface PlaybookTriggerRule {
  // Pillar-based trigger
  pillar?: string;
  belowScore?: number;
  // Metric-based trigger
  metric?: string;
  below?: number;
  above?: number;
  // Optional business type filter
  businessTypes?: string[];
}

export interface PlaybookBase {
  id: string;
  slug: string;
  title: string;
  category: string;
  businessTypes: string[];
  triggerRule: PlaybookTriggerRule;
  baseSteps: { step: number; title: string; action: string }[];
  baseImpact: string;
  effortLevel: string;
}

export interface TriggeredPlaybook extends PlaybookBase {
  triggerReason: string;
  relevanceScore: number; // 0-100, higher = more relevant
}

/**
 * Evaluate whether a single trigger rule matches the user's data.
 * Returns { matched, reason, relevance }.
 */
function evaluateTriggerRule(
  rule: PlaybookTriggerRule,
  inputs: RevenueInputs,
  businessType: BusinessTypeName,
  scoreResult: RevenueHealthScoreResult | null,
): { matched: boolean; reason: string; relevance: number } {
  // Business type filter
  if (rule.businessTypes && rule.businessTypes.length > 0) {
    if (!rule.businessTypes.includes(businessType)) {
      return { matched: false, reason: "", relevance: 0 };
    }
  }

  // Pillar-based trigger
  if (rule.pillar && rule.belowScore !== undefined && scoreResult) {
    const pillarData = scoreResult.pillars[rule.pillar as PillarName];
    if (pillarData && pillarData.score < rule.belowScore) {
      const gap = rule.belowScore - pillarData.score;
      return {
        matched: true,
        reason: `Your ${rule.pillar} score is ${pillarData.score}/100 (below ${rule.belowScore}).`,
        relevance: Math.min(100, 50 + gap),
      };
    }
    return { matched: false, reason: "", relevance: 0 };
  }

  // Metric-based trigger
  if (rule.metric) {
    const metricValue = (inputs as Record<string, unknown>)[rule.metric];
    if (metricValue === undefined || metricValue === null) {
      return { matched: false, reason: "", relevance: 0 };
    }

    const val = Number(metricValue);
    if (Number.isNaN(val)) {
      return { matched: false, reason: "", relevance: 0 };
    }

    const metricLabel = rule.metric.replace(/([A-Z])/g, " $1").trim().toLowerCase();

    if (rule.below !== undefined && val < rule.below) {
      return {
        matched: true,
        reason: `Your ${metricLabel} is ${val}, below the ${rule.below} threshold.`,
        relevance: Math.min(100, 50 + Math.round(((rule.below - val) / rule.below) * 50)),
      };
    }

    if (rule.above !== undefined && val > rule.above) {
      return {
        matched: true,
        reason: `Your ${metricLabel} is ${val}, above the ${rule.above} threshold.`,
        relevance: Math.min(100, 50 + Math.round(((val - rule.above) / rule.above) * 50)),
      };
    }

    return { matched: false, reason: "", relevance: 0 };
  }

  return { matched: false, reason: "", relevance: 0 };
}

/**
 * Returns all playbooks that match the user's current data,
 * sorted by relevance (highest first).
 */
/** Maps profileGoal values to playbook categories for relevance boosting */
const GOAL_CATEGORY_MAP: Record<string, string[]> = {
  growing_revenue: ["revenue", "sales", "growth"],
  improving_profitability: ["profitability", "margins", "costs"],
  reducing_churn: ["retention", "churn", "loyalty"],
  acquiring_customers: ["acquisition", "marketing", "leads"],
  streamlining_operations: ["operations", "ops", "efficiency"],
};

export function getTriggeredPlaybooks(
  allPlaybooks: PlaybookBase[],
  inputs: RevenueInputs,
  businessType: BusinessTypeName,
  scoreResult: RevenueHealthScoreResult | null,
  profileGoal?: string | null,
): TriggeredPlaybook[] {
  const triggered: TriggeredPlaybook[] = [];

  for (const pb of allPlaybooks) {
    // Filter by business type support
    if (pb.businessTypes.length > 0 && !pb.businessTypes.includes(businessType)) {
      continue;
    }

    const rule = pb.triggerRule as PlaybookTriggerRule;
    const result = evaluateTriggerRule(rule, inputs, businessType, scoreResult);

    if (result.matched) {
      let boostedRelevance = result.relevance;

      // Apply +15 relevance boost if playbook category aligns with user's profile goal
      if (profileGoal && GOAL_CATEGORY_MAP[profileGoal]) {
        const goalCategories = GOAL_CATEGORY_MAP[profileGoal];
        if (goalCategories.some((cat) => pb.category.toLowerCase().includes(cat))) {
          boostedRelevance = Math.min(100, boostedRelevance + 15);
        }
      }

      triggered.push({
        ...pb,
        triggerReason: result.reason,
        relevanceScore: boostedRelevance,
      });
    }
  }

  // Sort by relevance descending
  triggered.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return triggered;
}
