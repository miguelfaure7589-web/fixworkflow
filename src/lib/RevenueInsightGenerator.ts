import { prisma } from "./prisma";
import type { RevenueHealthResult, ComponentBreakdown } from "./RevenueHealthCalculator";
import type { BottleneckResult } from "./BottleneckDetector";
import type { BenchmarkComparison, BusinessProfileInput } from "./BenchmarkEngine";
import type { MetricInput } from "./RevenueHealthCalculator";

interface InsightPayload {
  businessProfile: BusinessProfileInput;
  metrics: MetricInput;
  revenueHealthSnapshot: RevenueHealthResult;
  bottleneckAssessment: BottleneckResult;
  benchmarkComparison: BenchmarkComparison;
}

interface GeneratedInsight {
  summary: string;
  weeklyExecutionPlan: string[];
  recommendedTools: string[];
  riskWarnings: string[];
  opportunitySignals: string[];
}

const REVENUE_SYSTEM_PROMPT = `You are a revenue operations analyst for FixWorkFlow Premium.

Tone: Analytical. Data-driven. Operator-level.
No fluff. No motivational language. No vague advice.

Every statement must tie to revenue improvement.
Every recommendation must reference a specific metric or gap.

You receive structured data from a deterministic scoring engine.
Do NOT recalculate metrics. Do NOT invent data.

Your job:
1. Explain the revenue constraint in plain operator language.
2. Estimate monthly revenue impact of the primary bottleneck.
3. Generate a 7-day execution plan (5-7 concrete steps).
4. Generate a 30-day revenue roadmap (3-4 milestones).
5. Suggest tools ONLY if they directly address the identified bottleneck.
6. Flag risk warnings based on metric trends.
7. Identify revenue opportunity signals.

Format your response as valid JSON matching this structure:
{
  "summary": "2-3 sentence analytical summary of revenue position",
  "weeklyExecutionPlan": ["Day 1-2: ...", "Day 3-4: ...", ...],
  "recommendedTools": ["tool_slug:reason", ...],
  "riskWarnings": ["warning text", ...],
  "opportunitySignals": ["signal text", ...]
}

Return ONLY the JSON. No markdown. No explanation outside the JSON.`;

function buildUserPrompt(payload: InsightPayload): string {
  const { businessProfile, metrics, revenueHealthSnapshot, bottleneckAssessment, benchmarkComparison } = payload;

  return `Revenue Health Score: ${revenueHealthSnapshot.totalScore}/100
Interpretation: ${revenueHealthSnapshot.interpretationBand}
Weakest Component: ${revenueHealthSnapshot.weakestComponent}

Component Breakdown:
${Object.entries(revenueHealthSnapshot.componentBreakdown)
  .map(([k, v]) => `- ${k}: ${v}/100`)
  .join("\n")}

Primary Bottleneck: ${bottleneckAssessment.primaryBottleneck}
Secondary Bottlenecks: ${bottleneckAssessment.secondaryBottlenecks.join(", ") || "None"}
Severity: ${bottleneckAssessment.severityScore}/100

Business Profile:
- Type: ${businessProfile.businessType}
- Stage: ${businessProfile.revenueStage}
- Channel: ${businessProfile.primaryChannel}
- Current Revenue: $${businessProfile.currentRevenue}/mo

Benchmark Comparison:
- Performance Tier: ${benchmarkComparison.performanceTier}
- Revenue Gap: $${benchmarkComparison.revenueGap}/mo vs benchmark
- Close Rate Gap: ${(benchmarkComparison.closeRateGap * 100).toFixed(1)}%
- Improvement Potential: $${benchmarkComparison.improvementPotential}/mo

Key Metrics:
- Revenue Trend (7d): ${metrics.revenueTrend7d}%
- Revenue Trend (30d): ${metrics.revenueTrend30d}%
- Lead Count: ${metrics.leadCount}
- Close Rate: ${(metrics.closeRate * 100).toFixed(1)}%
- Avg Deal Value: $${metrics.averageDealValue}
- Follow-Up Delay: ${metrics.followUpDelayHours}h
- Task Completion: ${metrics.taskCompletionRate}%
- Burnout Risk: ${metrics.burnoutRiskScore}/100
- Content Frequency: ${metrics.contentFrequency}/week`;
}

function generateFallbackInsight(payload: InsightPayload): GeneratedInsight {
  const { revenueHealthSnapshot, bottleneckAssessment, benchmarkComparison } = payload;

  const summary = `Revenue Health Score: ${revenueHealthSnapshot.totalScore}/100 (${revenueHealthSnapshot.interpretationBand}). Primary constraint: ${bottleneckAssessment.primaryBottleneck}. Estimated revenue gap: $${benchmarkComparison.revenueGap}/mo against ${benchmarkComparison.performanceTier} benchmark.`;

  const weeklyExecutionPlan = [
    `Day 1-2: Audit ${bottleneckAssessment.primaryBottleneck.toLowerCase()} pipeline for immediate leaks.`,
    `Day 3-4: Implement one high-impact fix targeting weakest component (${revenueHealthSnapshot.weakestComponent}).`,
    `Day 5-7: Measure baseline metrics and set 30-day improvement targets.`,
  ];

  const riskWarnings: string[] = [];
  if (revenueHealthSnapshot.totalScore < 50) {
    riskWarnings.push("Score below 50 indicates structural revenue risk requiring immediate intervention.");
  }
  if (bottleneckAssessment.severityScore >= 80) {
    riskWarnings.push(`${bottleneckAssessment.primaryBottleneck} severity at ${bottleneckAssessment.severityScore}/100 — critical threshold.`);
  }

  const opportunitySignals: string[] = [];
  if (benchmarkComparison.improvementPotential > 0) {
    opportunitySignals.push(`$${benchmarkComparison.improvementPotential}/mo recoverable by closing gap to benchmark.`);
  }

  return {
    summary,
    weeklyExecutionPlan,
    recommendedTools: [],
    riskWarnings,
    opportunitySignals,
  };
}

export async function generateRevenueInsight(
  userId: string,
  payload: InsightPayload
): Promise<GeneratedInsight> {
  const apiKey = process.env.OPENAI_API_KEY;

  let insight: GeneratedInsight;

  if (!apiKey) {
    insight = generateFallbackInsight(payload);
  } else {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: REVENUE_SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(payload) },
          ],
          max_tokens: 800,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        insight = generateFallbackInsight(payload);
      } else {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        insight = content ? JSON.parse(content) : generateFallbackInsight(payload);
      }
    } catch {
      insight = generateFallbackInsight(payload);
    }
  }

  // Persist to DB
  await prisma.insight.create({
    data: {
      userId,
      summary: insight.summary,
      weeklyExecutionPlan: JSON.stringify(insight.weeklyExecutionPlan),
      recommendedTools: JSON.stringify(insight.recommendedTools),
      riskWarnings: JSON.stringify(insight.riskWarnings),
      opportunitySignals: JSON.stringify(insight.opportunitySignals),
    },
  });

  return insight;
}
