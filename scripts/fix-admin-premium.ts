import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const email = "fixworkflows@gmail.com";

  // Set isPremium = true in the database
  const updated = await prisma.user.update({
    where: { email },
    data: { isPremium: true },
    select: { id: true, name: true, email: true, isPremium: true, isAdmin: true },
  });

  console.log("Updated admin user:", JSON.stringify(updated, null, 2));
  console.log("\nisPremium is now:", updated.isPremium);
}

main().catch(console.error).finally(() => prisma.$disconnect());
