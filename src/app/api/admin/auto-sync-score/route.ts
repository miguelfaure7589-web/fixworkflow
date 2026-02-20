import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";

export const runtime = "nodejs";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "fixworkflows@gmail.com").toLowerCase();
const MONTHLY_COSTS = Number(process.env.ADMIN_MONTHLY_COSTS) || 250;
const PRICE_PER_SUB = 19.99;
const THROTTLE_MS = 60 * 60 * 1000; // 1 hour

let lastSyncTime = 0;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = (session.user as Record<string, unknown>).email as string;
    if (userEmail?.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check throttle (skip if force=true)
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";
    const now = Date.now();
    if (!force && lastSyncTime && now - lastSyncTime < THROTTLE_MS) {
      return NextResponse.json({
        ok: true,
        throttled: true,
        lastSync: new Date(lastSyncTime).toISOString(),
        message: "Synced less than 1 hour ago",
      });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: { id: true },
    });
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }
    const adminId = adminUser.id;

    // ── Query real platform data ──

    // Revenue: count Pro subscribers (excluding admin)
    const proCount = await prisma.user.count({
      where: { isPremium: true, email: { not: ADMIN_EMAIL } },
    });
    const totalSignups = await prisma.user.count({
      where: { email: { not: ADMIN_EMAIL } },
    });
    const monthlyRevenue = proCount * PRICE_PER_SUB;

    // Profitability
    const netProfit = monthlyRevenue - MONTHLY_COSTS;
    const grossMarginPct = monthlyRevenue > 0
      ? Math.round(((monthlyRevenue - MONTHLY_COSTS) / monthlyRevenue) * 100)
      : 0; // pre-revenue = 0%

    // Retention: onboarding completion rate
    const completedOnboarding = await prisma.user.count({
      where: { onboardingCompleted: true, email: { not: ADMIN_EMAIL } },
    });
    const onboardingRate = totalSignups > 0
      ? Math.round((completedOnboarding / totalSignups) * 100)
      : 0;

    // Churn: users who were premium but cancelled (have cancellationDate set)
    const churnedCount = await prisma.user.count({
      where: {
        isPremium: false,
        stripeSubscriptionId: { not: null },
        email: { not: ADMIN_EMAIL },
      },
    });
    const totalEverPro = proCount + churnedCount;
    const churnPct = totalEverPro > 0
      ? Math.round((churnedCount / totalEverPro) * 100)
      : 0;

    // Acquisition: conversion rate
    const conversionRate = totalSignups > 0
      ? Math.round((proCount / totalSignups) * 10000) / 100 // 2 decimal places
      : 0;

    // Operations: affiliate clicks (last 7 days), credit referrals, integrations
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const affiliateClicks7d = await prisma.affiliateClick.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    const totalReferrals = await prisma.creditReferral.count();
    const totalIntegrations = await prisma.integration.count({
      where: { status: "connected" },
    });

    // ── Map to scoring engine inputs ──
    const inputs: RevenueInputs = {
      revenueMonthly: monthlyRevenue,
      grossMarginPct: grossMarginPct,
      netProfitMonthly: netProfit,
      runwayMonths: monthlyRevenue > 0 ? undefined : 6, // estimate for pre-revenue
      churnMonthlyPct: churnPct,
      conversionRatePct: conversionRate,
      trafficMonthly: totalSignups * 10, // rough estimate: 10 visitors per signup
      avgOrderValue: proCount > 0 ? PRICE_PER_SUB : 0,
      cac: 0, // organic acquisition
      ltv: proCount > 0 && churnPct > 0
        ? Math.round(PRICE_PER_SUB / (churnPct / 100))
        : proCount > 0 ? PRICE_PER_SUB * 12 : 0,
      opsHoursPerWeek: 20,
      fulfillmentDays: 0, // SaaS = instant
      supportTicketsPerWeek: Math.max(1, Math.round(totalReferrals / 4)),
    };

    const businessType: BusinessTypeName = "saas";
    const result = computeRevenueHealthScore(inputs, businessType);

    // ── Save profile ──
    await prisma.revenueProfile.upsert({
      where: { userId: adminId },
      create: {
        userId: adminId,
        businessType: businessType,
        revenueMonthly: inputs.revenueMonthly,
        grossMarginPct: inputs.grossMarginPct,
        netProfitMonthly: inputs.netProfitMonthly,
        runwayMonths: inputs.runwayMonths ?? null,
        churnMonthlyPct: inputs.churnMonthlyPct,
        conversionRatePct: inputs.conversionRatePct,
        trafficMonthly: inputs.trafficMonthly,
        avgOrderValue: inputs.avgOrderValue,
        cac: inputs.cac,
        ltv: inputs.ltv,
        opsHoursPerWeek: inputs.opsHoursPerWeek,
        fulfillmentDays: inputs.fulfillmentDays,
        supportTicketsPerWeek: inputs.supportTicketsPerWeek,
        usesPersonalCredit: "yes",
      },
      update: {
        revenueMonthly: inputs.revenueMonthly,
        grossMarginPct: inputs.grossMarginPct,
        netProfitMonthly: inputs.netProfitMonthly,
        runwayMonths: inputs.runwayMonths ?? null,
        churnMonthlyPct: inputs.churnMonthlyPct,
        conversionRatePct: inputs.conversionRatePct,
        trafficMonthly: inputs.trafficMonthly,
        avgOrderValue: inputs.avgOrderValue,
        cac: inputs.cac,
        ltv: inputs.ltv,
        opsHoursPerWeek: inputs.opsHoursPerWeek,
        fulfillmentDays: inputs.fulfillmentDays,
        supportTicketsPerWeek: inputs.supportTicketsPerWeek,
      },
    });

    // ── Save score snapshot ──
    await prisma.revenueScoreSnapshot.create({
      data: {
        userId: adminId,
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

    lastSyncTime = now;

    return NextResponse.json({
      ok: true,
      throttled: false,
      lastSync: new Date(now).toISOString(),
      score: result.score,
      pillars: {
        revenue: result.pillars.revenue.score,
        profitability: result.pillars.profitability.score,
        retention: result.pillars.retention.score,
        acquisition: result.pillars.acquisition.score,
        ops: result.pillars.ops.score,
      },
      metrics: {
        proSubscribers: proCount,
        totalSignups,
        monthlyRevenue,
        monthlyCosts: MONTHLY_COSTS,
        netProfit,
        grossMarginPct,
        churnPct,
        conversionRate,
        onboardingRate,
        affiliateClicks7d,
        totalReferrals,
        totalIntegrations,
      },
    });
  } catch (err: unknown) {
    console.error("AUTO_SYNC_SCORE_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
