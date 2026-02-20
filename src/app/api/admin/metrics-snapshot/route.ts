import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(session.user as Record<string, unknown>).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      completedOnboarding,
      proSubscribers,
      creditReferralCount,
      affiliateTotal,
      startedDiagnosis,
      hasScore,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { onboardingCompleted: true, diagnosisCompleted: true } }),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.creditReferral.count(),
      prisma.affiliateClick.count(),
      prisma.user.count({ where: { diagnosisCompleted: true } }),
      prisma.revenueScoreSnapshot.groupBy({ by: ["userId"], _count: { userId: true } }),
    ]);

    const activeDashboard = hasScore.length;

    const snapshot = await prisma.adminMetricsHistory.upsert({
      where: { date: today },
      update: {
        totalUsers,
        completedOnboarding,
        proSubscribers,
        creditReferrals: creditReferralCount,
        affiliateClicks: affiliateTotal,
        funnelSignedUp: totalUsers,
        funnelStartedDiagnosis: startedDiagnosis,
        funnelCompletedOnboarding: completedOnboarding,
        funnelActiveDashboard: activeDashboard,
      },
      create: {
        date: today,
        totalUsers,
        completedOnboarding,
        proSubscribers,
        creditReferrals: creditReferralCount,
        affiliateClicks: affiliateTotal,
        funnelSignedUp: totalUsers,
        funnelStartedDiagnosis: startedDiagnosis,
        funnelCompletedOnboarding: completedOnboarding,
        funnelActiveDashboard: activeDashboard,
      },
    });

    return NextResponse.json({ ok: true, snapshot });
  } catch (err: unknown) {
    console.error("METRICS_SNAPSHOT_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
