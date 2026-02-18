import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        frictionAreas: true,
        toolPain: true,
        primaryGoal: true,
        freeTextChallenge: true,
        diagnosisCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        frictionAreas: user.frictionAreas ?? [],
        toolPain: user.toolPain ?? null,
        primaryGoal: user.primaryGoal ?? null,
        freeTextChallenge: user.freeTextChallenge ?? null,
        diagnosisCompleted: user.diagnosisCompleted,
      },
    });
  } catch (err: unknown) {
    console.error("DIAGNOSIS_GET_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}

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

    const { frictionAreas, toolPain, primaryGoal, freeTextChallenge } = body;

    // Validate frictionAreas
    if (!Array.isArray(frictionAreas) || frictionAreas.length === 0) {
      return NextResponse.json(
        { error: "frictionAreas must be a non-empty array" },
        { status: 400 },
      );
    }

    // Validate freeTextChallenge length
    if (
      typeof freeTextChallenge === "string" &&
      freeTextChallenge.length > 500
    ) {
      return NextResponse.json(
        { error: "freeTextChallenge must be 500 characters or less" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        frictionAreas: frictionAreas as string[],
        toolPain: (toolPain as string) || null,
        primaryGoal: (primaryGoal as string) || null,
        freeTextChallenge: (freeTextChallenge as string) || null,
        diagnosisCompleted: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DIAGNOSIS_POST_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}
