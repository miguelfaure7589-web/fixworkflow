import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      password: true,
      isPremium: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      cancellationDate: true,
      notificationPrefs: true,
      privacyPrefs: true,
      avatarUrl: true,
      bio: true,
      businessStage: true,
      profileGoal: true,
      referralSource: true,
      accounts: { select: { provider: true }, take: 1 },
      businessProfiles: {
        select: { businessName: true, businessType: true },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name,
    email: user.email,
    phone: user.phone,
    isPremium: user.isPremium,
    stripeCustomerId: user.stripeCustomerId,
    hasStripeSubscription: !!user.stripeSubscriptionId,
    cancellationDate: user.cancellationDate,
    notificationPrefs: user.notificationPrefs,
    privacyPrefs: user.privacyPrefs,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    businessStage: user.businessStage,
    profileGoal: user.profileGoal,
    referralSource: user.referralSource,
    authProvider: user.accounts[0]?.provider || null,
    hasPassword: !!user.password,
    businessProfile: user.businessProfiles[0] || null,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const body = await req.json();
  const { name, email, businessName, businessType, phone, goals, bio, businessStage, profileGoal, referralSource } = body;

  // Validate email format
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Validate bio length
  if (bio !== undefined && typeof bio === "string" && bio.length > 160) {
    return NextResponse.json({ error: "Bio must be 160 characters or less" }, { status: 400 });
  }

  // Update User record
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(goals !== undefined && { goals }),
      ...(bio !== undefined && { bio }),
      ...(businessStage !== undefined && { businessStage }),
      ...(profileGoal !== undefined && { profileGoal }),
      ...(referralSource !== undefined && { referralSource }),
    },
  });

  // Update or create BusinessProfile
  let businessTypeChanged = false;
  if (businessName !== undefined || businessType !== undefined) {
    const existing = await prisma.businessProfile.findFirst({
      where: { userId },
    });

    if (existing) {
      if (businessType && businessType !== existing.businessType) {
        businessTypeChanged = true;
      }
      await prisma.businessProfile.update({
        where: { id: existing.id },
        data: {
          ...(businessName !== undefined && { businessName }),
          ...(businessType !== undefined && businessType && { businessType }),
        },
      });
    } else if (businessType) {
      await prisma.businessProfile.create({
        data: {
          userId,
          businessName: businessName || null,
          businessType,
          revenueStage: "0_1k",
          primaryChannel: "organic",
          teamSize: "1",
          currentRevenue: 0,
          confidenceScore: 0.5,
        },
      });
    }
  }

  // If business type changed, recalculate the Revenue Health Score (pillar weights differ by type)
  if (businessTypeChanged) {
    const revenueProfile = await prisma.revenueProfile.findUnique({ where: { userId } });
    if (revenueProfile) {
      const inputs: RevenueInputs = {
        revenueMonthly: revenueProfile.revenueMonthly ?? undefined,
        grossMarginPct: revenueProfile.grossMarginPct ?? undefined,
        netProfitMonthly: revenueProfile.netProfitMonthly ?? undefined,
        runwayMonths: revenueProfile.runwayMonths ?? undefined,
        churnMonthlyPct: revenueProfile.churnMonthlyPct ?? undefined,
        conversionRatePct: revenueProfile.conversionRatePct ?? undefined,
        trafficMonthly: revenueProfile.trafficMonthly ?? undefined,
        avgOrderValue: revenueProfile.avgOrderValue ?? undefined,
        cac: revenueProfile.cac ?? undefined,
        ltv: revenueProfile.ltv ?? undefined,
        opsHoursPerWeek: revenueProfile.opsHoursPerWeek ?? undefined,
        fulfillmentDays: revenueProfile.fulfillmentDays ?? undefined,
        supportTicketsPerWeek: revenueProfile.supportTicketsPerWeek ?? undefined,
      };
      const bt = (businessType as BusinessTypeName) ?? undefined;
      const result = computeRevenueHealthScore(inputs, bt);
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
    }
  }

  return NextResponse.json({ success: true, scoreRecalculated: businessTypeChanged });
}
