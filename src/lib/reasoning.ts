/**
 * Reasoning Transparency — Generator Functions
 *
 * Pure functions that explain WHY each dashboard recommendation exists.
 * Uses the same weight matrix and defaults as the scoring engine
 * but never modifies scoring logic.
 */

// ── Weight matrix (mirrors engine.ts) ──

const WEIGHT_MATRIX: Record<string, Record<string, number>> = {
  ecommerce:      { revenue: 0.25, profitability: 0.20, retention: 0.20, acquisition: 0.25, ops: 0.10 },
  saas:           { revenue: 0.20, profitability: 0.20, retention: 0.30, acquisition: 0.15, ops: 0.15 },
  service_agency: { revenue: 0.25, profitability: 0.15, retention: 0.20, acquisition: 0.10, ops: 0.30 },
  creator:        { revenue: 0.20, profitability: 0.15, retention: 0.25, acquisition: 0.30, ops: 0.10 },
  local_business: { revenue: 0.30, profitability: 0.20, retention: 0.15, acquisition: 0.15, ops: 0.20 },
};

export const DEFAULT_SCORES: Record<string, number> = {
  revenue: 30,
  profitability: 30,
  retention: 40,
  acquisition: 35,
  ops: 45,
};

const PILLAR_LABELS: Record<string, string> = {
  revenue: "Revenue",
  profitability: "Profitability",
  retention: "Retention",
  acquisition: "Acquisition",
  ops: "Operations",
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  saas: "SaaS",
  service_agency: "Service/Agency",
  creator: "Creator",
  local_business: "Local Business",
};

export const PILLAR_FIELDS: Record<string, string[]> = {
  revenue: ["revenueMonthly", "avgOrderValue"],
  profitability: ["grossMarginPct", "netProfitMonthly", "cac", "ltv", "runwayMonths"],
  retention: ["churnMonthlyPct", "ltv"],
  acquisition: ["trafficMonthly", "conversionRatePct", "cac"],
  ops: ["opsHoursPerWeek", "fulfillmentDays", "supportTicketsPerWeek"],
};

export const FIELD_LABELS: Record<string, string> = {
  revenueMonthly: "Monthly Revenue",
  avgOrderValue: "Avg Order Value",
  grossMarginPct: "Gross Margin %",
  netProfitMonthly: "Net Profit Monthly",
  cac: "CAC",
  ltv: "LTV",
  runwayMonths: "Runway (months)",
  churnMonthlyPct: "Monthly Churn %",
  trafficMonthly: "Monthly Traffic",
  conversionRatePct: "Conversion Rate %",
  opsHoursPerWeek: "Ops Hours / Week",
  fulfillmentDays: "Fulfillment Days",
  supportTicketsPerWeek: "Support Tickets / Week",
};

// ── Shared types ──

interface PillarScore {
  score: number;
  reasons: string[];
  levers: string[];
}

function getWeights(businessType: string): Record<string, number> {
  return WEIGHT_MATRIX[businessType] ?? WEIGHT_MATRIX.service_agency;
}

// ── 1. Primary Risk ──

export function generateRiskReasoning(
  pillarScores: Record<string, PillarScore>,
  businessType: string,
): string {
  const weights = getWeights(businessType);
  const sorted = Object.entries(pillarScores).sort(
    ([, a], [, b]) => a.score - b.score,
  );
  const [worstPillar, worstData] = sorted[0];
  const weightPct = Math.round((weights[worstPillar] ?? 0) * 100);
  const btLabel = BUSINESS_TYPE_LABELS[businessType] || businessType;
  const pillarLabel = PILLAR_LABELS[worstPillar] || worstPillar;

  const parts: string[] = [];
  parts.push(
    `${pillarLabel} is your lowest-scoring pillar at ${worstData.score}/100.`,
  );
  parts.push(
    `For ${btLabel} businesses, it carries a ${weightPct}% weight in your overall score.`,
  );

  if (worstData.reasons.length > 0) {
    parts.push(worstData.reasons[0]);
  }

  if (worstData.reasons.some((r) => r.includes("estimated"))) {
    parts.push(
      "This score is estimated — adding real data may change the risk picture.",
    );
  }

  return parts.join(" ");
}

// ── 2. Fastest Lever ──

export function generateLeverReasoning(
  pillarScores: Record<string, PillarScore>,
  businessType: string,
): { text: string; potential: string } {
  const weights = getWeights(businessType);
  const sorted = Object.entries(pillarScores)
    .filter(([, p]) => p.levers.length > 0)
    .sort(([, a], [, b]) => a.score - b.score);

  const btLabel = BUSINESS_TYPE_LABELS[businessType] || businessType;

  if (sorted.length === 0) {
    return {
      text: "Focus on the pillar with the lowest score for the biggest impact.",
      potential: "Improvement depends on data added",
    };
  }

  const [leverPillar, leverData] = sorted[0];
  const pillarLabel = PILLAR_LABELS[leverPillar] || leverPillar;
  const weightPct = Math.round((weights[leverPillar] ?? 0) * 100);
  const gap = Math.max(0, 70 - leverData.score);
  const potentialPts = Math.round(gap * (weights[leverPillar] ?? 0.2));

  const parts: string[] = [];
  parts.push(
    `${pillarLabel} (${leverData.score}/100) has the most room for improvement.`,
  );
  parts.push(
    `With a ${weightPct}% weight for ${btLabel}, improving this pillar has a high multiplier effect on your overall score.`,
  );
  if (leverData.levers.length > 0) {
    parts.push(leverData.levers[0]);
  }

  return {
    text: parts.join(" "),
    potential:
      potentialPts > 0
        ? `+${potentialPts} pts potential overall improvement`
        : "Improvement possible with better inputs",
  };
}

// ── 3. Pillar Assumptions (Estimated badge) ──

export function generatePillarAssumptions(
  pillarName: string,
  pillarScore: number,
  businessType: string,
  missingData: string[],
): { text: string; fields: string[] } | null {
  const pillarFields = PILLAR_FIELDS[pillarName] ?? [];
  const missingForPillar = pillarFields.filter((f) => missingData.includes(f));

  if (missingForPillar.length === 0) return null;

  const defaultScore = DEFAULT_SCORES[pillarName] ?? 30;
  const weights = getWeights(businessType);
  const weightPct = Math.round((weights[pillarName] ?? 0) * 100);
  const pillarLabel = PILLAR_LABELS[pillarName] || pillarName;
  const fieldLabels = missingForPillar.map((f) => FIELD_LABELS[f] || f);

  const allMissing = missingForPillar.length === pillarFields.length;

  let text: string;
  if (allMissing) {
    text = `This score defaults to ${defaultScore}/100 because no ${pillarLabel.toLowerCase()} data was provided. It carries ${weightPct}% weight. Add ${fieldLabels.join(", ")} for an accurate score.`;
  } else {
    text = `Missing ${fieldLabels.join(", ")} — the score uses conservative defaults for these. Adding them will sharpen your ${pillarLabel.toLowerCase()} score (${weightPct}% weight).`;
  }

  return { text, fields: missingForPillar };
}

// ── 4. Playbook Trigger ──

export function generatePlaybookTriggerReasoning(
  playbook: { category: string; triggerReason: string },
  pillarScores: Record<string, PillarScore>,
  businessType: string,
): string {
  const weights = getWeights(businessType);
  const category = playbook.category;
  const pillar = pillarScores[category];
  const pillarLabel = PILLAR_LABELS[category] || category;
  const btLabel = BUSINESS_TYPE_LABELS[businessType] || businessType;
  const weightPct = Math.round((weights[category] ?? 0) * 100);

  const parts: string[] = [];
  parts.push(playbook.triggerReason);
  if (pillar) {
    parts.push(
      `${pillarLabel} carries ${weightPct}% weight for ${btLabel} businesses, making this a high-priority area.`,
    );
    if (pillar.score < 50) {
      parts.push(
        "This is in the critical zone — addressing it first will have the most impact.",
      );
    }
  }

  return parts.join(" ");
}

// ── 5. Playbook Step ──

export function generateStepReasoning(
  step: { title: string; action: string },
  businessType: string,
  pillarScores: Record<string, PillarScore>,
  playbookCategory: string,
): { text: string; potential: string } {
  const weights = getWeights(businessType);
  const pillar = pillarScores[playbookCategory];
  const pillarLabel = PILLAR_LABELS[playbookCategory] || playbookCategory;
  const weightPct = Math.round((weights[playbookCategory] ?? 0) * 100);

  const parts: string[] = [];
  parts.push(step.action);
  if (pillar) {
    parts.push(
      `This directly targets your ${pillarLabel.toLowerCase()} pillar (${pillar.score}/100, ${weightPct}% weight).`,
    );
  }

  const gap = pillar ? Math.max(0, 70 - pillar.score) : 10;
  const perStep = Math.max(1, Math.round(gap * 0.05));

  return {
    text: parts.join(" "),
    potential: `~${perStep}-${perStep * 2} pts pillar improvement`,
  };
}

// ── 6. Tool Recommendation ──

export function generateToolReasoning(
  tool: { name: string; category: string; whyItFits: string; pillar: string },
  pillarScores: Record<string, PillarScore>,
  businessType: string,
): { text: string; impact: string } {
  const weights = getWeights(businessType);
  const pillar = pillarScores[tool.pillar];
  const pillarLabel = PILLAR_LABELS[tool.pillar] || tool.pillar;
  const weightPct = Math.round((weights[tool.pillar] ?? 0) * 100);

  const parts: string[] = [];
  parts.push(tool.whyItFits);
  if (pillar) {
    parts.push(
      `Your ${pillarLabel.toLowerCase()} pillar is at ${pillar.score}/100 (${weightPct}% weight) — this tool helps address that gap.`,
    );
  }

  const gap = pillar ? Math.max(0, 70 - pillar.score) : 0;
  const potentialPts =
    gap > 0 ? Math.round(gap * (weights[tool.pillar] ?? 0.2)) : 0;

  return {
    text: parts.join(" "),
    impact:
      potentialPts > 0
        ? `Improving ${pillarLabel} could add +${potentialPts} pts to overall score`
        : `Targets ${pillarLabel} pillar`,
  };
}

// ── 7. Next Playbook (Results phase) ──

export function generateNextPlaybookReasoning(
  afterPillarScores: Record<string, PillarScore>,
  businessType: string,
  nextPlaybook: { title: string; category: string } | null,
  currentCategory: string,
): string {
  const weights = getWeights(businessType);

  const sorted = Object.entries(afterPillarScores)
    .filter(([name]) => name !== currentCategory)
    .sort(([, a], [, b]) => a.score - b.score);

  if (sorted.length === 0)
    return "Keep monitoring your metrics for new opportunities.";

  const [weakestName, weakestData] = sorted[0];
  const pillarLabel = PILLAR_LABELS[weakestName] || weakestName;
  const weightPct = Math.round((weights[weakestName] ?? 0) * 100);

  const parts: string[] = [];
  parts.push(
    `${pillarLabel} is now your weakest pillar at ${weakestData.score}/100 (${weightPct}% weight).`,
  );

  if (nextPlaybook) {
    parts.push(
      `"${nextPlaybook.title}" targets this area and will have the highest impact on your overall score next.`,
    );
  } else {
    parts.push(
      "Improving this pillar will have the highest marginal impact on your overall score.",
    );
  }

  return parts.join(" ");
}

// ── 8. Estimated Pillar Detail ──

const DEFAULT_FIELD_VALUES: Record<string, { value: string; reason: string }> = {
  revenueMonthly: { value: "estimated from onboarding range", reason: "Using midpoint of your selected revenue range" },
  avgOrderValue: { value: "not provided", reason: "Median for your business type" },
  grossMarginPct: { value: "not provided", reason: "Industry median used as conservative estimate" },
  netProfitMonthly: { value: "not provided", reason: "Cannot calculate without gross margin data" },
  cac: { value: "not provided", reason: "Industry benchmark for your business type" },
  ltv: { value: "not provided", reason: "Estimated from revenue and churn assumptions" },
  runwayMonths: { value: "not provided", reason: "Not factored — add for profitability accuracy" },
  churnMonthlyPct: { value: "not provided", reason: "Industry average used as baseline" },
  trafficMonthly: { value: "not provided", reason: "Cannot calculate acquisition funnel without this" },
  conversionRatePct: { value: "not provided", reason: "Industry median for your business type" },
  opsHoursPerWeek: { value: "not provided", reason: "Using conservative default (higher hours = lower score)" },
  fulfillmentDays: { value: "not provided", reason: "Industry average for your business type" },
  supportTicketsPerWeek: { value: "not provided", reason: "Assumed moderate volume" },
};

export interface EstimatedFieldDetail {
  field: string;
  label: string;
  assumedValue: string;
  reason: string;
}

export function generateEstimatedPillarDetails(
  pillarName: string,
  pillarScore: number,
  businessType: string,
  missingData: string[],
): { fields: EstimatedFieldDetail[]; impact: string } | null {
  const pillarFields = PILLAR_FIELDS[pillarName] ?? [];
  const missingForPillar = pillarFields.filter((f) => missingData.includes(f));

  if (missingForPillar.length === 0) return null;

  const defaultScore = DEFAULT_SCORES[pillarName] ?? 30;
  const btLabel = BUSINESS_TYPE_LABELS[businessType] || businessType;
  const pillarLabel = PILLAR_LABELS[pillarName] || pillarName;
  const allMissing = missingForPillar.length === pillarFields.length;

  const fields = missingForPillar.map((f) => ({
    field: f,
    label: FIELD_LABELS[f] || f,
    assumedValue: DEFAULT_FIELD_VALUES[f]?.value || "not provided",
    reason: DEFAULT_FIELD_VALUES[f]?.reason || `Median for ${btLabel} businesses`,
  }));

  const impact = allMissing
    ? `This pillar defaults to ${defaultScore}/100 with no real data. Your real ${pillarLabel.toLowerCase()} score could be 10-15 points higher with actual metrics.`
    : `${missingForPillar.length} of ${pillarFields.length} fields estimated. Adding real values could shift your ${pillarLabel.toLowerCase()} score by 5-15 points.`;

  return { fields, impact };
}
