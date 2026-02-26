import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import "@/lib/integrations/providers/shopify";
import "@/lib/integrations/providers/stripe-data";
import "@/lib/integrations/providers/google-analytics";
import { runWeeklySync } from "@/lib/integrations/sync";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for long syncs

export async function POST(req: Request) {
  // Check authorization: either CRON_SECRET or admin session
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  let authorized = false;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    authorized = true;
  }

  if (!authorized) {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as Record<string, unknown> | undefined)?.isAdmin;
    if (isAdmin) authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklySync();

  return NextResponse.json({
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
  });
}
