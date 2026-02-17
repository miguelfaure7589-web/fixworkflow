import type { DiagnosticInput } from "./recommendation-engine";
import type { RankedAction } from "./engine";

export interface ActionInsight {
  whyThisMatters: string;
  howToStart: string;
  resources: string[];
}

const SYSTEM_PROMPT = `You are FixWorkFlow's AI assistant. Generate practical, concise advice for small business owners and freelancers. Be professional, direct, and specific — no hype or filler. Address the user as "you."`;

export async function generateActionInsights(
  input: DiagnosticInput,
  actions: RankedAction[]
): Promise<(ActionInsight | null)[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || actions.length === 0) {
    return actions.map((a) => generateFallbackInsight(input, a));
  }

  try {
    const prompt = buildPrompt(input, actions);

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
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return actions.map((a) => generateFallbackInsight(input, a));
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      return actions.map((a) => generateFallbackInsight(input, a));
    }

    return parseAIResponse(content, actions, input);
  } catch {
    return actions.map((a) => generateFallbackInsight(input, a));
  }
}

function buildPrompt(input: DiagnosticInput, actions: RankedAction[]): string {
  const actionList = actions
    .map(
      (a, i) =>
        `${i + 1}. "${a.title}" (Category: ${a.categoryLabel}, Impact: ${a.impact}/5)`
    )
    .join("\n");

  return `For a ${input.role} in ${input.industry} (team size: ${input.teamSize}, productivity: ${input.productivityScore}/5), generate insights for each action below.

For each action, provide:
- "why": 1-2 sentences on why this matters for their specific situation
- "how": 1-2 sentences on the very first step they should take
- "resources": 1-2 search queries they can use to find helpful resources

Actions:
${actionList}

Respond as a JSON array matching the action order:
[{"why":"...","how":"...","resources":["..."]},...]

Keep tone professional and concise. No generic advice — tailor to a ${input.role} in ${input.industry}.`;
}

function parseAIResponse(
  content: string,
  actions: RankedAction[],
  input: DiagnosticInput
): (ActionInsight | null)[] {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return actions.map((a) => generateFallbackInsight(input, a));
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      return actions.map((a) => generateFallbackInsight(input, a));
    }

    return actions.map((action, i) => {
      const item = parsed[i];
      if (!item) return generateFallbackInsight(input, action);
      return {
        whyThisMatters: item.why || "",
        howToStart: item.how || "",
        resources: Array.isArray(item.resources) ? item.resources : [],
      };
    });
  } catch {
    return actions.map((a) => generateFallbackInsight(input, a));
  }
}

// ─── Fallback (deterministic) ───

const CATEGORY_WHY: Record<string, Record<string, string>> = {
  lead_generation: {
    freelancer:
      "Without a repeatable lead generation system, your income depends entirely on referrals and luck. Building a pipeline gives you control over your revenue.",
    solopreneur:
      "Your growth is capped by how many prospects know about you. A lead generation system compounds over time, turning visibility into revenue.",
    default:
      "Consistent lead generation is the foundation of predictable revenue. Without it, growth stalls and income stays unpredictable.",
  },
  conversion: {
    freelancer:
      "You're probably losing 40-60% of qualified leads because your sales process has gaps. Tightening your conversion funnel directly increases revenue without needing more leads.",
    default:
      "Improving your conversion rate is the fastest way to grow revenue. Getting 10% more leads to say yes has the same effect as generating 10% more leads — but it's usually easier.",
  },
  retention: {
    default:
      "Acquiring a new client costs 5-7x more than keeping an existing one. Improving retention is the most capital-efficient way to grow.",
  },
  pricing: {
    freelancer:
      "Most freelancers undercharge by 20-40%. A pricing adjustment is the highest-leverage change you can make — it increases revenue without increasing workload.",
    default:
      "Your pricing directly determines your profitability and the quality of clients you attract. Getting it right changes everything downstream.",
  },
  offer_positioning: {
    default:
      "A clear, differentiated offer makes you easy to choose and easy to refer. Without it, you're competing on price in a crowded market.",
  },
  operations: {
    default:
      "Operational inefficiency is a hidden tax on every hour you work. Fixing it compounds — every process improved saves time forever.",
  },
  time_management: {
    freelancer:
      "As a freelancer, your time literally is your product. Every hour lost to poor time management is revenue left on the table.",
    default:
      "Better time management doesn't mean working more — it means spending more time on high-value work and less on low-value tasks.",
  },
  cashflow: {
    default:
      "Cash flow problems kill more businesses than lack of revenue. Having systems to get paid faster and forecast accurately removes the constant financial stress.",
  },
  marketing_channel_fit: {
    default:
      "Most businesses spread their marketing too thin across too many channels. Focusing on 1-2 channels that actually work for your audience multiplies your results.",
  },
  sales_process: {
    default:
      "A documented, repeatable sales process turns selling from an art into a system. It makes results predictable and eventually delegatable.",
  },
  tech_stack: {
    default:
      "Tool sprawl creates data silos, subscription waste, and constant context switching. A streamlined stack saves money and time every single day.",
  },
};

const CATEGORY_HOW: Record<string, string> = {
  lead_generation:
    "Start by writing down exactly who your ideal client is and what specific problem you solve for them. Then create one simple resource that addresses that problem.",
  conversion:
    "Map out your current sales process from first contact to signed deal. Identify where prospects typically drop off — that's your highest-leverage fix.",
  retention:
    "List your top 10 clients and when you last proactively reached out. Schedule a check-in with each one this week — just to listen, not to sell.",
  pricing:
    "Calculate your effective hourly rate for your last 5 projects (total revenue / total hours including admin). If it's below your target, that's your starting point.",
  offer_positioning:
    "Write a one-sentence description of what you do, for whom, and what specific result you deliver. Test it with 3 trusted contacts and refine.",
  operations:
    "Pick the one process you repeat most often and document it as a numbered checklist. Time yourself — this baseline tells you where improvement is possible.",
  time_management:
    "Tomorrow, block 2 hours on your calendar marked 'Deep Work' — close all messaging apps and work on your highest-priority task only.",
  cashflow:
    "Right now, send any outstanding invoices and set a reminder to invoice within 48 hours of completing any future work.",
  marketing_channel_fit:
    "List every marketing activity you've done in the last 30 days. For each, note how many leads it generated. The answer will be obvious.",
  sales_process:
    "Create a simple spreadsheet or sign up for a free CRM. Add every current prospect with their stage, last contact date, and next step.",
  tech_stack:
    "Open your credit card or bank statement and list every software subscription. Star the ones you used this week. Unstar = cancel candidate.",
};

function generateFallbackInsight(
  input: DiagnosticInput,
  action: RankedAction
): ActionInsight {
  const catWhy = CATEGORY_WHY[action.category];
  const whyThisMatters =
    (catWhy && (catWhy[input.role] || catWhy.default)) ||
    `Addressing ${action.categoryLabel.toLowerCase()} is critical for your workflow efficiency and growth.`;

  const howToStart =
    CATEGORY_HOW[action.category] ||
    "Start by identifying the single biggest blocker in this area and taking one concrete step to address it today.";

  const resources = action.resourceLinks.length > 0
    ? action.resourceLinks
    : [`${action.title} guide`, `${action.categoryLabel} tips for ${input.role}s`];

  return { whyThisMatters, howToStart, resources };
}
