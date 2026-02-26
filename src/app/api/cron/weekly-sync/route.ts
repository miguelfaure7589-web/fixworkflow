import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import "@/lib/integrations/providers/shopify";
import "@/lib/integrations/providers/stripe-data";
import "@/lib/integrations/providers/google-analytics";
import "@/lib/integrations/providers/quickbooks";
import { runWeeklySync } from "@/lib/integrations/sync";

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

function formatResults(result: Awaited<ReturnType<typeof runWeeklySync>>) {
  return {
    success: true,
    totalIntegrations: result.totalIntegrations,
    synced: result.synced,
    failed: result.failed,
    results: result.results.map((r) => ({
      provider: r.provider,
      status: r.status,
      duration: r.duration,
      error: r.error,
      metricsUpdated: r.metricsUpdated,
    })),
  };
}

// GET — called by Vercel Cron
export async function GET(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklySync();
  return NextResponse.json(formatResults(result));
}

// POST — called manually from admin dashboard
export async function POST(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklySync();
  return NextResponse.json(formatResults(result));
}
