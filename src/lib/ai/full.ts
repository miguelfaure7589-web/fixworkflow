/**
 * AI Explain — Full Explanation Generator
 *
 * Tries OpenAI first. Falls back to deterministic generation.
 * Never claims it will do things automatically — guidance only.
 */
import type { FullExplanation } from "./types";
import type { BusinessTypeName, RevenueHealthScoreResult, PillarName } from "@/lib/revenue-health/types";

interface FullGenContext {
  itemType: "focus" | "tool";
  itemKey: string;
  pillar: string;
  title: string;
  description: string;
  businessType: BusinessTypeName;
  scoreResult: RevenueHealthScoreResult | null;
}

// ── OpenAI Generation ──

const SYSTEM_PROMPT = `You are FixWorkFlow's revenue advisor. You help business owners understand why specific actions matter and how to execute them.

Rules:
- Be specific, practical, and confident but realistic.
- NEVER claim you will do things automatically. You provide guidance, reasoning, and prompts the user can act on.
- NEVER promise guaranteed results.
- Tailor advice to the user's business type and metrics.
- Keep language clear and actionable.

Return ONLY valid JSON with this exact structure:
{
  "whyDeep": "2-3 sentences explaining why this matters for their specific situation",
  "steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4...", "Step 5..."],
  "successMetrics": ["Metric 1...", "Metric 2...", "Metric 3..."],
  "pitfalls": ["Pitfall 1...", "Pitfall 2..."],
  "suggestedTools": ["Tool 1...", "Tool 2..."],
  "promptToExecute": "A copy-paste prompt the user can use with an AI assistant to get started"
}`;

function buildUserPrompt(ctx: FullGenContext): string {
  const parts = [
    `Business type: ${ctx.businessType}`,
    `Item: "${ctx.title}" (${ctx.itemType}, pillar: ${ctx.pillar})`,
    `Context: ${ctx.description}`,
  ];

  if (ctx.scoreResult) {
    parts.push(`Overall score: ${ctx.scoreResult.score}/100`);
    parts.push(`Primary risk: ${ctx.scoreResult.primaryRisk}`);
    parts.push(`Fastest lever: ${ctx.scoreResult.fastestLever}`);

    const pillarData = ctx.scoreResult.pillars[ctx.pillar as PillarName];
    if (pillarData) {
      parts.push(`${ctx.pillar} pillar score: ${pillarData.score}/100`);
      if (pillarData.reasons.length > 0) {
        parts.push(`Pillar reasons: ${pillarData.reasons.join("; ")}`);
      }
    }
  }

  parts.push(
    "",
    "Generate a full action plan for this item. Be specific to their business type and current metrics. Remember: guidance only, no claims of automatic execution.",
  );

  return parts.join("\n");
}

export async function generateFullWithAI(ctx: FullGenContext): Promise<FullExplanation | null> {
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
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Validate shape
    if (
      typeof parsed.whyDeep !== "string" ||
      !Array.isArray(parsed.steps) ||
      !Array.isArray(parsed.successMetrics)
    ) {
      return null;
    }

    return {
      whyDeep: parsed.whyDeep,
      steps: parsed.steps.map(String),
      successMetrics: parsed.successMetrics.map(String),
      pitfalls: (parsed.pitfalls ?? []).map(String),
      suggestedTools: (parsed.suggestedTools ?? []).map(String),
      promptToExecute: parsed.promptToExecute ?? "",
    };
  } catch {
    return null;
  }
}

// ── Deterministic Fallback ──

const FALLBACK_STEPS: Record<string, string[]> = {
  revenue: [
    "Review your pricing across all products/services and identify one underpriced item.",
    "Create a limited-time promotion for your best-selling offering.",
    "Set up a simple upsell or cross-sell at checkout or during delivery.",
    "Reach out to 10 past customers with a tailored re-engagement offer.",
    "Track daily revenue for 14 days to establish your baseline trend.",
  ],
  profitability: [
    "Calculate your true gross margin by listing all direct costs.",
    "Identify your top 3 expenses and negotiate or find alternatives for the largest one.",
    "Review your pricing to ensure at least a 50% gross margin on core offerings.",
    "Set up a monthly P&L review — even a simple spreadsheet works.",
    "Eliminate one subscription or tool you haven't used in the last 30 days.",
  ],
  retention: [
    "Send a check-in email to your 10 most recent customers asking for feedback.",
    "Create a simple post-purchase email sequence (3 emails over 14 days).",
    "Identify your top 3 churn reasons by reviewing support tickets or exit surveys.",
    "Launch a loyalty incentive (discount on next purchase, referral bonus).",
    "Schedule monthly check-ins with your top 20% of customers by revenue.",
  ],
  acquisition: [
    "Audit your main landing page — is the CTA clear and above the fold?",
    "Set up one new content piece targeting a buyer-intent keyword.",
    "Run a small A/B test on your highest-traffic page (headline or CTA).",
    "Ask 3 happy customers for a testimonial and add them to your site.",
    "Review your conversion funnel for drop-off points and fix the biggest one.",
  ],
  ops: [
    "List every repetitive task you do weekly and estimate time spent on each.",
    "Automate the most time-consuming repetitive task using Zapier, Make, or a script.",
    "Create a standard operating procedure (SOP) for your most common workflow.",
    "Batch similar tasks together instead of context-switching throughout the day.",
    "Set up a simple dashboard or checklist for daily operations.",
  ],
};

const FALLBACK_METRICS: Record<string, string[]> = {
  revenue: ["Monthly revenue growth rate", "Average order value trend", "Revenue per customer"],
  profitability: ["Gross margin percentage", "Net profit margin", "LTV:CAC ratio"],
  retention: ["Monthly churn rate", "Repeat purchase rate", "Customer lifetime value"],
  acquisition: ["Conversion rate", "Cost per acquisition", "Monthly traffic growth"],
  ops: ["Hours spent on ops per week", "Fulfillment time", "Support ticket volume"],
};

const FALLBACK_PITFALLS: Record<string, string[]> = {
  revenue: [
    "Discounting too aggressively can train customers to wait for sales.",
    "Focusing on new products while neglecting your proven performers.",
  ],
  profitability: [
    "Cutting costs that directly affect product quality or customer experience.",
    "Ignoring hidden costs like your own time when calculating margins.",
  ],
  retention: [
    "Over-emailing can push customers away instead of keeping them engaged.",
    "Offering discounts to retain customers can attract price-sensitive buyers who churn anyway.",
  ],
  acquisition: [
    "Spending on paid ads before your conversion funnel is optimized wastes budget.",
    "Chasing vanity metrics (followers, page views) instead of qualified leads.",
  ],
  ops: [
    "Automating a broken process just makes it break faster — fix the process first.",
    "Over-investing in tooling before you have enough volume to justify the cost.",
  ],
};

export function generateFullFallback(ctx: FullGenContext): FullExplanation {
  const pillarKey = ctx.pillar in FALLBACK_STEPS ? ctx.pillar : "ops";

  let whyDeep = `"${ctx.title}" directly addresses your ${pillarKey} performance.`;

  if (ctx.scoreResult) {
    const pillarData = ctx.scoreResult.pillars[pillarKey as PillarName];
    if (pillarData && pillarData.score < 50) {
      whyDeep += ` Your ${pillarKey} score is ${pillarData.score}/100, which puts this in the high-priority zone.`;
    } else if (pillarData) {
      whyDeep += ` Your ${pillarKey} score is ${pillarData.score}/100 — there's room to optimize further.`;
    }
    whyDeep += ` For a ${ctx.businessType} business, this is especially important because it affects your ability to grow sustainably.`;
  } else {
    whyDeep += ` As a ${ctx.businessType} business, addressing this will strengthen your overall revenue health.`;
  }

  const promptToExecute = `Help me create a detailed action plan for "${ctx.title}" for my ${ctx.businessType} business. My current situation: ${ctx.description}. I need specific, actionable steps I can start this week. Focus on practical execution, not theory.`;

  return {
    whyDeep,
    steps: FALLBACK_STEPS[pillarKey] ?? FALLBACK_STEPS["ops"],
    successMetrics: FALLBACK_METRICS[pillarKey] ?? FALLBACK_METRICS["ops"],
    pitfalls: FALLBACK_PITFALLS[pillarKey] ?? FALLBACK_PITFALLS["ops"],
    suggestedTools: ctx.itemType === "tool"
      ? [ctx.title, "Google Sheets for tracking"]
      : ["A project management tool for tracking progress", "A simple spreadsheet for metrics"],
    promptToExecute,
  };
}
