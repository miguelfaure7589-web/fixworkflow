import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as Record<string, unknown>;
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true, name: true } } },
  });

  return NextResponse.json({
    feedback: feedback.map((f) => ({
      id: f.id,
      userEmail: f.user.email,
      userName: f.user.name,
      type: f.type,
      message: f.message,
      pageUrl: f.pageUrl,
      status: f.status,
      createdAt: f.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as Record<string, unknown>;
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id as string;
  const status = body.status as string;
  if (!id || !["new", "reviewed", "resolved"].includes(status)) {
    return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
  }

  await prisma.feedback.update({ where: { id }, data: { status } });

  return NextResponse.json({ ok: true });
}
