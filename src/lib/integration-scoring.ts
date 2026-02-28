/**
 * Integration-to-Pillar Data Mapping
 *
 * Defines how each integration's data points map to specific
 * pillar inputs in the scoring engine. Used by the score recalculator
 * to merge integration data with manually entered profile data.
 */

import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/integrations/registry";
import type { RevenueInputs } from "@/lib/revenue-health/types";

// ── Transform Functions ──

type TransformType = "direct" | "percentage" | "cents_to_dollars" | "seconds";

function applyTransform(value: number, transform: TransformType): number {
  switch (transform) {
    case "direct":
      return value;
    case "percentage":
      // Ensure 0-100 range: if value looks like a decimal (0-1), multiply by 100
      return value > 0 && value <= 1 ? value * 100 : value;
    case "cents_to_dollars":
      return value / 100;
    case "seconds":
      return value; // scoring engine handles interpretation
    default:
      return value;
  }
}

// ── Mapping Definitions ──

interface MetricMapping {
  metric: string; // key in PulledMetrics
  pillar: string;
  field: keyof RevenueInputs;
  transform: TransformType;
}

interface IntegrationMapping {
  integration: string;
  mappings: MetricMapping[];
}

export const INTEGRATION_MAPPINGS: IntegrationMapping[] = [
  {
    integration: "google-analytics",
    mappings: [
      { metric: "sessions", pillar: "acquisition", field: "trafficMonthly", transform: "direct" },
      { metric: "conversionRate", pillar: "acquisition", field: "conversionRatePct", transform: "percentage" },
    ],
  },
  {
    integration: "stripe-data",
    mappings: [
      { metric: "totalRevenue", pillar: "revenue", field: "revenueMonthly", transform: "direct" },
      { metric: "averageOrderValue", pillar: "profitability", field: "avgOrderValue", transform: "direct" },
      { metric: "churnRate", pillar: "retention", field: "churnMonthlyPct", transform: "percentage" },
      { metric: "grossMargin", pillar: "profitability", field: "grossMarginPct", transform: "percentage" },
    ],
  },
  {
    integration: "shopify",
    mappings: [
      { metric: "totalRevenue", pillar: "revenue", field: "revenueMonthly", transform: "direct" },
      { metric: "averageOrderValue", pillar: "revenue", field: "avgOrderValue", transform: "direct" },
      { metric: "conversionRate", pillar: "acquisition", field: "conversionRatePct", transform: "percentage" },
      { metric: "sessions", pillar: "acquisition", field: "trafficMonthly", transform: "direct" },
    ],
  },
  {
    integration: "quickbooks",
    mappings: [
      { metric: "grossMargin", pillar: "profitability", field: "grossMarginPct", transform: "percentage" },
      { metric: "netRevenue", pillar: "profitability", field: "netProfitMonthly", transform: "direct" },
    ],
  },
];

// ── Data Sources Tracking ──

export interface PillarInputsResult {
  inputs: Partial<RevenueInputs>;
  dataSources: Record<string, string>; // { field: provider }
}

// ── Main Entry Point ──

/**
 * Pull fresh data from all active integrations for a user
 * and map it into RevenueInputs fields.
 *
 * If multiple integrations provide the same field, the integration
 * with the most recent sync wins.
 */
export async function pullIntegrationData(userId: string): Promise<PillarInputsResult> {
  const integrations = await prisma.integration.findMany({
    where: {
      userId,
      status: { in: ["connected", "syncing"] },
    },
    orderBy: { lastSyncAt: "desc" }, // most recent first
  });

  const inputs: Partial<RevenueInputs> = {};
  const dataSources: Record<string, string> = {};
  const fieldTimestamps: Record<string, Date> = {}; // track freshness per field

  for (const integration of integrations) {
    const provider = getProvider(integration.provider);
    if (!provider) continue;

    // Find mapping for this integration
    const mapping = INTEGRATION_MAPPINGS.find((m) => m.integration === integration.provider);
    if (!mapping) continue;

    try {
      // Pull fresh data from the provider
      const data = await provider.pullData(integration);
      const syncTime = data.pulledAt || new Date();

      // Apply each metric mapping
      for (const m of mapping.mappings) {
        const rawValue = (data.metrics as Record<string, unknown>)[m.metric];
        if (rawValue === undefined || rawValue === null) continue;

        const val = Number(rawValue);
        if (Number.isNaN(val)) continue;

        // Only overwrite if this is fresher data
        const existingTimestamp = fieldTimestamps[m.field];
        if (existingTimestamp && syncTime <= existingTimestamp) continue;

        // Extrapolate weekly data to monthly where appropriate
        let transformed = applyTransform(val, m.transform);
        if (m.field === "revenueMonthly" || m.field === "trafficMonthly") {
          // Provider data is typically 7-day window — extrapolate to monthly
          transformed = transformed * (30 / 7);
        }

        (inputs as Record<string, number>)[m.field] = transformed;
        dataSources[m.field] = integration.provider;
        fieldTimestamps[m.field] = syncTime;
      }
    } catch (err) {
      console.error(`[INTEGRATION_SCORING] Failed to pull data from ${integration.provider}:`, err);
      // Continue with other integrations
    }
  }

  return { inputs, dataSources };
}

/**
 * Merge integration data with manually entered profile data.
 * Integration data takes priority (it's real-time).
 * Manual data fills gaps where no integration covers that field.
 */
export function mergeInputs(
  manualInputs: RevenueInputs,
  integrationInputs: Partial<RevenueInputs>,
): RevenueInputs {
  const merged: RevenueInputs = { ...manualInputs };

  for (const [key, value] of Object.entries(integrationInputs)) {
    if (value !== undefined && value !== null) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}
