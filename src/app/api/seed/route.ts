import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toolsDatabase, accessoryProducts } from "@/data/tools";
import { promptTemplates } from "@/data/promptTemplates";
import { playbookSeeds } from "@/data/playbooks";
import type { Prisma } from "@/generated/prisma/client";

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seed endpoint is disabled in production" },
      { status: 403 }
    );
  }

  try {
    let toolCount = 0;
    let productCount = 0;
    let promptCount = 0;

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
      toolCount++;
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
      productCount++;
    }

    // Seed prompt templates
    for (const pt of promptTemplates) {
      await prisma.promptTemplate.upsert({
        where: { slug: pt.slug },
        update: {
          title: pt.title,
          category: pt.category,
          visibility: pt.visibility,
          template: pt.template,
        },
        create: {
          slug: pt.slug,
          title: pt.title,
          category: pt.category,
          visibility: pt.visibility,
          template: pt.template,
        },
      });
      promptCount++;
    }

    // Seed action playbooks
    let playbookCount = 0;
    for (const pb of playbookSeeds) {
      const triggerRule = pb.triggerRule as unknown as Prisma.InputJsonValue;
      const baseSteps = pb.baseSteps as unknown as Prisma.InputJsonValue;
      await prisma.actionPlaybook.upsert({
        where: { slug: pb.slug },
        update: {
          title: pb.title,
          category: pb.category,
          businessTypes: pb.businessTypes,
          triggerRule,
          baseSteps,
          baseImpact: pb.baseImpact,
          effortLevel: pb.effortLevel,
        },
        create: {
          slug: pb.slug,
          title: pb.title,
          category: pb.category,
          businessTypes: pb.businessTypes,
          triggerRule,
          baseSteps,
          baseImpact: pb.baseImpact,
          effortLevel: pb.effortLevel,
        },
      });
      playbookCount++;
    }

    return NextResponse.json({
      success: true,
      seeded: { tools: toolCount, products: productCount, prompts: promptCount, playbooks: playbookCount },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
