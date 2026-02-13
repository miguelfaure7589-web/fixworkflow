import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateRecommendations,
  calculateHealthScore,
  type DiagnosticInput,
} from "@/lib/recommendation-engine";
import { enhanceRecommendations } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input: DiagnosticInput = {
      role: body.role || "freelancer",
      industry: body.industry || "other",
      teamSize: body.teamSize || "solo",
      workEnvironment: body.workEnvironment || "fully_remote",
      productivityScore: body.productivityScore || 3,
      frictionAreas: body.frictionAreas || [],
      currentTools: body.currentTools || [],
      detailedAnswers: {
        task_detail: body.task_detail,
        communication_detail: body.communication_detail,
        client_detail: body.client_detail,
        automation_detail: body.automation_detail,
      },
    };

    // Generate recommendations
    const recommendations = generateRecommendations(input);
    const healthScore = calculateHealthScore(input);

    // Get AI-enhanced summary
    const summary = await enhanceRecommendations(input, recommendations);

    // Save to database
    const diagnosis = await prisma.diagnosis.create({
      data: {
        email: body.email,
        role: input.role,
        industry: input.industry,
        teamSize: input.teamSize,
        workEnvironment: input.workEnvironment,
        productivityScore: input.productivityScore,
        frictionAreas: JSON.stringify(input.frictionAreas),
        currentTools: JSON.stringify(input.currentTools),
        detailedAnswers: JSON.stringify(input.detailedAnswers),
        healthScore,
        status: "completed",
        recommendations: {
          create: recommendations.map((rec, i) => ({
            priority: rec.priority,
            category: rec.category,
            title: rec.title,
            problem: rec.problem,
            solution: rec.solution,
            impact: rec.impact,
            tools: JSON.stringify(rec.tools.map((t) => t.slug)),
            order: i,
            isPremium: rec.isPremium,
          })),
        },
      },
    });

    return NextResponse.json({
      id: diagnosis.id,
      healthScore,
      summary,
      recommendationCount: recommendations.length,
    });
  } catch (error) {
    console.error("Diagnosis error:", error);
    return NextResponse.json(
      { error: "Failed to process diagnosis" },
      { status: 500 }
    );
  }
}
