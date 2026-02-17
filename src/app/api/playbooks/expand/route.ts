import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import { computeProfileHash } from "@/lib/ai/hash";
import { expandWithAI, expandFallback } from "@/lib/playbooks/expand";
import type { PlaybookExpandRequest, PlaybookExpandResponse, ExpandedPlaybook } from "@/lib/playbooks/types";
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

    if (!isPremium) {
      return NextResponse.json(
        { error: "Premium required" },
        { status: 402 },
      );
    }

    let body: PlaybookExpandRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { playbookSlug } = body;
    if (!playbookSlug) {
      return NextResponse.json(
        { error: "Missing playbookSlug" },
        { status: 400 },
      );
    }

    // Load playbook
    const playbook = await prisma.actionPlaybook.findUnique({
      where: { slug: playbookSlug },
    });

    if (!playbook) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 },
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

    // Compute profile hash for cache key
    const pillarScores = Object.fromEntries(
      Object.entries(scoreResult.pillars).map(([k, v]) => [k, v.score]),
    );
    const profileHash = computeProfileHash({
      businessType,
      inputs,
      score: scoreResult.score,
      pillarScores,
    });

    // Check cache
    const cached = await prisma.aiInsight.findFirst({
      where: {
        userId,
        itemType: "playbook",
        itemKey: playbookSlug,
        tier: "full",
        profileHash,
      },
    });

    if (cached) {
      try {
        const expanded = JSON.parse(cached.contentJson) as ExpandedPlaybook;
        const result: PlaybookExpandResponse = { expanded, cached: true };
        return NextResponse.json(result);
      } catch {
        // Corrupted cache — regenerate below
      }
    }

    // Build trigger reason from the playbook's trigger rule
    const triggerRule = playbook.triggerRule as Record<string, unknown>;
    let triggerReason = "Your metrics triggered this playbook.";
    if (triggerRule.pillar && triggerRule.belowScore) {
      const pillarData = scoreResult.pillars[triggerRule.pillar as keyof typeof scoreResult.pillars];
      if (pillarData) {
        triggerReason = `Your ${triggerRule.pillar} score is ${pillarData.score}/100 (below ${triggerRule.belowScore}).`;
      }
    }

    const baseSteps = playbook.baseSteps as { step: number; title: string; action: string }[];

    const expandCtx = {
      playbookSlug: playbook.slug,
      playbookTitle: playbook.title,
      category: playbook.category,
      baseSteps,
      baseImpact: playbook.baseImpact,
      effortLevel: playbook.effortLevel,
      businessType,
      scoreResult,
      triggerReason,
    };

    let expanded = await expandWithAI(expandCtx);
    if (!expanded) {
      expanded = expandFallback(expandCtx);
    }

    // Cache the result (non-fatal)
    try {
      if (cached) {
        await prisma.aiInsight.update({
          where: { id: cached.id },
          data: { contentJson: JSON.stringify(expanded), businessType },
        });
      } else {
        await prisma.aiInsight.create({
          data: {
            userId,
            itemType: "playbook",
            itemKey: playbookSlug,
            tier: "full",
            businessType,
            profileHash,
            contentJson: JSON.stringify(expanded),
          },
        });
      }
    } catch {
      // Cache write failure is non-fatal
    }

    const result: PlaybookExpandResponse = { expanded, cached: false };
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("PLAYBOOK_EXPAND_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}
