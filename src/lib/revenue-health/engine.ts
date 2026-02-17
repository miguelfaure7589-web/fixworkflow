/**
 * Revenue Health Score — Scoring Engine
 *
 * Pure function: no DB calls, no external services.
 * Accepts RevenueInputs, returns RevenueHealthScoreResult.
 */

import type {
  RevenueInputs,
  RevenueHealthScoreResult,
  PillarResult,
  PillarName,
  NextStep,
  BusinessTypeName,
} from "./types";

// ── Helpers ──

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function has(v: number | undefined): v is number {
  return v !== undefined && v !== null && !Number.isNaN(v);
}

// ── Business-Type Adaptive Pillar Weights ──

const WEIGHT_MATRIX: Record<BusinessTypeName, Record<PillarName, number>> = {
  ecommerce:      { revenue: 0.25, profitability: 0.20, retention: 0.20, acquisition: 0.25, ops: 0.10 },
  saas:           { revenue: 0.20, profitability: 0.20, retention: 0.30, acquisition: 0.15, ops: 0.15 },
  service_agency: { revenue: 0.25, profitability: 0.15, retention: 0.20, acquisition: 0.10, ops: 0.30 },
  creator:        { revenue: 0.20, profitability: 0.15, retention: 0.25, acquisition: 0.30, ops: 0.10 },
  local_business: { revenue: 0.30, profitability: 0.20, retention: 0.15, acquisition: 0.15, ops: 0.20 },
};

const DEFAULT_BUSINESS_TYPE: BusinessTypeName = "service_agency";

function getWeights(businessType?: BusinessTypeName): Record<PillarName, number> {
  return WEIGHT_MATRIX[businessType ?? DEFAULT_BUSINESS_TYPE];
}

// ── Revenue Pillar ──

function scoreRevenue(i: RevenueInputs): PillarResult {
  const reasons: string[] = [];
  const levers: string[] = [];
  const scores: number[] = [];

  if (has(i.revenueMonthly)) {
    // Rough tier: <1k=20, 1-5k=40, 5-15k=60, 15-50k=75, 50k+=90
    let s: number;
    if (i.revenueMonthly < 1000) { s = 20; reasons.push("Monthly revenue is below $1k — early stage."); }
    else if (i.revenueMonthly < 5000) { s = 40; reasons.push("Revenue between $1k-$5k — gaining traction."); }
    else if (i.revenueMonthly < 15000) { s = 60; reasons.push("Revenue $5k-$15k — solid foundation."); }
    else if (i.revenueMonthly < 50000) { s = 75; reasons.push("Revenue $15k-$50k — scaling nicely."); }
    else { s = 90; reasons.push("Revenue above $50k/mo — strong position."); }
    scores.push(s);
  }

  // Infer revenue proxy from traffic * conversion * AOV
  if (has(i.trafficMonthly) && has(i.conversionRatePct) && has(i.avgOrderValue)) {
    const implied = i.trafficMonthly * (i.conversionRatePct / 100) * i.avgOrderValue;
    if (has(i.revenueMonthly) && implied > i.revenueMonthly * 1.3) {
      levers.push(`Traffic × conversion × AOV implies ~$${Math.round(implied).toLocaleString()}/mo potential — there may be unrealized revenue.`);
    }
  }

  if (has(i.avgOrderValue)) {
    const s = i.avgOrderValue >= 200 ? 80 : i.avgOrderValue >= 50 ? 60 : 35;
    scores.push(s);
    if (i.avgOrderValue < 50) levers.push("Increasing average order value (bundles, upsells) is a fast revenue lever.");
  }

  if (scores.length === 0) {
    reasons.push("No revenue data provided — score estimated conservatively.");
    return { score: 30, reasons, levers };
  }

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  if (avg >= 70 && levers.length === 0) levers.push("Consider diversifying revenue streams to reduce dependency risk.");
  return { score: clamp(avg), reasons, levers };
}

// ── Profitability Pillar ──

function scoreProfitability(i: RevenueInputs): PillarResult {
  const reasons: string[] = [];
  const levers: string[] = [];
  const scores: number[] = [];

  if (has(i.grossMarginPct)) {
    const s = i.grossMarginPct >= 70 ? 90
      : i.grossMarginPct >= 50 ? 70
      : i.grossMarginPct >= 30 ? 50
      : 25;
    scores.push(s);
    if (i.grossMarginPct < 50) {
      reasons.push(`Gross margin at ${i.grossMarginPct}% — below healthy threshold.`);
      levers.push("Review COGS and pricing to improve gross margin above 50%.");
    } else {
      reasons.push(`Gross margin at ${i.grossMarginPct}% — healthy.`);
    }
  }

  if (has(i.netProfitMonthly) && has(i.revenueMonthly) && i.revenueMonthly > 0) {
    const netPct = (i.netProfitMonthly / i.revenueMonthly) * 100;
    const s = netPct >= 20 ? 90 : netPct >= 10 ? 70 : netPct >= 0 ? 45 : 15;
    scores.push(s);
    if (netPct < 0) {
      reasons.push("Business is operating at a loss.");
      levers.push("Cut non-essential expenses or raise prices to reach break-even.");
    } else if (netPct < 10) {
      reasons.push(`Net profit margin at ${netPct.toFixed(1)}% — thin margins.`);
      levers.push("Target 15%+ net margin by reducing overhead or increasing price.");
    }
  }

  if (has(i.cac) && has(i.ltv)) {
    const ratio = i.ltv / Math.max(i.cac, 1);
    const s = ratio >= 5 ? 95 : ratio >= 3 ? 80 : ratio >= 1.5 ? 55 : 20;
    scores.push(s);
    if (ratio < 3) {
      reasons.push(`LTV:CAC ratio is ${ratio.toFixed(1)}x — should be 3x+.`);
      levers.push("Improve LTV through retention or reduce CAC through organic acquisition.");
    } else {
      reasons.push(`LTV:CAC ratio is ${ratio.toFixed(1)}x — efficient.`);
    }
  }

  if (has(i.runwayMonths)) {
    const s = i.runwayMonths >= 18 ? 90 : i.runwayMonths >= 12 ? 75 : i.runwayMonths >= 6 ? 50 : 20;
    scores.push(s);
    if (i.runwayMonths < 6) {
      reasons.push(`Only ${i.runwayMonths} months of runway — urgent.`);
      levers.push("Extend runway by cutting burn or securing revenue commitments.");
    }
  }

  if (scores.length === 0) {
    reasons.push("No profitability data provided — score estimated conservatively.");
    return { score: 30, reasons, levers };
  }

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return { score: clamp(avg), reasons, levers };
}

// ── Retention Pillar ──

function scoreRetention(i: RevenueInputs): PillarResult {
  const reasons: string[] = [];
  const levers: string[] = [];
  const scores: number[] = [];

  if (has(i.churnMonthlyPct)) {
    // <2% excellent, 2-5% ok, 5-10% concerning, >10% critical
    const s = i.churnMonthlyPct <= 2 ? 90
      : i.churnMonthlyPct <= 5 ? 70
      : i.churnMonthlyPct <= 10 ? 45
      : 15;
    scores.push(s);
    if (i.churnMonthlyPct > 5) {
      reasons.push(`Monthly churn at ${i.churnMonthlyPct}% — above healthy range.`);
      levers.push("Implement a churn-reduction campaign: exit surveys, win-back emails, better onboarding.");
    } else {
      reasons.push(`Monthly churn at ${i.churnMonthlyPct}% — well controlled.`);
    }
  }

  // Repeat purchase proxy: LTV / AOV
  if (has(i.ltv) && has(i.avgOrderValue) && i.avgOrderValue > 0) {
    const repeatOrders = i.ltv / i.avgOrderValue;
    const s = repeatOrders >= 5 ? 85 : repeatOrders >= 3 ? 65 : repeatOrders >= 1.5 ? 45 : 25;
    scores.push(s);
    if (repeatOrders < 3) {
      reasons.push(`Estimated ~${repeatOrders.toFixed(1)} orders per customer lifetime — low repeat rate.`);
      levers.push("Add post-purchase email sequences and loyalty incentives to boost repeat purchases.");
    }
  }

  if (scores.length === 0) {
    reasons.push("No retention data provided — score estimated conservatively.");
    return { score: 40, reasons, levers };
  }

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return { score: clamp(avg), reasons, levers };
}

// ── Acquisition Pillar ──

function scoreAcquisition(i: RevenueInputs): PillarResult {
  const reasons: string[] = [];
  const levers: string[] = [];
  const scores: number[] = [];

  if (has(i.trafficMonthly)) {
    const s = i.trafficMonthly >= 50000 ? 90
      : i.trafficMonthly >= 10000 ? 70
      : i.trafficMonthly >= 2000 ? 50
      : 25;
    scores.push(s);
    if (i.trafficMonthly < 2000) {
      reasons.push("Monthly traffic below 2k — limited top-of-funnel.");
      levers.push("Invest in content marketing or paid acquisition to drive traffic above 5k/mo.");
    }
  }

  if (has(i.conversionRatePct)) {
    const s = i.conversionRatePct >= 5 ? 90
      : i.conversionRatePct >= 3 ? 75
      : i.conversionRatePct >= 1 ? 50
      : 25;
    scores.push(s);
    if (i.conversionRatePct < 2) {
      reasons.push(`Conversion rate at ${i.conversionRatePct}% — below average.`);
      levers.push("A/B test landing pages, simplify checkout, add social proof to improve conversion.");
    } else {
      reasons.push(`Conversion rate at ${i.conversionRatePct}% — solid.`);
    }
  }

  if (has(i.cac)) {
    const s = i.cac <= 20 ? 90 : i.cac <= 50 ? 75 : i.cac <= 150 ? 55 : 25;
    scores.push(s);
    if (i.cac > 100) {
      reasons.push(`CAC at $${i.cac} — high. Watch unit economics.`);
      levers.push("Shift budget toward organic channels or referral programs to lower CAC.");
    }
  }

  if (scores.length === 0) {
    reasons.push("No acquisition data provided — score estimated conservatively.");
    return { score: 35, reasons, levers };
  }

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return { score: clamp(avg), reasons, levers };
}

// ── Ops Pillar ──

function scoreOps(i: RevenueInputs): PillarResult {
  const reasons: string[] = [];
  const levers: string[] = [];
  const scores: number[] = [];

  if (has(i.opsHoursPerWeek)) {
    // Lower is better relative to revenue. But also 0 might be wrong — normalize standalone.
    const s = i.opsHoursPerWeek <= 10 ? 90
      : i.opsHoursPerWeek <= 25 ? 70
      : i.opsHoursPerWeek <= 40 ? 50
      : 25;
    scores.push(s);
    if (i.opsHoursPerWeek > 30) {
      reasons.push(`Spending ${i.opsHoursPerWeek} hrs/wk on ops — high overhead.`);
      levers.push("Automate repetitive tasks (invoicing, reporting) to reclaim 10+ hrs/week.");
    } else {
      reasons.push(`Ops load at ${i.opsHoursPerWeek} hrs/wk — manageable.`);
    }
  }

  if (has(i.fulfillmentDays)) {
    const s = i.fulfillmentDays <= 1 ? 95
      : i.fulfillmentDays <= 3 ? 80
      : i.fulfillmentDays <= 7 ? 55
      : 25;
    scores.push(s);
    if (i.fulfillmentDays > 5) {
      reasons.push(`Fulfillment takes ${i.fulfillmentDays} days — slow.`);
      levers.push("Streamline fulfillment or switch to faster logistics partners.");
    }
  }

  if (has(i.supportTicketsPerWeek)) {
    // Context-dependent, but high ticket volume per revenue is a problem
    const s = i.supportTicketsPerWeek <= 5 ? 90
      : i.supportTicketsPerWeek <= 20 ? 70
      : i.supportTicketsPerWeek <= 50 ? 45
      : 20;
    scores.push(s);
    if (i.supportTicketsPerWeek > 30) {
      reasons.push(`${i.supportTicketsPerWeek} support tickets/week — indicating product or process issues.`);
      levers.push("Create a self-service knowledge base and fix top recurring ticket causes.");
    }
  }

  if (scores.length === 0) {
    reasons.push("No operational data provided — score estimated conservatively.");
    return { score: 45, reasons, levers };
  }

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return { score: clamp(avg), reasons, levers };
}

// ── Risk & Lever Identification ──

const PILLAR_RISK_LABELS: Record<PillarName, string> = {
  revenue: "revenue generation",
  profitability: "profitability and unit economics",
  retention: "customer retention",
  acquisition: "customer acquisition",
  ops: "operational efficiency",
};

function formatRisk(pillar: PillarName, score: number): string {
  if (score < 40) {
    return `Critical risk in ${PILLAR_RISK_LABELS[pillar]} (score: ${score}/100) — address immediately.`;
  }
  if (score < 60) {
    return `Primary risk area is ${PILLAR_RISK_LABELS[pillar]} (score: ${score}/100) — improvement needed.`;
  }
  return `All pillars above 60. Lowest is ${PILLAR_RISK_LABELS[pillar]} at ${score}/100 — optimize for growth.`;
}

function identifyPrimaryRisk(
  pillars: Record<PillarName, PillarResult>,
  inputs: RevenueInputs,
  businessType?: BusinessTypeName,
): string {
  const bt = businessType ?? DEFAULT_BUSINESS_TYPE;

  // Business-type-specific risk overrides
  if (bt === "saas") {
    if (has(inputs.churnMonthlyPct) && inputs.churnMonthlyPct > 8) {
      return formatRisk("retention", pillars.retention.score);
    }
    if (has(inputs.ltv) && has(inputs.cac) && inputs.ltv / Math.max(inputs.cac, 1) < 2) {
      return formatRisk("profitability", pillars.profitability.score);
    }
  }

  if (bt === "ecommerce") {
    if (has(inputs.conversionRatePct) && inputs.conversionRatePct < 2) {
      return formatRisk("acquisition", pillars.acquisition.score);
    }
    if (has(inputs.fulfillmentDays) && inputs.fulfillmentDays > 5) {
      return formatRisk("ops", pillars.ops.score);
    }
  }

  if (bt === "service_agency") {
    if (has(inputs.opsHoursPerWeek) && inputs.opsHoursPerWeek > 50) {
      return formatRisk("ops", pillars.ops.score);
    }
  }

  if (bt === "creator") {
    if (has(inputs.trafficMonthly) && inputs.trafficMonthly < 1000) {
      return formatRisk("acquisition", pillars.acquisition.score);
    }
  }

  if (bt === "local_business") {
    if (has(inputs.revenueMonthly) && inputs.revenueMonthly < 3000) {
      return formatRisk("revenue", pillars.revenue.score);
    }
  }

  // Default: lowest pillar score
  const sorted = (Object.entries(pillars) as [PillarName, PillarResult][])
    .sort((a, b) => a[1].score - b[1].score);
  const worst = sorted[0];
  return formatRisk(worst[0], worst[1].score);
}

function identifyFastestLever(
  pillars: Record<PillarName, PillarResult>,
  inputs: RevenueInputs,
  businessType?: BusinessTypeName,
): string {
  const bt = businessType ?? DEFAULT_BUSINESS_TYPE;

  // Business-type-specific fast levers
  if (bt === "saas" && has(inputs.churnMonthlyPct) && inputs.churnMonthlyPct > 5) {
    return "Reducing churn is your highest-leverage move — even 1% improvement compounds across your MRR base.";
  }
  if (bt === "ecommerce" && has(inputs.avgOrderValue) && inputs.avgOrderValue < 40) {
    return "Increasing average order value (bundles, upsells, free-shipping thresholds) is the fastest ecommerce lever.";
  }
  if (bt === "service_agency" && has(inputs.opsHoursPerWeek) && inputs.opsHoursPerWeek > 35) {
    return "Automate or delegate ops tasks to free up hours for billable client work — that's direct revenue recovery.";
  }
  if (bt === "creator" && has(inputs.conversionRatePct) && inputs.conversionRatePct < 2) {
    return "Optimizing your conversion funnel (landing pages, CTAs, email sequences) will monetize your existing audience faster.";
  }
  if (bt === "local_business" && has(inputs.trafficMonthly) && inputs.trafficMonthly < 2000) {
    return "Local SEO and Google Business Profile optimization can drive foot traffic and calls with minimal spend.";
  }

  // Default: find pillar with biggest gap that has actionable levers
  const sorted = (Object.entries(pillars) as [PillarName, PillarResult][])
    .filter(([, p]) => p.levers.length > 0)
    .sort((a, b) => a[1].score - b[1].score);

  if (sorted.length > 0) {
    return sorted[0][1].levers[0];
  }

  if (has(inputs.conversionRatePct) && inputs.conversionRatePct < 3) {
    return "Improving conversion rate is typically the fastest revenue lever — test your checkout flow.";
  }
  return "Focus on the pillar with the lowest score to unlock the biggest improvement.";
}

// ── Next Steps Generator ──

function generateNextSteps(
  pillars: Record<PillarName, PillarResult>,
  inputs: RevenueInputs,
): NextStep[] {
  const steps: NextStep[] = [];

  const sorted = (Object.entries(pillars) as [PillarName, PillarResult][])
    .sort((a, b) => a[1].score - b[1].score);

  // Generate 1-2 steps per weak pillar, up to 7 total
  for (const [name, pillar] of sorted) {
    if (steps.length >= 7) break;
    if (pillar.score >= 80 && steps.length >= 3) continue;

    if (name === "revenue" && pillar.score < 70) {
      steps.push({
        title: "Increase monthly revenue baseline",
        why: "Revenue is the foundation — all other metrics improve with a stronger top line.",
        howToStart: "Identify your best-performing product/service and create a promotional push this week.",
        effort: pillar.score < 40 ? "high" : "medium",
      });
    }

    if (name === "profitability") {
      if (has(inputs.grossMarginPct) && inputs.grossMarginPct < 50) {
        steps.push({
          title: "Improve gross margin above 50%",
          why: "Low margins mean you need much more revenue to be profitable.",
          howToStart: "Audit your top 3 costs and identify one you can reduce by 10% this month.",
          effort: "medium",
        });
      }
      if (has(inputs.cac) && has(inputs.ltv) && inputs.ltv / Math.max(inputs.cac, 1) < 3) {
        steps.push({
          title: "Fix LTV:CAC ratio (target 3x+)",
          why: "Spending too much to acquire customers who don't generate enough lifetime value.",
          howToStart: "Reduce CAC via organic channels or increase LTV with upsells and retention.",
          effort: "high",
        });
      }
    }

    if (name === "retention" && has(inputs.churnMonthlyPct) && inputs.churnMonthlyPct > 5) {
      steps.push({
        title: "Reduce monthly churn below 5%",
        why: "High churn negates acquisition efforts — you're filling a leaky bucket.",
        howToStart: "Survey 10 recent churned customers to find the top reason, then fix it.",
        effort: "medium",
      });
    }

    if (name === "acquisition") {
      if (has(inputs.conversionRatePct) && inputs.conversionRatePct < 2) {
        steps.push({
          title: "Optimize conversion rate",
          why: "You have traffic but aren't converting — this is the fastest revenue win.",
          howToStart: "Run one A/B test on your main landing page CTA this week.",
          effort: "low",
        });
      }
      if (has(inputs.trafficMonthly) && inputs.trafficMonthly < 2000) {
        steps.push({
          title: "Scale traffic acquisition",
          why: "Not enough visitors entering your funnel to generate consistent revenue.",
          howToStart: "Publish 2 SEO-optimized articles targeting buyer-intent keywords.",
          effort: "medium",
        });
      }
    }

    if (name === "ops" && has(inputs.opsHoursPerWeek) && inputs.opsHoursPerWeek > 30) {
      steps.push({
        title: "Automate operational workflows",
        why: "You're spending too many hours on ops instead of growth activities.",
        howToStart: "List your 5 most repetitive weekly tasks and automate the top one with Zapier or similar.",
        effort: "low",
      });
    }
  }

  // Ensure at least 3 steps
  if (steps.length < 3) {
    const generic: NextStep[] = [
      {
        title: "Complete your business profile",
        why: "More data means a more accurate score and better recommendations.",
        howToStart: "Fill in any missing fields in your Revenue Health profile.",
        effort: "low",
      },
      {
        title: "Set up monthly metric tracking",
        why: "Trend data over time reveals whether your changes are working.",
        howToStart: "Schedule a 15-min monthly review to update your numbers.",
        effort: "low",
      },
      {
        title: "Benchmark against your industry",
        why: "Context matters — your numbers may be great or concerning depending on your market.",
        howToStart: "Research 2-3 competitors' public metrics to calibrate your expectations.",
        effort: "low",
      },
    ];
    for (const g of generic) {
      if (steps.length >= 3) break;
      if (!steps.some((s) => s.title === g.title)) steps.push(g);
    }
  }

  return steps.slice(0, 7);
}

// ── Missing Data Detection ──

const INPUT_KEYS: (keyof RevenueInputs)[] = [
  "revenueMonthly",
  "grossMarginPct",
  "netProfitMonthly",
  "runwayMonths",
  "churnMonthlyPct",
  "conversionRatePct",
  "trafficMonthly",
  "avgOrderValue",
  "cac",
  "ltv",
  "opsHoursPerWeek",
  "fulfillmentDays",
  "supportTicketsPerWeek",
];

function findMissingData(inputs: RevenueInputs): string[] {
  return INPUT_KEYS.filter((k) => !has(inputs[k]));
}

// ── Main Entry Point ──

export function computeRevenueHealthScore(
  inputs: RevenueInputs,
  businessType?: BusinessTypeName,
): RevenueHealthScoreResult {
  const pillars = {
    revenue: scoreRevenue(inputs),
    profitability: scoreProfitability(inputs),
    retention: scoreRetention(inputs),
    acquisition: scoreAcquisition(inputs),
    ops: scoreOps(inputs),
  };

  // Adaptive weighted composite based on business type
  const weights = getWeights(businessType);
  const score = clamp(
    Math.round(
      pillars.revenue.score * weights.revenue +
      pillars.profitability.score * weights.profitability +
      pillars.retention.score * weights.retention +
      pillars.acquisition.score * weights.acquisition +
      pillars.ops.score * weights.ops
    ),
  );

  return {
    score,
    pillars,
    primaryRisk: identifyPrimaryRisk(pillars, inputs, businessType),
    fastestLever: identifyFastestLever(pillars, inputs, businessType),
    recommendedNextSteps: generateNextSteps(pillars, inputs),
    missingData: findMissingData(inputs),
  };
}
