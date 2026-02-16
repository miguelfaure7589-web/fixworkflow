import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import { computeProfileHash } from "@/lib/ai/hash";
import { generatePreview } from "@/lib/ai/preview";
import { generateFullWithAI, generateFullFallback } from "@/lib/ai/full";
import type { ExplainRequest, ExplainResponse, FullExplanation } from "@/lib/ai/types";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as Record<string, unknown>;
    const userId = user.id as string;
    const isPremium = !!user.isPremium;

    let body: ExplainRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { itemType, itemKey, pillar, title, description } = body;

    if (!itemType || !itemKey || !pillar || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Load profile + compute scores
    const profile = await prisma.revenueProfile.findUnique({
      where: { userId },
    });

    const inputs: RevenueInputs = profile
      ? {
          revenueMonthly: profile.revenueMonthly ?? undefined,
          grossMarginPct: profile.grossMarginPct ?? undefined,
          netProfitMonthly: profile.netProfitMonthly ?? undefined,
          runwayMonths: profile.runwayMonths ?? undefined,
          churnMonthlyPct: profile.churnMonthlyPct ?? undefined,
          conversionRatePct: profile.conversionRatePct ?? undefined,
          trafficMonthly: profile.trafficMonthly ?? undefined,
          avgOrderValue: profile.avgOrderValue ?? undefined,
          cac: profile.cac ?? undefined,
          ltv: profile.ltv ?? undefined,
          opsHoursPerWeek: profile.opsHoursPerWeek ?? undefined,
          fulfillmentDays: profile.fulfillmentDays ?? undefined,
          supportTicketsPerWeek: profile.supportTicketsPerWeek ?? undefined,
        }
      : {};

    const businessType =
      (profile?.businessType as BusinessTypeName | null) ?? "service_agency";

    const scoreResult = computeRevenueHealthScore(inputs, businessType);

    // Compute profile hash
    const pillarScores = Object.fromEntries(
      Object.entries(scoreResult.pillars).map(([k, v]) => [k, v.score]),
    );
    const profileHash = computeProfileHash({
      businessType,
      inputs,
      score: scoreResult.score,
      pillarScores,
    });

    // Always generate preview (deterministic, no AI call)
    const preview = generatePreview(
      itemType,
      pillar,
      title,
      description ?? "",
      businessType,
      scoreResult,
    );

    // If not premium, return preview only
    if (!isPremium) {
      const result: ExplainResponse = { preview, full: null, cached: false };
      return NextResponse.json(result);
    }

    // Premium: check cache first
    const cached = await prisma.aiInsight.findFirst({
      where: { userId, itemType, itemKey, tier: "full", profileHash },
    });

    if (cached) {
      try {
        const full = JSON.parse(cached.contentJson) as FullExplanation;
        const result: ExplainResponse = { preview, full, cached: true };
        return NextResponse.json(result);
      } catch {
        // Corrupted cache — regenerate below
      }
    }

    // Generate full explanation
    const genContext = {
      itemType,
      itemKey,
      pillar,
      title,
      description: description ?? "",
      businessType,
      scoreResult,
    };

    let full = await generateFullWithAI(genContext);
    if (!full) {
      full = generateFullFallback(genContext);
    }

    // Cache the result (non-fatal if it fails)
    try {
      if (cached) {
        await prisma.aiInsight.update({
          where: { id: cached.id },
          data: { contentJson: JSON.stringify(full), businessType },
        });
      } else {
        await prisma.aiInsight.create({
          data: {
            userId,
            itemType,
            itemKey,
            tier: "full",
            businessType,
            profileHash,
            contentJson: JSON.stringify(full),
          },
        });
      }
    } catch {
      // Cache write failure is non-fatal
    }

    const result: ExplainResponse = { preview, full, cached: false };
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("WHY_ROUTE_ERROR:", err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}
