/**
 * Revenue Health Score — Type Definitions
 *
 * All inputs are optional so the engine degrades gracefully.
 * `NormalizedFacts` is the integration-ready wrapper for future
 * Stripe/Shopify/QuickBooks data that maps into RevenueInputs.
 */

// ── Business Type ──

export type BusinessTypeName =
  | "ecommerce"
  | "saas"
  | "service_agency"
  | "creator"
  | "local_business";

// ── Manual / Profile Inputs ──

export interface RevenueInputs {
  revenueMonthly?: number;
  grossMarginPct?: number; // 0-100
  netProfitMonthly?: number;
  runwayMonths?: number;
  churnMonthlyPct?: number; // 0-100
  conversionRatePct?: number; // 0-100
  trafficMonthly?: number;
  avgOrderValue?: number;
  cac?: number; // customer acquisition cost
  ltv?: number; // lifetime value
  opsHoursPerWeek?: number;
  fulfillmentDays?: number;
  supportTicketsPerWeek?: number;
}

// ── Integration-Ready Wrapper ──

export interface SourceMeta {
  provider: string; // e.g. "manual", "stripe", "shopify"
  fetchedAt: string; // ISO timestamp
}

export interface NormalizedFacts {
  inputs: RevenueInputs;
  sources: SourceMeta[];
  freshnessTimestamp: string; // ISO timestamp of newest data point
}

// ── Engine Output ──

export type EffortLevel = "low" | "medium" | "high";

export interface PillarResult {
  score: number; // 0-100
  reasons: string[];
  levers: string[];
}

export interface NextStep {
  title: string;
  why: string;
  howToStart: string;
  effort: EffortLevel;
}

export type PillarName =
  | "revenue"
  | "profitability"
  | "retention"
  | "acquisition"
  | "ops";

export interface RevenueHealthScoreResult {
  score: number; // 0-100 weighted composite
  pillars: Record<PillarName, PillarResult>;
  primaryRisk: string;
  fastestLever: string;
  recommendedNextSteps: NextStep[];
  missingData: string[];
}
