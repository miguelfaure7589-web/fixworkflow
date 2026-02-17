import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import { getTriggeredPlaybooks } from "@/lib/playbooks/trigger";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health/types";
import type { PlaybookBase } from "@/lib/playbooks/trigger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as Record<string, unknown>;
    const userId = user.id as string;

    // Load profile
    const profile = await prisma.revenueProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ triggered: [], hasProfile: false });
    }

    const inputs: RevenueInputs = {
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
    };

    const businessType =
      (profile.businessType as BusinessTypeName | null) ?? "service_agency";

    const scoreResult = computeRevenueHealthScore(inputs, businessType);

    // Load all playbooks from DB
    const allPlaybooks = await prisma.actionPlaybook.findMany();

    const playbookBases: PlaybookBase[] = allPlaybooks.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      businessTypes: p.businessTypes,
      triggerRule: p.triggerRule as Record<string, unknown>,
      baseSteps: p.baseSteps as { step: number; title: string; action: string }[],
      baseImpact: p.baseImpact,
      effortLevel: p.effortLevel,
    }));

    const triggered = getTriggeredPlaybooks(playbookBases, inputs, businessType, scoreResult);

    return NextResponse.json({ triggered, hasProfile: true });
  } catch (err: unknown) {
    console.error("PLAYBOOKS_TRIGGERED_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}
