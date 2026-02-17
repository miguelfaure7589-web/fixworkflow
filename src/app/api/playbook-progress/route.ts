import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** GET — fetch all progress for a playbook */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const { searchParams } = new URL(req.url);
    const playbookSlug = searchParams.get("slug");

    if (!playbookSlug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const records = await prisma.userPlaybookProgress.findMany({
      where: { userId, playbookSlug },
      orderBy: { stepIndex: "asc" },
    });

    const progress = records.map((r) => ({
      stepIndex: r.stepIndex,
      completed: r.completed,
      completedAt: r.completedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ progress });
  } catch (err: unknown) {
    console.error("PLAYBOOK_PROGRESS_GET_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}

/** POST — toggle step completion */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    let body: { playbookSlug: string; stepIndex: number; completed: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { playbookSlug, stepIndex, completed } = body;

    if (!playbookSlug || stepIndex === undefined || completed === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await prisma.userPlaybookProgress.upsert({
      where: {
        userId_playbookSlug_stepIndex: { userId, playbookSlug, stepIndex },
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
      create: {
        userId,
        playbookSlug,
        stepIndex,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    // Return all progress for this playbook
    const records = await prisma.userPlaybookProgress.findMany({
      where: { userId, playbookSlug },
      orderBy: { stepIndex: "asc" },
    });

    const progress = records.map((r) => ({
      stepIndex: r.stepIndex,
      completed: r.completed,
      completedAt: r.completedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ progress });
  } catch (err: unknown) {
    console.error("PLAYBOOK_PROGRESS_POST_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}
