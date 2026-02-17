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
    const range = searchParams.get("range") || "all";

    let dateFilter: Date | undefined;
    const now = new Date();
    if (range === "7d") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const whereClause = dateFilter ? { createdAt: { gte: dateFilter } } : {};

    // All clicks in range
    const clicks = await prisma.affiliateClick.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        source: true,
        userId: true,
        createdAt: true,
      },
    });

    // Aggregate top products
    const productMap: Record<string, { name: string; totalClicks: number; placements: Record<string, number> }> = {};
    const placementTotals: Record<string, number> = {};

    for (const c of clicks) {
      const name = c.slug || "unknown";
      if (!productMap[name]) {
        productMap[name] = { name, totalClicks: 0, placements: {} };
      }
      productMap[name].totalClicks++;
      const placement = c.source || "unknown";
      productMap[name].placements[placement] = (productMap[name].placements[placement] || 0) + 1;
      placementTotals[placement] = (placementTotals[placement] || 0) + 1;
    }

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 10);

    // Recent clicks with user info
    const recentClickIds = clicks.slice(0, 20).map((c) => c.id);
    const recentClicks = await prisma.affiliateClick.findMany({
      where: { id: { in: recentClickIds } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        source: true,
        userId: true,
        createdAt: true,
      },
    });

    // Get user emails for recent clicks
    const userIds = [...new Set(recentClicks.map((c) => c.userId).filter(Boolean))] as string[];
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        })
      : [];
    const userEmailMap = Object.fromEntries(users.map((u) => [u.id, u.email]));

    const recentClicksFormatted = recentClicks.map((c) => ({
      timestamp: c.createdAt.toISOString(),
      userEmail: c.userId ? userEmailMap[c.userId] || "unknown" : "anonymous",
      productName: c.slug || "unknown",
      placement: c.source || "unknown",
    }));

    return NextResponse.json({
      topProducts,
      byPlacement: placementTotals,
      recentClicks: recentClicksFormatted,
    });
  } catch (err: unknown) {
    console.error("ADMIN_AFFILIATE_ANALYTICS_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
