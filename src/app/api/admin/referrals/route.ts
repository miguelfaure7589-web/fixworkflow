import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(["pending", "contacted", "converted", "declined"]);

// GET — list all credit referrals (admin only)
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
    const statusFilter = searchParams.get("status");

    const where = statusFilter && VALID_STATUSES.has(statusFilter)
      ? { status: statusFilter }
      : {};

    const referrals = await prisma.creditReferral.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            revenueScoreSnapshots: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: { score: true },
            },
          },
        },
      },
    });

    const formatted = referrals.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      email: r.email,
      phone: r.phone,
      bestTimeToCall: r.bestTimeToCall,
      notes: r.notes,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      userScore: r.user.revenueScoreSnapshots[0]?.score ?? null,
    }));

    return NextResponse.json({ ok: true, referrals: formatted });
  } catch (err: unknown) {
    console.error("ADMIN_REFERRALS_GET_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
