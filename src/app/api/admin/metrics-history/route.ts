import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(session.user as Record<string, unknown>).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days")) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await prisma.adminMetricsHistory.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      history: history.map((h) => ({
        date: h.date.toISOString().split("T")[0],
        totalUsers: h.totalUsers,
        completedOnboarding: h.completedOnboarding,
        proSubscribers: h.proSubscribers,
        creditReferrals: h.creditReferrals,
        affiliateClicks: h.affiliateClicks,
        funnelSignedUp: h.funnelSignedUp,
        funnelStartedDiagnosis: h.funnelStartedDiagnosis,
        funnelCompletedOnboarding: h.funnelCompletedOnboarding,
        funnelActiveDashboard: h.funnelActiveDashboard,
      })),
    });
  } catch (err: unknown) {
    console.error("METRICS_HISTORY_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
