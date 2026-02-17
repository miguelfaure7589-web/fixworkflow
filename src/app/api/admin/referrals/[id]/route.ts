import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(["pending", "contacted", "converted", "declined"]);

// PATCH — update referral status (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(session.user as Record<string, unknown>).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const status = body.status as string;
    if (!status || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const referral = await prisma.creditReferral.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ ok: true, referral });
  } catch (err: unknown) {
    console.error("ADMIN_REFERRAL_PATCH_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
