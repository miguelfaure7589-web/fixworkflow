import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";
import { sendScoreReadyEmail, shouldSendEmail } from "@/lib/email";

export const runtime = "nodejs";

const REVENUE_MIDPOINTS: Record<string, number> = {
  "0_1k": 500,
  "1k_5k": 3000,
  "5k_15k": 10000,
  "15k_50k": 30000,
  "50k_plus": 75000,
};

const GROSS_MARGIN_DEFAULTS: Record<string, number> = {
  saas: 80,
  ecommerce: 40,
  service_agency: 60,
  creator: 70,
  local_business: 50,
};

const CONVERSION_DEFAULTS: Record<string, number> = {
  saas: 3,
  ecommerce: 2,
  service_agency: 5,
  creator: 3,
  local_business: 5,
};

const MARGIN_MIDPOINTS: Record<string, number> = {
  under_20: 15,
  "20_40": 30,
  "40_60": 50,
  "60_80": 70,
  over_80: 85,
};

const CONVERSION_MIDPOINTS: Record<string, number> = {
  under_1: 0.5,
  "1_3": 2,
  "3_5": 4,
  "5_10": 7.5,
  over_10: 12,
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

    const {
      businessType,
      frictionAreas,
      primaryGoal,
      revenueRange,
      grossMargin,
      conversionRate,
      usesPersonalCredit,
      freeTextChallenge,
    } = body;

    // Validate required fields
    if (!businessType || typeof businessType !== "string") {
      return NextResponse.json({ error: "businessType is required" }, { status: 400 });
    }
    if (!Array.isArray(frictionAreas) || frictionAreas.length === 0) {
      return NextResponse.json({ error: "frictionAreas is required" }, { status: 400 });
    }
    if (!primaryGoal || typeof primaryGoal !== "string") {
      return NextResponse.json({ error: "primaryGoal is required" }, { status: 400 });
    }
    if (!revenueRange || typeof revenueRange !== "string") {
      return NextResponse.json({ error: "revenueRange is required" }, { status: 400 });
    }

    const revenueMonthly = REVENUE_MIDPOINTS[revenueRange as string] ?? 0;
    const bt = businessType as BusinessTypeName;

    // Resolve gross margin
    const grossMarginPct =
      grossMargin === "not_sure" || !grossMargin
        ? GROSS_MARGIN_DEFAULTS[bt] ?? 50
        : MARGIN_MIDPOINTS[grossMargin as string] ?? GROSS_MARGIN_DEFAULTS[bt] ?? 50;

    // Resolve conversion rate
    const conversionRatePct =
      conversionRate === "not_sure" || !conversionRate
        ? CONVERSION_DEFAULTS[bt] ?? 3
        : CONVERSION_MIDPOINTS[conversionRate as string] ?? CONVERSION_DEFAULTS[bt] ?? 3;

    // Save diagnosis answers to User
    await prisma.user.update({
      where: { id: userId },
      data: {
        frictionAreas: frictionAreas as string[],
        primaryGoal: primaryGoal as string,
        freeTextChallenge: (freeTextChallenge as string) || null,
        diagnosisCompleted: true,
        onboardingCompleted: true,
      },
    });

    // Upsert RevenueProfile
    const profileData = {
      businessType: bt,
      revenueMonthly,
      grossMarginPct,
      conversionRatePct,
      usesPersonalCredit:
        typeof usesPersonalCredit === "string" ? usesPersonalCredit : null,
    };

    const profile = await prisma.revenueProfile.upsert({
      where: { userId },
      create: { userId, ...profileData },
      update: profileData,
    });

    // Compute score
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

    // Send score ready email (fire-and-forget)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email) {
      const weakestPillar = result.primaryRisk || "revenue";
      const recommendation =
        result.recommendedNextSteps?.[0]?.title ||
        "Check your dashboard for personalized recommendations.";
      console.log("[EMAIL] Triggering score-ready email for:", user.email, "score:", result.score);
      shouldSendEmail(userId, "scoreUpdates").then((ok) => {
        console.log("[EMAIL] scoreUpdates pref check for diagnosis:", ok);
        if (ok) {
          sendScoreReadyEmail(
            user.email!,
            result.score,
            weakestPillar,
            recommendation,
          ).catch((err) =>
            console.error("[EMAIL ERROR] Score email failed:", err),
          );
        }
      });
    }

    return NextResponse.json({ ok: true, score: result.score, result });
  } catch (err: unknown) {
    console.error("DIAGNOSIS_COMPLETE_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}
