import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import "@/lib/integrations/providers/shopify";
import "@/lib/integrations/providers/stripe-data";
import "@/lib/integrations/providers/google-analytics";
import "@/lib/integrations/providers/quickbooks";
import { syncAllForUser } from "@/lib/integrations/sync";
import { recalculateUserScore } from "@/lib/score-recalculator";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for long syncs

async function authorize(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as Record<string, unknown> | undefined)?.isAdmin;
  return !!isAdmin;
}

// ── Core sync logic ──

async function runWeeklySyncWithRecalculation() {
  console.log(`[CRON] Weekly sync started at ${new Date().toISOString()}`);

  // Get all users with at least one active integration
  const users = await prisma.user.findMany({
    where: {
      integrations: { some: { status: { in: ["connected", "error"] } } },
    },
    select: { id: true, email: true },
  });

  const results: {
    userId: string;
    email: string | null;
    success: boolean;
    scoreChange?: number;
    newScore?: number;
    error?: string;
  }[] = [];

  for (const user of users) {
    try {
      // First, sync all integrations to pull fresh data into RevenueProfile
      await syncAllForUser(user.id);

      // Then recalculate score with merged integration + manual data
      const result = await recalculateUserScore(user.id, "cron");

      results.push({
        userId: user.id,
        email: user.email,
        success: true,
        scoreChange: result.scoreChange,
        newScore: result.newScore,
      });
    } catch (error: unknown) {
      results.push({
        userId: user.id,
        email: user.email,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Log results summary
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const changedScores = results.filter((r) => r.success && r.scoreChange !== 0);
  const avgChange =
    changedScores.length > 0
      ? changedScores.reduce((sum, r) => sum + Math.abs(r.scoreChange!), 0) / changedScores.length
      : 0;

  console.log("Weekly sync complete:", {
    totalUsers: users.length,
    succeeded,
    failed,
    avgScoreChange: avgChange.toFixed(1),
  });

  return {
    success: true,
    processed: users.length,
    succeeded,
    failed,
    avgScoreChange: Number(avgChange.toFixed(1)),
    results: results.map((r) => ({
      email: r.email,
      success: r.success,
      scoreChange: r.scoreChange,
      newScore: r.newScore,
      error: r.error,
    })),
    timestamp: new Date().toISOString(),
  };
}

// GET — called by Vercel Cron
export async function GET(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklySyncWithRecalculation();
  return NextResponse.json(result);
}

// POST — called manually from admin dashboard
export async function POST(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklySyncWithRecalculation();
  return NextResponse.json(result);
}
