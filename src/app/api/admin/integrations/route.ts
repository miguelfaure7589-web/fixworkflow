import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as Record<string, unknown> | undefined)?.isAdmin;
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Total connected integrations
  const totalConnected = await prisma.integration.count({
    where: { status: "connected" },
  });

  // Breakdown by provider
  const byProvider = await prisma.integration.groupBy({
    by: ["provider"],
    _count: true,
    where: { status: { in: ["connected", "syncing", "error"] } },
  });

  const providerBreakdown: Record<string, number> = {};
  for (const p of byProvider) {
    providerBreakdown[p.provider] = p._count;
  }

  // Last weekly sync
  const lastSync = await prisma.syncLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, status: true },
  });

  // Failed syncs in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const failedSyncs = await prisma.syncLog.findMany({
    where: {
      status: "failed",
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      integration: {
        include: {
          user: { select: { email: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const failedList = failedSyncs.map((s) => ({
    id: s.id,
    provider: s.integration.provider,
    userEmail: s.integration.user.email,
    userName: s.integration.user.name,
    error: s.error,
    createdAt: s.createdAt.toISOString(),
  }));

  return NextResponse.json({
    totalConnected,
    providerBreakdown,
    lastSync: lastSync ? { date: lastSync.createdAt.toISOString(), status: lastSync.status } : null,
    failedSyncsCount: failedSyncs.length,
    failedSyncs: failedList,
  });
}
