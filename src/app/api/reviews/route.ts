import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET — fetch the current user's review (if any)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const review = await prisma.review.findUnique({
      where: { userId },
    });

    return NextResponse.json({ review });
  } catch (err: unknown) {
    console.error("GET_REVIEW_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

// POST — create or update the user's review
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await req.json();
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : null;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const review = await prisma.review.upsert({
      where: { userId },
      create: { userId, rating, comment: comment || null },
      update: { rating, comment: comment || null },
    });

    return NextResponse.json({ review });
  } catch (err: unknown) {
    console.error("POST_REVIEW_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
