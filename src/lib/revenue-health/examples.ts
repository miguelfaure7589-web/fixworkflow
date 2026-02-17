/**
 * Revenue Health Score — Self-Check Examples
 *
 * Run: npx tsx src/lib/revenue-health/examples.ts
 */

import { computeRevenueHealthScore } from "./engine";
import type { RevenueInputs } from "./types";

interface TestProfile {
  label: string;
  inputs: RevenueInputs;
}

const profiles: TestProfile[] = [
  {
    label: "New Business (low revenue, high ops)",
    inputs: {
      revenueMonthly: 800,
      grossMarginPct: 35,
      netProfitMonthly: -200,
      runwayMonths: 4,
      churnMonthlyPct: 12,
      conversionRatePct: 0.8,
      trafficMonthly: 500,
      avgOrderValue: 25,
      cac: 120,
      ltv: 80,
      opsHoursPerWeek: 45,
      fulfillmentDays: 8,
      supportTicketsPerWeek: 35,
    },
  },
  {
    label: "Growing Business (mid revenue, improving conversion)",
    inputs: {
      revenueMonthly: 12000,
      grossMarginPct: 55,
      netProfitMonthly: 1800,
      runwayMonths: 14,
      churnMonthlyPct: 4,
      conversionRatePct: 3.2,
      trafficMonthly: 8000,
      avgOrderValue: 75,
      cac: 45,
      ltv: 280,
      opsHoursPerWeek: 22,
      fulfillmentDays: 3,
      supportTicketsPerWeek: 15,
    },
  },
  {
    label: "Healthy Business (high margin, good retention)",
    inputs: {
      revenueMonthly: 65000,
      grossMarginPct: 72,
      netProfitMonthly: 18000,
      runwayMonths: 24,
      churnMonthlyPct: 1.5,
      conversionRatePct: 5.5,
      trafficMonthly: 45000,
      avgOrderValue: 180,
      cac: 30,
      ltv: 900,
      opsHoursPerWeek: 12,
      fulfillmentDays: 1,
      supportTicketsPerWeek: 8,
    },
  },
];

console.log("═══════════════════════════════════════════════════");
console.log("  REVENUE HEALTH SCORE — SELF-CHECK EXAMPLES");
console.log("═══════════════════════════════════════════════════\n");

for (const profile of profiles) {
  const result = computeRevenueHealthScore(profile.inputs);

  console.log(`▸ ${profile.label}`);
  console.log(`  Overall Score: ${result.score}/100\n`);

  console.log("  Pillars:");
  for (const [name, pillar] of Object.entries(result.pillars)) {
    console.log(`    ${name.padEnd(15)} ${pillar.score}/100`);
    for (const r of pillar.reasons) console.log(`      ↳ ${r}`);
    for (const l of pillar.levers) console.log(`      ★ ${l}`);
  }

  console.log(`\n  Primary Risk: ${result.primaryRisk}`);
  console.log(`  Fastest Lever: ${result.fastestLever}`);

  console.log(`\n  Next Steps (${result.recommendedNextSteps.length}):`);
  for (const step of result.recommendedNextSteps) {
    console.log(`    [${step.effort.toUpperCase()}] ${step.title}`);
    console.log(`           Why: ${step.why}`);
    console.log(`           How: ${step.howToStart}`);
  }

  console.log(`\n  Missing Data: ${result.missingData.length > 0 ? result.missingData.join(", ") : "none"}`);
  console.log("\n───────────────────────────────────────────────────\n");
}

// ── Sanity Checks ──

const results = profiles.map((p) => computeRevenueHealthScore(p.inputs));

const checks = [
  { name: "New biz score < Growing biz score", pass: results[0].score < results[1].score },
  { name: "Growing biz score < Healthy biz score", pass: results[1].score < results[2].score },
  { name: "Healthy biz score >= 70", pass: results[2].score >= 70 },
  { name: "New biz score < 40", pass: results[0].score < 40 },
  { name: "All results have 3-7 next steps", pass: results.every((r) => r.recommendedNextSteps.length >= 3 && r.recommendedNextSteps.length <= 7) },
  { name: "New biz has more missing data than healthy", pass: results[0].missingData.length <= results[2].missingData.length },
  { name: "Empty inputs produce a score", pass: computeRevenueHealthScore({}).score > 0 },
];

console.log("SANITY CHECKS:");
let allPassed = true;
for (const c of checks) {
  const icon = c.pass ? "✓" : "✗";
  console.log(`  ${icon} ${c.name}`);
  if (!c.pass) allPassed = false;
}
console.log(allPassed ? "\nAll checks passed!" : "\nSome checks FAILED — review above.");
