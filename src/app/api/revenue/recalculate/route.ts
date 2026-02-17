import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { fullRecalculation } from "@/lib/RecalculationEngine";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // @ts-ignore
  if (!session.user.isPremium) {
    return new Response("Upgrade required", { status: 402 });
  }

  // @ts-ignore
  const result = await fullRecalculation(session.user.id);

  if (!result) {
    return Response.json(
      { error: "Missing business profile or metrics. Complete onboarding first." },
      { status: 400 }
    );
  }

  return Response.json({
    totalScore: result.healthResult.totalScore,
    interpretationBand: result.healthResult.interpretationBand,
    componentBreakdown: result.healthResult.componentBreakdown,
    weakestComponent: result.healthResult.weakestComponent,
    primaryBottleneck: result.bottleneck.primaryBottleneck,
    secondaryBottlenecks: result.bottleneck.secondaryBottlenecks,
    severityScore: result.bottleneck.severityScore,
    revenueGap: result.benchmarkComparison.revenueGap,
    performanceTier: result.benchmarkComparison.performanceTier,
    improvementPotential: result.benchmarkComparison.improvementPotential,
  });
}
