import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const testEmails = [
    "Vashresell@gmail.com",
    "vashresell@gmail.com",
    "test-welcome-email@example.com",
    "luabeconsulting@gmail.com",
    "miguelfaure7589@gmail.com",
  ];

  for (const email of testEmails) {
    try {
      const u = await prisma.user.findUnique({ where: { email } });
      if (u) {
        await prisma.user.delete({ where: { email } });
        console.log("Deleted:", email, "(" + u.name + ")");
      } else {
        console.log("Not found:", email);
      }
    } catch (err: any) {
      console.log("Error deleting", email, ":", err.message);
    }
  }

  const remaining = await prisma.user.findMany({
    select: { name: true, email: true },
  });
  console.log("\nRemaining users:", remaining.length);
  remaining.forEach((u) => console.log(" -", u.name, "|", u.email));

  // Seed metrics history
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.adminMetricsHistory.upsert({
    where: { date: today },
    update: {
      totalUsers: 8,
      completedOnboarding: 7,
      proSubscribers: 3,
      creditReferrals: 1,
      affiliateClicks: 6,
      funnelSignedUp: 8,
      funnelStartedDiagnosis: 7,
      funnelCompletedOnboarding: 7,
      funnelActiveDashboard: 7,
    },
    create: {
      date: today,
      totalUsers: 8,
      completedOnboarding: 7,
      proSubscribers: 3,
      creditReferrals: 1,
      affiliateClicks: 6,
      funnelSignedUp: 8,
      funnelStartedDiagnosis: 7,
      funnelCompletedOnboarding: 7,
      funnelActiveDashboard: 7,
    },
  });
  console.log(
    "\nSeeded metrics history for",
    today.toISOString().split("T")[0],
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
