import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const email = "fixworkflows@gmail.com";

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, isPremium: true, isAdmin: true, onboardingCompleted: true, diagnosisCompleted: true },
  });
  console.log("Current user state:", JSON.stringify(user, null, 2));

  if (!user) return;

  const profile = await prisma.revenueProfile.findUnique({ where: { userId: user.id } });
  if (profile) {
    console.log("\nProfile:", JSON.stringify({
      businessType: profile.businessType,
      revenueMonthly: profile.revenueMonthly,
      grossMarginPct: profile.grossMarginPct,
      netProfitMonthly: profile.netProfitMonthly,
      conversionRatePct: profile.conversionRatePct,
      trafficMonthly: profile.trafficMonthly,
      cac: profile.cac,
      ltv: profile.ltv,
      churnMonthlyPct: profile.churnMonthlyPct,
      opsHoursPerWeek: profile.opsHoursPerWeek,
      fulfillmentDays: profile.fulfillmentDays,
      supportTicketsPerWeek: profile.supportTicketsPerWeek,
      avgOrderValue: profile.avgOrderValue,
    }, null, 2));
  } else {
    console.log("\nNO PROFILE FOUND");
  }

  const snapshot = await prisma.revenueScoreSnapshot.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (snapshot) {
    console.log("\nLatest snapshot:", JSON.stringify({
      score: snapshot.score,
      pillarRevenue: snapshot.pillarRevenue,
      pillarProfitability: snapshot.pillarProfitability,
      pillarRetention: snapshot.pillarRetention,
      pillarAcquisition: snapshot.pillarAcquisition,
      pillarOps: snapshot.pillarOps,
      primaryRisk: snapshot.primaryRisk,
      fastestLever: snapshot.fastestLever,
      createdAt: snapshot.createdAt,
    }, null, 2));
  } else {
    console.log("\nNO SNAPSHOT FOUND");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
