import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "fixworkflows@gmail.com").toLowerCase();

// GET — public stats for the landing page (real DB counts)
export async function GET() {
  try {
    const totalUsers = await prisma.user.count({
      where: { email: { not: ADMIN_EMAIL } },
    });

    const totalReviews = await prisma.review.count();

    const avgResult = await prisma.review.aggregate({
      _avg: { rating: true },
    });
    const avgRating = avgResult._avg.rating
      ? Math.round(avgResult._avg.rating * 10) / 10
      : 0;

    const scoredUsers = await prisma.revenueScoreSnapshot.groupBy({
      by: ["userId"],
    });

    return NextResponse.json({
      totalUsers,
      totalReviews,
      avgRating,
      businessesScored: scoredUsers.length,
    });
  } catch (err: unknown) {
    console.error("GET_STATS_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
