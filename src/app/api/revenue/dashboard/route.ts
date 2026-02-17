import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // @ts-ignore
  if (!session.user.isPremium) {
    return new Response("Upgrade required", { status: 402 });
  }

  // @ts-ignore
  const userId = session.user.id as string;

  const [snapshot, bottleneck, insight, businessProfile] = await Promise.all([
    prisma.revenueHealthSnapshot.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    }),
    prisma.bottleneckAssessment.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    }),
    prisma.insight.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.businessProfile.findFirst({
      where: { userId },
      orderBy: { lastUpdated: "desc" },
    }),
  ]);

  if (!snapshot) {
    return Response.json({ data: null, message: "No data yet. Run your first analysis." });
  }

  return Response.json({
    data: {
      score: {
        total: snapshot.totalScore,
        components: JSON.parse(snapshot.componentScores),
        band: snapshot.interpretationBand,
        calculatedAt: snapshot.calculatedAt,
      },
      bottleneck: bottleneck
        ? {
            primary: bottleneck.primaryBottleneck,
            secondary: JSON.parse(bottleneck.secondaryBottlenecks),
            severity: bottleneck.severityScore,
          }
        : null,
      revenueGap: snapshot.revenueGap,
      insight: insight
        ? {
            summary: insight.summary,
            weeklyExecutionPlan: JSON.parse(insight.weeklyExecutionPlan),
            recommendedTools: JSON.parse(insight.recommendedTools),
            riskWarnings: JSON.parse(insight.riskWarnings),
            opportunitySignals: JSON.parse(insight.opportunitySignals),
            createdAt: insight.createdAt,
          }
        : null,
      businessProfile: businessProfile
        ? {
            businessType: businessProfile.businessType,
            revenueStage: businessProfile.revenueStage,
            currentRevenue: businessProfile.currentRevenue,
          }
        : null,
    },
  });
}
