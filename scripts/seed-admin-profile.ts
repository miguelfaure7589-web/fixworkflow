import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeRevenueHealthScore } from "../src/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "../src/lib/revenue-health";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const ADMIN_EMAIL = "fixworkflows@gmail.com";

async function main() {
  const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!user) {
    console.error("Admin user not found:", ADMIN_EMAIL);
    return;
  }
  console.log("Found admin user:", user.name, "|", user.email, "| id:", user.id);

  // ── FixWorkFlow's real business metrics ──
  const businessType: BusinessTypeName = "saas";
  const profileData = {
    businessType: businessType,
    revenueMonthly: 0,          // No paying subscribers yet
    grossMarginPct: 0,          // Pre-revenue (negative technically, but 0 for calc)
    netProfitMonthly: -250,     // $250/mo costs, $0 revenue
    runwayMonths: 6,            // Estimate
    churnMonthlyPct: 0,         // No customers to churn
    conversionRatePct: 0,       // 0 paid out of 3 signups
    trafficMonthly: 50,         // Minimal organic traffic
    avgOrderValue: 0,           // No orders
    cac: 0,                     // All organic acquisition
    ltv: 0,                     // No revenue per customer
    opsHoursPerWeek: 20,        // Building/maintaining the product
    fulfillmentDays: 0,         // SaaS = instant delivery
    supportTicketsPerWeek: 1,   // Minimal early stage
    usesPersonalCredit: "yes",
  };

  // Save the profile
  await prisma.revenueProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...profileData },
    update: profileData,
  });
  console.log("Saved revenue profile for", ADMIN_EMAIL);

  // Compute score using the real engine
  const inputs: RevenueInputs = {
    revenueMonthly: profileData.revenueMonthly,
    grossMarginPct: profileData.grossMarginPct,
    netProfitMonthly: profileData.netProfitMonthly,
    runwayMonths: profileData.runwayMonths,
    churnMonthlyPct: profileData.churnMonthlyPct,
    conversionRatePct: profileData.conversionRatePct,
    trafficMonthly: profileData.trafficMonthly,
    avgOrderValue: profileData.avgOrderValue,
    cac: profileData.cac,
    ltv: profileData.ltv,
    opsHoursPerWeek: profileData.opsHoursPerWeek,
    fulfillmentDays: profileData.fulfillmentDays,
    supportTicketsPerWeek: profileData.supportTicketsPerWeek,
  };

  const result = computeRevenueHealthScore(inputs, businessType);

  console.log("\n── Revenue Health Score Result ──");
  console.log("Overall Score:", result.score);
  console.log("Pillars:");
  console.log("  Revenue:", result.pillars.revenue.score);
  console.log("  Profitability:", result.pillars.profitability.score);
  console.log("  Retention:", result.pillars.retention.score);
  console.log("  Acquisition:", result.pillars.acquisition.score);
  console.log("  Operations:", result.pillars.ops.score);
  console.log("Primary Risk:", result.primaryRisk);
  console.log("Fastest Lever:", result.fastestLever);

  // Save snapshot
  await prisma.revenueScoreSnapshot.create({
    data: {
      userId: user.id,
      score: result.score,
      pillarRevenue: result.pillars.revenue.score,
      pillarProfitability: result.pillars.profitability.score,
      pillarRetention: result.pillars.retention.score,
      pillarAcquisition: result.pillars.acquisition.score,
      pillarOps: result.pillars.ops.score,
      pillarsJson: JSON.stringify(result.pillars),
      primaryRisk: result.primaryRisk,
      fastestLever: result.fastestLever,
      nextStepsJson: JSON.stringify(result.recommendedNextSteps),
      missingDataJson: JSON.stringify(result.missingData),
    },
  });
  console.log("\nScore snapshot saved successfully!");

  // Also mark onboarding and diagnosis as completed
  await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingCompleted: true,
      diagnosisCompleted: true,
    },
  });
  console.log("Marked onboarding + diagnosis as completed");
}

main().catch(console.error).finally(() => prisma.$disconnect());
