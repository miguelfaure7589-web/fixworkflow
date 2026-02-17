import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  // Get metric sources from business profile
  const bp = await prisma.businessProfile.findFirst({
    where: { userId },
    select: { metricSources: true },
  });

  // Get pillar history — last 2 weeks for delta
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const history = await prisma.metricHistory.findMany({
    where: { userId, weekOf: { gte: twoWeeksAgo } },
    orderBy: { weekOf: "desc" },
  });

  // Build pillar history with prev/current
  const pillarHistory: Record<string, { prev: number; current: number }> = {};
  const pillarsByWeek: Record<string, { weekOf: string; score: number }[]> = {};

  for (const h of history) {
    if (!pillarsByWeek[h.pillar]) pillarsByWeek[h.pillar] = [];
    pillarsByWeek[h.pillar].push({ weekOf: h.weekOf.toISOString(), score: h.score });
  }

  for (const [pillar, entries] of Object.entries(pillarsByWeek)) {
    if (entries.length >= 2) {
      // Latest is current, second latest is prev
      pillarHistory[pillar] = {
        current: entries[0].score,
        prev: entries[1].score,
      };
    } else if (entries.length === 1) {
      pillarHistory[pillar] = {
        current: entries[0].score,
        prev: entries[0].score,
      };
    }
  }

  return NextResponse.json({
    metricSources: (bp?.metricSources as Record<string, string>) || {},
    pillarHistory,
  });
}
