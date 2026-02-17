import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET — check if current user has a pending/contacted referral
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const referral = await prisma.creditReferral.findFirst({
      where: { userId, status: { in: ["pending", "contacted"] } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, referral: referral ?? null });
  } catch (err: unknown) {
    console.error("CREDIT_REFERRAL_GET_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

// POST — create a new credit referral
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = (body.name as string || "").trim();
    const email = (body.email as string || "").trim();
    const phone = (body.phone as string || "").trim();
    const bestTimeToCall = (body.bestTimeToCall as string || "").trim() || null;
    const notes = (body.notes as string || "").trim().slice(0, 500) || null;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

    // Check for duplicate pending referral
    const existing = await prisma.creditReferral.findFirst({
      where: { userId, status: { in: ["pending", "contacted"] } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending credit assessment request." },
        { status: 409 },
      );
    }

    const referral = await prisma.creditReferral.create({
      data: { userId, name, email, phone, bestTimeToCall, notes },
    });

    return NextResponse.json({ ok: true, referral }, { status: 201 });
  } catch (err: unknown) {
    console.error("CREDIT_REFERRAL_POST_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
