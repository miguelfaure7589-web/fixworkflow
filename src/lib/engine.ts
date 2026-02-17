import type { DiagnosticInput } from "./recommendation-engine";
import {
  scoreBottlenecks,
  getTopCategories,
  BOTTLENECK_CATEGORIES,
  type BottleneckScore,
  type BottleneckCategory,
} from "./bottleneck-scoring";
import { actionLibrary, type ActionItem } from "@/data/action-library";
import { toolsDatabase, type ToolData } from "@/data/tools";
import { generateActionInsights } from "./ai-insights";
import { calculateHealthScore } from "./recommendation-engine";

// ─── Types ───

export interface EngineResult {
  healthScore: number;
  bottleneckScores: BottleneckScore[];
  topCategories: BottleneckScore[];
  actions: RankedAction[];
  toolStack: ToolStackGroup[];
  weeklyFocus: WeeklyFocusPlan | null;
}

export interface RankedAction {
  actionId: string;
  category: BottleneckCategory;
  categoryLabel: string;
  title: string;
  summary: string;
  difficulty: number;
  impact: number;
  timeToImplement: string;
  toolTags: string[];
  isPremiumOnly: boolean;
  aiInsight: { whyThisMatters: string; howToStart: string; resources: string[] } | null;
  matchedTools: ToolData[];
  resourceLinks: string[];
}

export interface ToolStackGroup {
  category: string;
  categoryLabel: string;
  tools: ToolData[];
  isPremiumOnly: boolean;
}

export interface WeeklyFocusPlan {
  actionTitle: string;
  actionId: string;
  days: { day: string; task: string }[];
}

// ─── Tool matching ───

const TOOL_TAG_TO_CATEGORY: Record<string, string[]> = {
  crm: ["crm"],
  email_marketing: ["email_marketing"],
  automation: ["automation"],
  project_management: ["project_management"],
  scheduling: ["scheduling"],
  time_tracking: ["time_tracking"],
  invoicing: ["invoicing"],
  communication: ["communication"],
  business_banking: ["business_banking"],
  business_lending: ["business_lending"],
  business_credit: ["business_credit"],
  business_phone: ["business_phone"],
  business_internet: ["business_internet"],
  payment_processing: ["payment_processing"],
  bookkeeping: ["bookkeeping"],
};

function matchToolsForAction(
  action: ActionItem,
  input: DiagnosticInput
): ToolData[] {
  const tools: ToolData[] = [];
  const seen = new Set<string>();

  for (const tag of action.affiliateToolTags) {
    const categories = TOOL_TAG_TO_CATEGORY[tag] || [tag];
    for (const cat of categories) {
      const matching = toolsDatabase.filter(
        (t) => t.category === cat && !seen.has(t.slug)
      );
      // Prefer tools that fit the user's role
      const sorted = matching.sort((a, b) => {
        const aFit = a.bestFor.includes(input.role) ? 1 : 0;
        const bFit = b.bestFor.includes(input.role) ? 1 : 0;
        return bFit - aFit || b.rating - a.rating;
      });
      for (const tool of sorted.slice(0, 2)) {
        if (!seen.has(tool.slug)) {
          seen.add(tool.slug);
          tools.push(tool);
        }
      }
    }
  }

  return tools;
}

// ─── Action ranking ───

function rankActions(
  topCategories: BottleneckScore[],
  input: DiagnosticInput,
  isPremium: boolean
): RankedAction[] {
  const categorySet = new Set(topCategories.map((c) => c.category));
  const scoreMap = new Map(topCategories.map((c) => [c.category, c.score]));

  // Filter actions matching top categories + user fit
  const stage = mapTeamSizeToStage(input.teamSize);
  const candidates = actionLibrary.filter((action) => {
    if (!categorySet.has(action.category)) return false;
    if (!action.stageFit.includes(stage)) return false;
    if (!action.businessTypeFit.includes(input.role)) return false;
    return true;
  });

  // Score each candidate
  const scored = candidates.map((action) => {
    const categoryScore = scoreMap.get(action.category) || 0;
    // Rank by: category relevance * impact, penalize difficulty
    const rank = categoryScore * action.impact - action.difficulty * 2;
    return { action, rank };
  });

  scored.sort((a, b) => b.rank - a.rank);

  const freeLimit = 3;
  const premiumLimit = 10;
  const topActions = scored.slice(0, premiumLimit);

  return topActions.map((item, i) => ({
    actionId: item.action.id,
    category: item.action.category,
    categoryLabel: BOTTLENECK_CATEGORIES[item.action.category] || item.action.category,
    title: item.action.title,
    summary: item.action.summary,
    difficulty: item.action.difficulty,
    impact: item.action.impact,
    timeToImplement: item.action.timeToImplement,
    toolTags: item.action.affiliateToolTags,
    isPremiumOnly: i >= freeLimit,
    aiInsight: null,
    matchedTools: matchToolsForAction(item.action, input),
    resourceLinks: item.action.resourceLinks || [],
  }));
}

function mapTeamSizeToStage(teamSize: string): string {
  const map: Record<string, string> = {
    solo: "solo",
    small: "small",
    "2-5": "small",
    "6-15": "medium",
    medium: "medium",
    "16-50": "larger",
    larger: "larger",
    "51+": "larger",
  };
  return map[teamSize] || "solo";
}

// ─── Tool stack grouping ───

function buildToolStack(
  actions: RankedAction[],
  isPremium: boolean
): ToolStackGroup[] {
  const groups = new Map<string, { tools: ToolData[]; isPremiumOnly: boolean }>();
  const allSlugs = new Set<string>();
  const freeToolLimit = 2;
  const premiumToolLimit = 8;
  let totalTools = 0;

  for (const action of actions) {
    for (const tool of action.matchedTools) {
      if (allSlugs.has(tool.slug)) continue;
      allSlugs.add(tool.slug);

      const isPremiumOnly = !isPremium && totalTools >= freeToolLimit;
      const key = tool.category;

      if (!groups.has(key)) {
        groups.set(key, { tools: [], isPremiumOnly });
      }
      const group = groups.get(key)!;
      group.tools.push(tool);
      if (isPremiumOnly) group.isPremiumOnly = true;

      totalTools++;
      if (totalTools >= premiumToolLimit) break;
    }
    if (totalTools >= premiumToolLimit) break;
  }

  const categoryLabels: Record<string, string> = {
    crm: "CRM & Sales",
    email_marketing: "Email Marketing",
    automation: "Automation",
    project_management: "Project Management",
    scheduling: "Scheduling",
    time_tracking: "Time Tracking",
    invoicing: "Invoicing & Accounting",
    communication: "Communication",
    business_banking: "Business Banking",
    business_phone: "Phone & VoIP",
    payment_processing: "Payment Processing",
  };

  return Array.from(groups.entries()).map(([category, { tools, isPremiumOnly }]) => ({
    category,
    categoryLabel: categoryLabels[category] || category.replace(/_/g, " "),
    tools,
    isPremiumOnly,
  }));
}

// ─── Weekly focus plan ───

function generateWeeklyFocus(topAction: RankedAction): WeeklyFocusPlan {
  const plans: Record<string, { day: string; task: string }[]> = {
    lead_generation: [
      { day: "Monday", task: "Define your ideal client profile and write down their top 3 pain points" },
      { day: "Tuesday", task: "Create your lead magnet outline or draft" },
      { day: "Wednesday", task: "Build a simple landing page with email capture" },
      { day: "Thursday", task: "Write 3 social posts promoting your lead magnet" },
      { day: "Friday", task: "Reach out to 10 prospects or share your lead magnet in 3 communities" },
      { day: "Saturday", task: "Review what's working and refine your messaging" },
      { day: "Sunday", task: "Plan next week's outreach schedule" },
    ],
    conversion: [
      { day: "Monday", task: "Map out your current sales conversation flow" },
      { day: "Tuesday", task: "Write a discovery call script with 5 key qualifying questions" },
      { day: "Wednesday", task: "Create or update your proposal template" },
      { day: "Thursday", task: "Draft a 3-email follow-up sequence for post-call" },
      { day: "Friday", task: "Practice your discovery call script and get feedback" },
      { day: "Saturday", task: "Set up your proposal tool and test the client experience" },
      { day: "Sunday", task: "Review pipeline and plan follow-ups for next week" },
    ],
    retention: [
      { day: "Monday", task: "List your top 10 clients and their last check-in date" },
      { day: "Tuesday", task: "Create a quarterly review template" },
      { day: "Wednesday", task: "Schedule check-ins with your 3 most important clients" },
      { day: "Thursday", task: "Draft a client feedback survey (3 questions max)" },
      { day: "Friday", task: "Send a value-add resource to 5 active clients" },
      { day: "Saturday", task: "Review client satisfaction trends and spot risks" },
      { day: "Sunday", task: "Plan client appreciation touches for next month" },
    ],
    pricing: [
      { day: "Monday", task: "Calculate your effective hourly rate for each service" },
      { day: "Tuesday", task: "Research competitor pricing for similar services" },
      { day: "Wednesday", task: "Draft 3 service tiers with clear deliverables" },
      { day: "Thursday", task: "Write value-based descriptions for each tier" },
      { day: "Friday", task: "Update your proposal template with new pricing" },
      { day: "Saturday", task: "Practice your pricing conversation and objection responses" },
      { day: "Sunday", task: "Set a date to implement new pricing for new clients" },
    ],
    offer_positioning: [
      { day: "Monday", task: "List your top 3 services and their results for clients" },
      { day: "Tuesday", task: "Define your signature offer: specific outcome, timeline, price" },
      { day: "Wednesday", task: "Write your positioning statement and unique value proposition" },
      { day: "Thursday", task: "Create one case study from a past client win" },
      { day: "Friday", task: "Update your website/LinkedIn with your new positioning" },
      { day: "Saturday", task: "Get feedback from a trusted peer on your positioning" },
      { day: "Sunday", task: "Plan content that reinforces your new positioning" },
    ],
    operations: [
      { day: "Monday", task: "List your 5 most repeated processes" },
      { day: "Tuesday", task: "Document process #1 as a step-by-step checklist" },
      { day: "Wednesday", task: "Document process #2 with screenshots or a Loom video" },
      { day: "Thursday", task: "Set up a central wiki/doc for all your SOPs" },
      { day: "Friday", task: "Create a weekly planning template and do your first planning session" },
      { day: "Saturday", task: "Review the week and identify one process to automate" },
      { day: "Sunday", task: "Plan which processes to document next week" },
    ],
    time_management: [
      { day: "Monday", task: "Track your time for the entire day — log every task and duration" },
      { day: "Tuesday", task: "Block 2 hours on your calendar for deep work (notifications off)" },
      { day: "Wednesday", task: "Batch all your emails into 2 sessions: 10am and 3pm" },
      { day: "Thursday", task: "List all tasks from this week and sort by value (high/medium/low)" },
      { day: "Friday", task: "Identify 3 tasks you could delegate or eliminate" },
      { day: "Saturday", task: "Set up your ideal weekly time block template" },
      { day: "Sunday", task: "Pre-plan Monday's deep work session with a specific goal" },
    ],
    cashflow: [
      { day: "Monday", task: "List all outstanding invoices and their due dates" },
      { day: "Tuesday", task: "Send invoices for any completed work not yet billed" },
      { day: "Wednesday", task: "Set up automatic payment reminders in your invoicing tool" },
      { day: "Thursday", task: "Create a 90-day cash flow forecast spreadsheet" },
      { day: "Friday", task: "Research business banking options with auto-budgeting" },
      { day: "Saturday", task: "Set up tax reserve (25%) and profit (10%) auto-transfers" },
      { day: "Sunday", task: "Review your forecast and plan for any upcoming gaps" },
    ],
    marketing_channel_fit: [
      { day: "Monday", task: "List every marketing channel you've used and its results" },
      { day: "Tuesday", task: "Calculate cost-per-lead for your top 3 channels" },
      { day: "Wednesday", task: "Pick your #1 channel and plan 5 pieces of content" },
      { day: "Thursday", task: "Create one long-form content piece for your top channel" },
      { day: "Friday", task: "Repurpose that content into 3-5 social media posts" },
      { day: "Saturday", task: "Set up an email signup form on your website or bio link" },
      { day: "Sunday", task: "Schedule next week's content and set a publishing cadence" },
    ],
    sales_process: [
      { day: "Monday", task: "Map your current sales process from first contact to close" },
      { day: "Tuesday", task: "Set up a CRM (even a free one) with your pipeline stages" },
      { day: "Wednesday", task: "Add all your current prospects and leads to the CRM" },
      { day: "Thursday", task: "Write email templates for each pipeline stage transition" },
      { day: "Friday", task: "Set up follow-up reminders for all active deals" },
      { day: "Saturday", task: "Review your pipeline and score each deal by probability" },
      { day: "Sunday", task: "Plan next week's sales activities by deal priority" },
    ],
    tech_stack: [
      { day: "Monday", task: "List every tool you use with monthly cost and purpose" },
      { day: "Tuesday", task: "Identify overlapping tools and decide which to keep" },
      { day: "Wednesday", task: "Cancel 1-2 unused or redundant subscriptions" },
      { day: "Thursday", task: "Set up one automation connecting your top 2 tools" },
      { day: "Friday", task: "Create a 'tool stack' document listing your core tools and their purpose" },
      { day: "Saturday", task: "Watch a 20-minute tutorial on an underused feature of your main tool" },
      { day: "Sunday", task: "Plan which integrations to set up next week" },
    ],
  };

  const fallbackPlan = [
    { day: "Monday", task: "Identify the single biggest bottleneck in your workflow" },
    { day: "Tuesday", task: "Research solutions and pick one approach" },
    { day: "Wednesday", task: "Implement the first step of your solution" },
    { day: "Thursday", task: "Test and iterate on what you implemented" },
    { day: "Friday", task: "Document what worked and what needs adjustment" },
    { day: "Saturday", task: "Review progress and plan next steps" },
    { day: "Sunday", task: "Set specific goals for next week's improvement" },
  ];

  return {
    actionTitle: topAction.title,
    actionId: topAction.actionId,
    days: plans[topAction.category] || fallbackPlan,
  };
}

// ─── Main engine ───

export async function runEngine(
  input: DiagnosticInput,
  isPremium: boolean
): Promise<EngineResult> {
  // 1. Score bottlenecks
  const bottleneckScores = scoreBottlenecks(input);
  const topCategories = getTopCategories(bottleneckScores, isPremium);

  // 2. Rank actions
  const actions = rankActions(topCategories, input, isPremium);

  // 3. AI insights (for visible actions)
  const visibleActions = isPremium ? actions : actions.slice(0, 3);
  const insights = await generateActionInsights(input, visibleActions);
  for (let i = 0; i < visibleActions.length; i++) {
    if (insights[i]) {
      visibleActions[i].aiInsight = insights[i];
    }
  }

  // 4. Build tool stack
  const toolStack = buildToolStack(actions, isPremium);

  // 5. Weekly focus (premium only)
  const weeklyFocus =
    isPremium && actions.length > 0
      ? generateWeeklyFocus(actions[0])
      : null;

  // 6. Health score
  const healthScore = calculateHealthScore(input);

  return {
    healthScore,
    bottleneckScores,
    topCategories,
    actions,
    toolStack,
    weeklyFocus,
  };
}
