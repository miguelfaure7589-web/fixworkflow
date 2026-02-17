import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  // Delete all related records (cascade handles most via schema, but be explicit)
  await prisma.$transaction([
    prisma.userPlaybookProgress.deleteMany({ where: { userId } }),
    prisma.aiInsight.deleteMany({ where: { userId } }),
    prisma.revenueScoreSnapshot.deleteMany({ where: { userId } }),
    prisma.creditReferral.deleteMany({ where: { userId } }),
    prisma.insight.deleteMany({ where: { userId } }),
    prisma.bottleneckAssessment.deleteMany({ where: { userId } }),
    prisma.revenueHealthSnapshot.deleteMany({ where: { userId } }),
    prisma.metricSnapshot.deleteMany({ where: { userId } }),
    prisma.metricHistory.deleteMany({ where: { userId } }),
    prisma.syncLog.deleteMany({ where: { integration: { userId } } }),
    prisma.integration.deleteMany({ where: { userId } }),
    prisma.businessProfile.deleteMany({ where: { userId } }),
    prisma.revenueProfile.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return NextResponse.json({ success: true, redirect: "/" });
}
