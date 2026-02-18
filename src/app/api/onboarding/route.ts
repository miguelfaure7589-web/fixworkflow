import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";
import { sendScoreReadyEmail, shouldSendEmail } from "@/lib/email";

export const runtime = "nodejs";

const REVENUE_RANGE_FROM_MIDPOINT: Record<number, string> = {
  0: "pre_revenue",
  500: "0_1k",
  3000: "1k_5k",
  10000: "5k_15k",
  30000: "15k_50k",
  75000: "50k_plus",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const profile = await prisma.revenueProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ ok: true, data: null });
    }

    // Reverse-map revenueMonthly back to range label
    const revenueRange = profile.revenueMonthly != null
      ? REVENUE_RANGE_FROM_MIDPOINT[profile.revenueMonthly] ?? null
      : null;

    return NextResponse.json({
      ok: true,
      data: {
        businessType: profile.businessType,
        revenueRange,
        grossMarginPct: profile.grossMarginPct,
        conversionRatePct: profile.conversionRatePct,
        trafficMonthly: profile.trafficMonthly,
        usesPersonalCredit: profile.usesPersonalCredit,
      },
    });
  } catch (err: unknown) {
    console.error("ONBOARDING_GET_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}

const VALID_BUSINESS_TYPES = new Set<string>([
  "ecommerce", "saas", "service_agency", "creator", "local_business",
]);

const REVENUE_MIDPOINTS: Record<string, number> = {
  pre_revenue: 0,
  "0_1k": 500,
  "1k_5k": 3000,
  "5k_15k": 10000,
  "15k_50k": 30000,
  "50k_plus": 75000,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Validate businessType
    const businessType = body.businessType as string | undefined;
    if (!businessType || !VALID_BUSINESS_TYPES.has(businessType)) {
      return NextResponse.json({ error: "Invalid businessType" }, { status: 400 });
    }

    // Validate and map revenueRange
    const revenueRange = body.revenueRange as string | undefined;
    if (!revenueRange || !(revenueRange in REVENUE_MIDPOINTS)) {
      return NextResponse.json({ error: "Invalid revenueRange" }, { status: 400 });
    }

    const revenueMonthly = REVENUE_MIDPOINTS[revenueRange];
    const bt = businessType as BusinessTypeName;

    // Build profile data
    const profileData: Record<string, unknown> = {
      businessType: bt,
      revenueMonthly,
    };

    // Personal credit usage (optional)
    const usesPersonalCredit = body.usesPersonalCredit as string | undefined;
    if (usesPersonalCredit && ["yes", "sometimes", "no"].includes(usesPersonalCredit)) {
      profileData.usesPersonalCredit = usesPersonalCredit;
    }

    // Validate optional numeric fields
    if (body.grossMarginPct !== undefined && body.grossMarginPct !== "") {
      const val = Number(body.grossMarginPct);
      if (Number.isNaN(val) || val < 0 || val > 100) {
        return NextResponse.json({ error: "grossMarginPct must be 0-100" }, { status: 400 });
      }
      profileData.grossMarginPct = val;
    }

    if (body.conversionRatePct !== undefined && body.conversionRatePct !== "") {
      const val = Number(body.conversionRatePct);
      if (Number.isNaN(val) || val < 0 || val > 100) {
        return NextResponse.json({ error: "conversionRatePct must be 0-100" }, { status: 400 });
      }
      profileData.conversionRatePct = val;
    }

    if (body.trafficMonthly !== undefined && body.trafficMonthly !== "") {
      const val = Number(body.trafficMonthly);
      if (Number.isNaN(val) || val < 0) {
        return NextResponse.json({ error: "trafficMonthly must be >= 0" }, { status: 400 });
      }
      profileData.trafficMonthly = val;
    }

    // Upsert RevenueProfile
    const profile = await prisma.revenueProfile.upsert({
      where: { userId },
      create: { userId, ...profileData },
      update: profileData,
    });

    // Compute score using existing engine
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

    const result = computeRevenueHealthScore(inputs, bt);

    // Save snapshot
    await prisma.revenueScoreSnapshot.create({
      data: {
        userId,
        score: result.score,
        pillarRevenue: result.pillars.revenue.score,
        pillarProfitability: result.pillars.profitability.score,
        pillarRetention: result.pillars.retention.score,
        pillarAcquisition: result.pillars.acquisition.score,
        pillarOps: result.pillars.ops.score,
        pillarsJson: JSON.stringify(result.pillars),
        primaryRisk: result.primaryRisk,
        fastestLever: result.fastestLever,
        nextStepsJson: JSON.stringify(result.recommendedNextSteps),
        missingDataJson: JSON.stringify(result.missingData),
      },
    });

    // Mark onboarding complete
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
      select: { email: true },
    });

    // Send score ready email (fire-and-forget, respect prefs)
    if (updatedUser.email) {
      const weakestPillar = result.primaryRisk || "revenue";
      const recommendation =
        result.recommendedNextSteps?.[0]?.title || "Check your dashboard for personalized recommendations.";
      shouldSendEmail(userId, "scoreUpdates").then((ok) => {
        if (ok) {
          sendScoreReadyEmail(
            updatedUser.email!,
            result.score,
            weakestPillar,
            recommendation,
          ).catch((err) => console.error("[EMAIL] Score ready email failed:", err));
        }
      });
    }

    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    console.error("ONBOARDING_POST_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}
