import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const email = "fixworkflows@gmail.com";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  console.log(`Found user: ${user.id} (${user.name ?? "no name"})`);

  // Update user flags
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isAdmin: true,
      diagnosisCompleted: true,
      onboardingCompleted: true,
    },
  });
  console.log("Set isAdmin=true, diagnosisCompleted=true, onboardingCompleted=true");

  // Create BusinessProfile if missing
  const existing = await prisma.businessProfile.findFirst({
    where: { userId: user.id },
  });

  if (!existing) {
    await prisma.businessProfile.create({
      data: {
        userId: user.id,
        businessType: "service_agency",
        revenueStage: "5k_15k",
        primaryChannel: "organic",
        teamSize: "1",
        currentRevenue: 10000,
        confidenceScore: 0.8,
      },
    });
    console.log("Created default BusinessProfile");
  } else {
    console.log("BusinessProfile already exists — skipped");
  }

  // Create RevenueProfile if missing (needed for dashboard)
  const existingRP = await prisma.revenueProfile.findUnique({
    where: { userId: user.id },
  });

  if (!existingRP) {
    await prisma.revenueProfile.create({
      data: {
        userId: user.id,
        businessType: "service_agency",
        revenueMonthly: 10000,
        grossMarginPct: 60,
      },
    });
    console.log("Created default RevenueProfile");
  } else {
    console.log("RevenueProfile already exists — skipped");
  }

  console.log("Admin setup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
