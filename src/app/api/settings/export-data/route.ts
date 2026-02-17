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

  const [
    user,
    businessProfiles,
    revenueProfile,
    revenueScoreSnapshots,
    playbookProgress,
    creditReferrals,
    metricSnapshots,
    revenueHealthSnapshots,
    bottleneckAssessments,
    insights,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isAdmin: true,
        isPremium: true,
        onboardingCompleted: true,
        diagnosisCompleted: true,
        frictionAreas: true,
        toolPain: true,
        primaryGoal: true,
        freeTextChallenge: true,
        notificationPrefs: true,
        privacyPrefs: true,
      },
    }),
    prisma.businessProfile.findMany({ where: { userId } }),
    prisma.revenueProfile.findUnique({ where: { userId } }),
    prisma.revenueScoreSnapshot.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.userPlaybookProgress.findMany({ where: { userId } }),
    prisma.creditReferral.findMany({ where: { userId } }),
    prisma.metricSnapshot.findMany({ where: { userId }, orderBy: { timestamp: "desc" } }),
    prisma.revenueHealthSnapshot.findMany({ where: { userId }, orderBy: { calculatedAt: "desc" } }),
    prisma.bottleneckAssessment.findMany({ where: { userId }, orderBy: { calculatedAt: "desc" } }),
    prisma.insight.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    businessProfiles,
    revenueProfile,
    revenueScoreSnapshots,
    playbookProgress,
    creditReferrals,
    metricSnapshots,
    revenueHealthSnapshots,
    bottleneckAssessments,
    insights,
  };

  const date = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify(exportData, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="fixworkflow-data-export-${date}.json"`,
    },
  });
}
