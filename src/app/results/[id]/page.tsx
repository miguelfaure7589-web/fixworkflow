import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { toolsDatabase } from "@/data/tools";
import { enhanceRecommendations } from "@/lib/ai";
import type { DiagnosticInput, RecommendationOutput } from "@/lib/recommendation-engine";
import ResultsDashboard from "@/components/ResultsDashboard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params;

  const diagnosis = await prisma.diagnosis.findUnique({
    where: { id },
    include: { recommendations: { orderBy: { order: "asc" } } },
  });

  if (!diagnosis) {
    notFound();
  }

  // Reconstruct recommendation objects with full tool data
  const recommendations: RecommendationOutput[] = diagnosis.recommendations.map((rec) => {
    const toolSlugs: string[] = JSON.parse(rec.tools);
    const tools = toolSlugs
      .map((slug) => toolsDatabase.find((t) => t.slug === slug))
      .filter(Boolean) as typeof toolsDatabase;

    return {
      priority: rec.priority as "high" | "medium" | "low",
      category: rec.category,
      title: rec.title,
      problem: rec.problem,
      solution: rec.solution,
      impact: rec.impact,
      tools,
      isPremium: rec.isPremium,
    };
  });

  // Generate summary
  const input: DiagnosticInput = {
    role: diagnosis.role,
    industry: diagnosis.industry,
    teamSize: diagnosis.teamSize,
    workEnvironment: diagnosis.workEnvironment,
    productivityScore: diagnosis.productivityScore,
    frictionAreas: JSON.parse(diagnosis.frictionAreas),
    currentTools: JSON.parse(diagnosis.currentTools),
    detailedAnswers: JSON.parse(diagnosis.detailedAnswers),
  };

  const summary = await enhanceRecommendations(input, recommendations);

  return (
    <ResultsDashboard
      healthScore={diagnosis.healthScore || 50}
      summary={summary}
      recommendations={recommendations}
      userRole={diagnosis.role}
    />
  );
}
