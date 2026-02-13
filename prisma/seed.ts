import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { toolsDatabase, accessoryProducts } from "../src/data/tools";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Seed tools
  for (const tool of toolsDatabase) {
    await prisma.tool.upsert({
      where: { slug: tool.slug },
      update: {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        affiliateUrl: tool.affiliateUrl,
        affiliateProgram: tool.affiliateProgram,
        commissionType: tool.commissionType,
        commissionRate: tool.commissionRate,
        cookieWindow: tool.cookieWindow,
        hasFreeTier: tool.hasFreeTier,
        features: JSON.stringify(tool.features),
        bestFor: JSON.stringify(tool.bestFor),
        pricing: tool.pricing,
        rating: tool.rating,
      },
      create: {
        slug: tool.slug,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        affiliateUrl: tool.affiliateUrl,
        affiliateProgram: tool.affiliateProgram,
        commissionType: tool.commissionType,
        commissionRate: tool.commissionRate,
        cookieWindow: tool.cookieWindow,
        hasFreeTier: tool.hasFreeTier,
        features: JSON.stringify(tool.features),
        bestFor: JSON.stringify(tool.bestFor),
        pricing: tool.pricing,
        rating: tool.rating,
      },
    });
    console.log(`  Seeded tool: ${tool.name}`);
  }

  // Seed accessory products
  for (const product of accessoryProducts) {
    await prisma.accessoryProduct.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        category: product.category,
        affiliateUrl: product.affiliateUrl,
        imageUrl: product.imageUrl,
        price: product.price,
        bestFor: JSON.stringify(product.bestFor),
      },
      create: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        affiliateUrl: product.affiliateUrl,
        imageUrl: product.imageUrl,
        price: product.price,
        bestFor: JSON.stringify(product.bestFor),
      },
    });
    console.log(`  Seeded product: ${product.name}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
