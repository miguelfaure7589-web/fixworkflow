import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const email = "luabeconsulting@gmail.com";
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) { console.log("Not found"); return; }

  // Delete related records first
  await prisma.creditReferral.deleteMany({ where: { userId: u.id } });
  console.log("Deleted credit referrals for", email);

  await prisma.user.delete({ where: { email } });
  console.log("Deleted user:", email);

  const remaining = await prisma.user.findMany({ select: { name: true, email: true } });
  console.log("\nRemaining users:", remaining.length);
  remaining.forEach((u) => console.log(" -", u.name, "|", u.email));
}

main().catch(console.error).finally(() => prisma.$disconnect());
