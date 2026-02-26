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

  const integrations = await prisma.integration.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      status: true,
      storeDomain: true,
      externalId: true,
      lastSyncAt: true,
      lastSyncStatus: true,
      lastSyncError: true,
      syncFrequency: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ integrations });
}
