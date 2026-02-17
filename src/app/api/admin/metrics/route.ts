import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
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

    const [
      totalUsers,
      completedOnboarding,
      proSubscribers,
      creditReferralStats,
      affiliateTotal,
      affiliateLast7,
      startedDiagnosis,
      hasScore,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { onboardingCompleted: true, diagnosisCompleted: true },
      }),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.creditReferral.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.affiliateClick.count(),
      prisma.affiliateClick.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.user.count({ where: { diagnosisCompleted: true } }),
      prisma.revenueScoreSnapshot.groupBy({
        by: ["userId"],
        _count: { userId: true },
      }),
    ]);

    // Credit referral breakdown
    const crMap: Record<string, number> = { pending: 0, contacted: 0, converted: 0, declined: 0 };
    for (const row of creditReferralStats) {
      crMap[row.status] = row._count.id;
    }
    const creditTotal = Object.values(crMap).reduce((a, b) => a + b, 0);

    const activeDashboard = hasScore.length; // users who have at least one score snapshot

    return NextResponse.json({
      totalUsers,
      completedOnboarding,
      proSubscribers,
      creditReferrals: { total: creditTotal, ...crMap },
      affiliateClicks: { total: affiliateTotal, last7Days: affiliateLast7 },
      funnel: {
        signedUp: totalUsers,
        startedDiagnosis,
        completedOnboarding,
        activeDashboard,
      },
    });
  } catch (err: unknown) {
    console.error("ADMIN_METRICS_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
