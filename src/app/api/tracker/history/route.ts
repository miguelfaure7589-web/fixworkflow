import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as Record<string, unknown>;
  if (!user.isPremium) {
    return Response.json({ error: "Premium required" }, { status: 402 });
  }

  const userId = user.id as string;

  try {
    // Last 12 weeks of logs
    const logs = await prisma.weeklyLog.findMany({
      where: { userId },
      orderBy: { weekOf: "desc" },
      take: 12,
    });

    // Monthly summary: current calendar month
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

    const thisMonthLogs = logs.filter(
      (l) => l.weekOf >= monthStart && l.weekOf <= monthEnd
    );

    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59));

    const lastMonthLogs = await prisma.weeklyLog.findMany({
      where: {
        userId,
        weekOf: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      orderBy: { weekOf: "desc" },
    });

    const thisMonthRevenue = thisMonthLogs.reduce((s, l) => s + l.revenue, 0);
    const lastMonthRevenue = lastMonthLogs.reduce((s, l) => s + l.revenue, 0);
    const avgWeeklyRevenue = thisMonthLogs.length > 0
      ? thisMonthRevenue / thisMonthLogs.length
      : 0;

    // Get user's monthly target from RevenueProfile
    const profile = await prisma.revenueProfile.findUnique({
      where: { userId },
      select: { revenueMonthly: true },
    });

    const monthlyTarget = profile?.revenueMonthly ?? null;
    const targetPct = monthlyTarget && monthlyTarget > 0
      ? Math.round((thisMonthRevenue / monthlyTarget) * 100)
      : null;

    const trend = lastMonthRevenue > 0
      ? (thisMonthRevenue >= lastMonthRevenue ? "up" : "down")
      : null;

    return Response.json({
      ok: true,
      logs,
      monthly: {
        thisMonthRevenue,
        lastMonthRevenue,
        avgWeeklyRevenue,
        monthlyTarget,
        targetPct,
        trend,
        weeksLogged: thisMonthLogs.length,
      },
    });
  } catch (err: unknown) {
    console.error("[TRACKER HISTORY]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
