/**
 * Profile Hash — Stable fingerprint for cache key
 */
import { createHash } from "crypto";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health/types";

export interface HashableProfile {
  businessType?: BusinessTypeName | null;
  inputs: RevenueInputs;
  score?: number;
  pillarScores?: Record<string, number>;
}

export function computeProfileHash(profile: HashableProfile): string {
  const data = JSON.stringify({
    bt: profile.businessType ?? "service_agency",
    rev: profile.inputs.revenueMonthly ?? null,
    gm: profile.inputs.grossMarginPct ?? null,
    np: profile.inputs.netProfitMonthly ?? null,
    rw: profile.inputs.runwayMonths ?? null,
    ch: profile.inputs.churnMonthlyPct ?? null,
    cr: profile.inputs.conversionRatePct ?? null,
    tm: profile.inputs.trafficMonthly ?? null,
    aov: profile.inputs.avgOrderValue ?? null,
    cac: profile.inputs.cac ?? null,
    ltv: profile.inputs.ltv ?? null,
    ops: profile.inputs.opsHoursPerWeek ?? null,
    fd: profile.inputs.fulfillmentDays ?? null,
    st: profile.inputs.supportTicketsPerWeek ?? null,
    s: profile.score ?? null,
    ps: profile.pillarScores ?? null,
  });
  return createHash("sha256").update(data).digest("hex").slice(0, 16);
}
