/**
 * Deterministic rationale generator.
 * Produces 2-4 bullet reasons explaining why a prompt is recommended
 * based on business type, pillar scores, and key metrics.
 *
 * NOT AI-generated — purely rule-based.
 */

interface RationaleInputs {
  businessType: string | null;
  healthScore: number;
  pillarScores: Record<string, number>;
  primaryRisk: string;
  fastestLever: string;
  revenueMonthly?: number;
  grossMarginPct?: number;
  churnMonthlyPct?: number;
  conversionRatePct?: number;
  opsHoursPerWeek?: number;
  supportTicketsPerWeek?: number;
  cac?: number;
  ltv?: number;
  avgOrderValue?: number;
  trafficMonthly?: number;
}

const PILLAR_LABELS: Record<string, string> = {
  revenue: "Revenue",
  profitability: "Profitability",
  retention: "Retention",
  acquisition: "Acquisition",
  ops: "Operations",
};

function getWeakestPillar(scores: Record<string, number>): [string, number] {
  let worst: [string, number] = ["revenue", 100];
  for (const [k, v] of Object.entries(scores)) {
    if (v < worst[1]) worst = [k, v];
  }
  return worst;
}

export function generateRationale(
  category: string,
  inputs: RationaleInputs,
): string[] {
  const bullets: string[] = [];
  const [weakestPillar, weakestScore] = getWeakestPillar(inputs.pillarScores);

  // Always mention the relevant pillar score
  const categoryPillarMap: Record<string, string> = {
    ops: "ops",
    revenue: "revenue",
    acquisition: "acquisition",
    retention: "retention",
    profitability: "profitability",
    tools: weakestPillar,
    planning: weakestPillar,
  };
  const relevantPillar = categoryPillarMap[category] ?? weakestPillar;
  const pillarScore = inputs.pillarScores[relevantPillar] ?? weakestScore;

  bullets.push(
    `Your ${PILLAR_LABELS[relevantPillar] ?? relevantPillar} pillar scores ${pillarScore}/100 — ${pillarScore < 40 ? "critical" : pillarScore < 60 ? "needs improvement" : "room to optimize"}.`
  );

  // Category-specific metric bullets
  if (category === "ops") {
    if (inputs.opsHoursPerWeek !== undefined && inputs.opsHoursPerWeek > 30) {
      bullets.push(`You're spending ${inputs.opsHoursPerWeek} hrs/week on ops — above the 25-hour target.`);
    }
    if (inputs.supportTicketsPerWeek !== undefined && inputs.supportTicketsPerWeek > 20) {
      bullets.push(`${inputs.supportTicketsPerWeek} support tickets/week suggests process gaps.`);
    }
  }

  if (category === "revenue" || category === "profitability") {
    if (inputs.revenueMonthly !== undefined && inputs.revenueMonthly < 5000) {
      bullets.push(`Revenue at $${inputs.revenueMonthly.toLocaleString()}/mo — early stage, high impact from small wins.`);
    }
    if (inputs.grossMarginPct !== undefined && inputs.grossMarginPct < 50) {
      bullets.push(`Gross margin at ${inputs.grossMarginPct}% is below the 50% healthy threshold.`);
    }
    if (inputs.avgOrderValue !== undefined && inputs.avgOrderValue < 50) {
      bullets.push(`AOV at $${inputs.avgOrderValue} — bundles and upsells could move this fast.`);
    }
  }

  if (category === "acquisition") {
    if (inputs.conversionRatePct !== undefined && inputs.conversionRatePct < 2) {
      bullets.push(`Conversion rate at ${inputs.conversionRatePct}% — below the 2% baseline.`);
    }
    if (inputs.trafficMonthly !== undefined && inputs.trafficMonthly < 2000) {
      bullets.push(`Only ${inputs.trafficMonthly.toLocaleString()} monthly visitors — limited top-of-funnel.`);
    }
    if (inputs.cac !== undefined && inputs.cac > 100) {
      bullets.push(`CAC at $${inputs.cac} is high — organic channels could help.`);
    }
  }

  if (category === "retention") {
    if (inputs.churnMonthlyPct !== undefined && inputs.churnMonthlyPct > 5) {
      bullets.push(`Monthly churn at ${inputs.churnMonthlyPct}% — above the 5% danger zone.`);
    }
    if (inputs.ltv !== undefined && inputs.cac !== undefined) {
      const ratio = inputs.ltv / Math.max(inputs.cac, 1);
      if (ratio < 3) {
        bullets.push(`LTV:CAC ratio is ${ratio.toFixed(1)}x — below the 3x target.`);
      }
    }
  }

  // Fastest lever as final bullet (always relevant)
  if (bullets.length < 4 && inputs.fastestLever) {
    bullets.push(`Fastest lever: ${inputs.fastestLever.slice(0, 120)}${inputs.fastestLever.length > 120 ? "..." : ""}`);
  }

  return bullets.slice(0, 4);
}

/**
 * Maps prompt categories to relevant dashboard sections.
 */
export const CATEGORY_PROMPT_MAP: Record<string, { slug: string; label: string; visibility: "FREE" | "PREMIUM" }[]> = {
  ops: [
    { slug: "ops_sop_builder", label: "Build SOP", visibility: "FREE" },
    { slug: "ops_automation_plan", label: "Automation Plan", visibility: "PREMIUM" },
    { slug: "weekly_focus_plan", label: "Weekly Plan", visibility: "PREMIUM" },
  ],
  revenue: [
    { slug: "revenue_offer_design", label: "Design Offer", visibility: "FREE" },
    { slug: "revenue_promo_campaign", label: "Promo Campaign", visibility: "PREMIUM" },
    { slug: "weekly_focus_plan", label: "Weekly Plan", visibility: "PREMIUM" },
  ],
  profitability: [
    { slug: "pricing_aov_increase", label: "Increase AOV", visibility: "PREMIUM" },
    { slug: "revenue_offer_design", label: "Design Offer", visibility: "FREE" },
  ],
  acquisition: [
    { slug: "acquisition_funnel_audit", label: "Funnel Audit", visibility: "FREE" },
    { slug: "acquisition_landing_copy", label: "Landing Copy", visibility: "PREMIUM" },
    { slug: "weekly_focus_plan", label: "Weekly Plan", visibility: "PREMIUM" },
  ],
  retention: [
    { slug: "retention_reduce_churn", label: "Reduce Churn", visibility: "PREMIUM" },
    { slug: "weekly_focus_plan", label: "Weekly Plan", visibility: "PREMIUM" },
  ],
  tools: [
    { slug: "tool_compare", label: "Compare Tools", visibility: "FREE" },
    { slug: "weekly_focus_plan", label: "Weekly Plan", visibility: "PREMIUM" },
  ],
  planning: [
    { slug: "weekly_focus_plan", label: "Weekly Plan", visibility: "PREMIUM" },
    { slug: "ops_sop_builder", label: "Build SOP", visibility: "FREE" },
  ],
};
