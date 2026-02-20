import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as Record<string, unknown> | undefined)?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const avgResult = await prisma.review.aggregate({
      _avg: { rating: true },
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        userName: r.user.name,
        userEmail: r.user.email,
      })),
      avgRating: avgResult._avg.rating
        ? Math.round(avgResult._avg.rating * 10) / 10
        : 0,
      totalReviews: reviews.length,
    });
  } catch (err: unknown) {
    console.error("ADMIN_REVIEWS_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
