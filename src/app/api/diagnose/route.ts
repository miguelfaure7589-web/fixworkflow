import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { type DiagnosticInput } from "@/lib/recommendation-engine";
import { runEngine } from "@/lib/engine";
import { BOTTLENECK_CATEGORIES } from "@/lib/bottleneck-scoring";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check session for premium status
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isPremium = !!(session?.user as any)?.isPremium;

    const input: DiagnosticInput = {
      role: Array.isArray(body.role) ? body.role[0] : (body.role || "freelancer"),
      industry: Array.isArray(body.industry) ? body.industry[0] : (body.industry || "other"),
      teamSize: body.teamSize || "solo",
      workEnvironment: body.workEnvironment || "fully_remote",
      productivityScore: body.productivityScore || 3,
      moraleScore: body.moraleScore || 3,
      frictionAreas: body.frictionAreas || [],
      currentTools: body.currentTools || [],
      goals: body.goals || "",
      detailedAnswers: {
        task_detail: body.task_detail,
        communication_detail: body.communication_detail,
        client_detail: body.client_detail,
        automation_detail: body.automation_detail,
        morale_detail: body.morale_detail,
        finance_detail: body.finance_detail,
        phone_internet_detail: body.phone_internet_detail,
        payments_detail: body.payments_detail,
        sales_leads_detail: body.sales_leads_detail,
        hiring_detail: body.hiring_detail,
        training_detail: body.training_detail,
        scaling_detail: body.scaling_detail,
      },
    };

    // Run the v2 engine
    const result = await runEngine(input, isPremium);

    // Map impact score to priority label
    function priorityFromImpact(impact: number): string {
      if (impact >= 5) return "high";
      if (impact >= 3) return "medium";
      return "low";
    }

    // Save to database
    const diagnosis = await prisma.diagnosis.create({
      data: {
        userId: (session?.user as any)?.id || null,
        email: body.email,
        role: Array.isArray(body.role) ? body.role.join(", ") : input.role,
        industry: Array.isArray(body.industry) ? body.industry.join(", ") : input.industry,
        teamSize: input.teamSize,
        workEnvironment: input.workEnvironment,
        productivityScore: input.productivityScore,
        frictionAreas: JSON.stringify(input.frictionAreas),
        currentTools: JSON.stringify(input.currentTools),
        detailedAnswers: JSON.stringify(input.detailedAnswers),
        healthScore: result.healthScore,
        bottleneckScores: JSON.stringify(
          Object.fromEntries(
            result.bottleneckScores.map((s) => [s.category, s.score])
          )
        ),
        status: "completed",
        recommendations: {
          create: result.actions.map((action, i) => ({
            priority: priorityFromImpact(action.impact),
            category: action.category,
            title: action.title,
            problem: action.aiInsight?.whyThisMatters || action.summary,
            solution: action.aiInsight?.howToStart || action.summary,
            impact: `Impact: ${action.impact}/5 · ${action.timeToImplement}`,
            tools: JSON.stringify(action.matchedTools.map((t) => t.slug)),
            order: i,
            isPremium: action.isPremiumOnly,
            difficulty: action.difficulty,
            impactScore: action.impact,
            timeToImplement: action.timeToImplement,
            toolTags: JSON.stringify(action.toolTags),
            resourceLinks: JSON.stringify(action.resourceLinks),
            aiInsight: action.aiInsight
              ? JSON.stringify(action.aiInsight)
              : null,
          })),
        },
      },
    });

    return NextResponse.json({
      id: diagnosis.id,
      healthScore: result.healthScore,
      topCategories: result.topCategories.map((c) => ({
        category: c.category,
        label: BOTTLENECK_CATEGORIES[c.category],
        score: c.score,
      })),
      actionCount: result.actions.length,
      toolCount: result.toolStack.reduce((sum, g) => sum + g.tools.length, 0),
    });
  } catch (error) {
    console.error("Diagnosis error:", error);
    return NextResponse.json(
      { error: "Failed to process diagnosis" },
      { status: 500 }
    );
  }
}
