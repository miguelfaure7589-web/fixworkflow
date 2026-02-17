/**
 * Playbook AI Expansion — generates a 7-day personalized plan
 *
 * Tries OpenAI first, falls back to deterministic generation.
 */
import type { ExpandedPlaybook } from "./types";
import type { BusinessTypeName, RevenueHealthScoreResult, PillarName } from "@/lib/revenue-health/types";

interface ExpandContext {
  playbookSlug: string;
  playbookTitle: string;
  category: string;
  baseSteps: { step: number; title: string; action: string }[];
  baseImpact: string;
  effortLevel: string;
  businessType: BusinessTypeName;
  scoreResult: RevenueHealthScoreResult | null;
  triggerReason: string;
}

const SYSTEM_PROMPT = `You are FixWorkFlow's revenue advisor. Generate a personalized 7-day action plan based on the playbook and user's metrics.

Rules:
- Be specific, practical, and confident but realistic.
- NEVER claim you will do things automatically. You provide guidance only.
- NEVER promise guaranteed results.
- Tailor advice to the user's business type and metrics.
- Each day should have one clear, focused action.

Return ONLY valid JSON with this exact structure:
{
  "personalizedSteps": [
    { "day": 1, "title": "...", "action": "...", "whyNow": "..." },
    { "day": 2, "title": "...", "action": "...", "whyNow": "..." },
    { "day": 3, "title": "...", "action": "...", "whyNow": "..." },
    { "day": 4, "title": "...", "action": "...", "whyNow": "..." },
    { "day": 5, "title": "...", "action": "...", "whyNow": "..." },
    { "day": 6, "title": "...", "action": "...", "whyNow": "..." },
    { "day": 7, "title": "...", "action": "...", "whyNow": "..." }
  ],
  "kpiTargets": ["Metric to track 1...", "Metric to track 2...", "Metric to track 3..."],
  "risks": ["Risk to watch 1...", "Risk to watch 2..."],
  "suggestedTools": ["Tool 1...", "Tool 2..."],
  "copyPrompt": "A copy-paste prompt the user can use with an AI assistant to execute day 1"
}`;

function buildUserPrompt(ctx: ExpandContext): string {
  const parts = [
    `Business type: ${ctx.businessType}`,
    `Playbook: "${ctx.playbookTitle}" (category: ${ctx.category})`,
    `Trigger: ${ctx.triggerReason}`,
    `Base impact: ${ctx.baseImpact}`,
    `Effort level: ${ctx.effortLevel}`,
    "",
    "Base steps to personalize:",
    ...ctx.baseSteps.map((s) => `  ${s.step}. ${s.title}: ${s.action}`),
  ];

  if (ctx.scoreResult) {
    parts.push("", `Overall score: ${ctx.scoreResult.score}/100`);
    parts.push(`Primary risk: ${ctx.scoreResult.primaryRisk}`);
    parts.push(`Fastest lever: ${ctx.scoreResult.fastestLever}`);

    const pillarData = ctx.scoreResult.pillars[ctx.category as PillarName];
    if (pillarData) {
      parts.push(`${ctx.category} pillar score: ${pillarData.score}/100`);
    }
  }

  parts.push(
    "",
    "Expand these base steps into a 7-day personalized plan. Be specific to their business type and situation.",
  );

  return parts.join("\n");
}

export async function expandWithAI(ctx: ExpandContext): Promise<ExpandedPlaybook | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(ctx) },
        ],
        max_tokens: 1200,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.personalizedSteps) || parsed.personalizedSteps.length === 0) {
      return null;
    }

    return {
      personalizedSteps: parsed.personalizedSteps.map((s: Record<string, unknown>) => ({
        day: Number(s.day) || 1,
        title: String(s.title || ""),
        action: String(s.action || ""),
        whyNow: String(s.whyNow || ""),
      })),
      kpiTargets: (parsed.kpiTargets ?? []).map(String),
      risks: (parsed.risks ?? []).map(String),
      suggestedTools: (parsed.suggestedTools ?? []).map(String),
      copyPrompt: String(parsed.copyPrompt ?? ""),
    };
  } catch {
    return null;
  }
}

export function expandFallback(ctx: ExpandContext): ExpandedPlaybook {
  // Spread base steps across 7 days
  const personalizedSteps = ctx.baseSteps.map((s, i) => ({
    day: i + 1,
    title: s.title,
    action: s.action,
    whyNow: i === 0
      ? `${ctx.triggerReason} Start here to build momentum.`
      : `Builds on the previous step to strengthen your ${ctx.category}.`,
  }));

  // Pad to 7 days if fewer base steps
  while (personalizedSteps.length < 7) {
    const dayNum = personalizedSteps.length + 1;
    personalizedSteps.push({
      day: dayNum,
      title: dayNum === 7 ? "Review and plan next week" : "Consolidate progress",
      action: dayNum === 7
        ? "Review what you accomplished this week. Document results, note what worked, and plan adjustments for next week."
        : "Review steps so far, fix anything incomplete, and prepare for the next action.",
      whyNow: "Consistency compounds. Reviewing progress prevents drift.",
    });
  }

  const FALLBACK_KPIS: Record<string, string[]> = {
    revenue: ["Daily revenue vs target", "Number of offers sent", "Average deal value"],
    profitability: ["Gross margin %", "Cost per unit", "Net profit trend"],
    retention: ["Monthly churn rate", "Repeat purchase rate", "NPS or satisfaction score"],
    acquisition: ["Conversion rate", "Cost per acquisition", "Lead volume"],
    ops: ["Hours on ops per week", "Tasks automated", "Fulfillment time"],
  };

  const FALLBACK_RISKS: Record<string, string[]> = {
    revenue: ["Discounting too aggressively can erode margins.", "Spreading focus across too many initiatives at once."],
    profitability: ["Cutting costs that affect product quality.", "Raising prices without communicating added value."],
    retention: ["Over-communicating can push customers away.", "Loyalty programs with poor unit economics."],
    acquisition: ["Spending on ads before funnel is optimized.", "Chasing vanity metrics over qualified leads."],
    ops: ["Automating a broken process.", "Over-investing in tools before you need them."],
  };

  const cat = ctx.category in FALLBACK_KPIS ? ctx.category : "ops";

  return {
    personalizedSteps,
    kpiTargets: FALLBACK_KPIS[cat],
    risks: FALLBACK_RISKS[cat],
    suggestedTools: ["A spreadsheet for tracking daily metrics", "Your existing project management tool"],
    copyPrompt: `Help me execute "${ctx.playbookTitle}" for my ${ctx.businessType} business. ${ctx.triggerReason} I need a detailed day-by-day plan starting today. Focus on practical execution, not theory.`,
  };
}
