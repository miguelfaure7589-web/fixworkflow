/**
 * Sprint B — Deterministic 7-day Action Plan Generator
 *
 * Takes a RevenueHealthScoreResult and produces a prioritized
 * weekly action plan targeting the weakest pillars.
 */

import type { RevenueHealthScoreResult, PillarName, RevenueInputs } from "./types";

export type EffortSize = "S" | "M" | "L";

export interface ActionTask {
  id: string;
  title: string;
  why: string;
  howToStart: string;
  expectedImpact: string;
  effort: EffortSize;
  dueInDays: number; // 1-7
  pillar: PillarName;
}

export interface ActionPlan {
  tasks: ActionTask[];
  primaryPillar: PillarName;
  secondaryPillar: PillarName;
}

// ── Task templates per pillar ──

interface TaskTemplate {
  title: string;
  why: string;
  howToStart: string;
  expectedImpact: string;
  effort: EffortSize;
  condition?: (inputs: RevenueInputs) => boolean;
}

const PILLAR_TASKS: Record<PillarName, TaskTemplate[]> = {
  revenue: [
    {
      title: "Audit your top 3 revenue sources",
      why: "Understanding where revenue comes from reveals where to double down.",
      howToStart: "List every revenue stream and rank by monthly contribution. Identify the top 3.",
      expectedImpact: "Clarity on where to focus growth efforts",
      effort: "S",
    },
    {
      title: "Create one upsell or cross-sell offer",
      why: "Selling more to existing customers is faster than finding new ones.",
      howToStart: "Pick your best-selling product and create a bundle or upgrade option.",
      expectedImpact: "10-25% increase in average order value",
      effort: "M",
    },
    {
      title: "Launch a limited-time promotion",
      why: "Urgency drives action — a time-boxed offer can spike short-term revenue.",
      howToStart: "Create a 48-hour flash deal for your highest-margin product. Email your list.",
      expectedImpact: "Immediate revenue boost within the week",
      effort: "M",
    },
    {
      title: "Set up revenue tracking dashboard",
      why: "You can't improve what you don't measure daily.",
      howToStart: "Use a spreadsheet or tool to track daily revenue, orders, and AOV.",
      expectedImpact: "Faster response to revenue dips",
      effort: "S",
    },
    {
      title: "Raise prices on your lowest-margin offering",
      why: "Many businesses underprice — even a 10% increase rarely affects volume.",
      howToStart: "Identify your lowest-margin product and test a 10-15% price increase.",
      expectedImpact: "Direct margin improvement with minimal effort",
      effort: "S",
      condition: (i) => (i.grossMarginPct ?? 100) < 50,
    },
  ],
  profitability: [
    {
      title: "Review and cut your 3 biggest expenses",
      why: "Reducing costs drops straight to the bottom line.",
      howToStart: "Export last month's expenses. Sort by amount. Question each of the top 5.",
      expectedImpact: "5-15% reduction in monthly burn",
      effort: "S",
    },
    {
      title: "Calculate your true CAC and LTV",
      why: "Without these numbers you're flying blind on unit economics.",
      howToStart: "Total marketing spend ÷ new customers = CAC. Average revenue per customer × avg lifetime = LTV.",
      expectedImpact: "Foundation for all profitability decisions",
      effort: "M",
      condition: (i) => i.cac === undefined || i.ltv === undefined,
    },
    {
      title: "Negotiate one vendor contract",
      why: "Most vendors have room to negotiate — especially annual contracts.",
      howToStart: "Pick your most expensive SaaS tool and ask for a 15% discount for annual commitment.",
      expectedImpact: "Immediate cost savings",
      effort: "S",
    },
    {
      title: "Implement profit-first allocation",
      why: "Paying yourself first ensures profitability isn't an afterthought.",
      howToStart: "Set up a separate profit account. Move 5% of every deposit there automatically.",
      expectedImpact: "Guaranteed profit accumulation",
      effort: "M",
    },
  ],
  retention: [
    {
      title: "Email 10 recent churned customers",
      why: "Understanding why people leave is the fastest path to fixing retention.",
      howToStart: "Send a personal email: 'We noticed you left — would love 2 minutes of feedback.'",
      expectedImpact: "Actionable churn reasons + potential win-backs",
      effort: "S",
    },
    {
      title: "Create a post-purchase email sequence",
      why: "The first 7 days after purchase determine whether a customer returns.",
      howToStart: "Draft 3 emails: Day 1 welcome, Day 3 tips, Day 7 check-in. Set up in your email tool.",
      expectedImpact: "15-30% improvement in repeat purchase rate",
      effort: "M",
    },
    {
      title: "Identify your top 10% of customers",
      why: "Your best customers drive disproportionate revenue — protect and grow them.",
      howToStart: "Sort customers by total spend. Create a VIP list and send them a personal thank-you.",
      expectedImpact: "Stronger relationships with highest-value accounts",
      effort: "S",
    },
    {
      title: "Add a feedback mechanism to your product",
      why: "Customers who feel heard churn less.",
      howToStart: "Add a simple NPS survey or feedback widget. Review responses weekly.",
      expectedImpact: "Early warning system for churn risks",
      effort: "M",
    },
    {
      title: "Set up churn tracking",
      why: "You need to know your monthly churn rate to improve it.",
      howToStart: "Count customers at start of month vs end. Calculate: lost ÷ starting × 100.",
      expectedImpact: "Baseline measurement for all retention efforts",
      effort: "S",
      condition: (i) => i.churnMonthlyPct === undefined,
    },
  ],
  acquisition: [
    {
      title: "Publish one SEO-optimized article",
      why: "Content compounds — each article is a permanent traffic source.",
      howToStart: "Research one buyer-intent keyword. Write a 1500-word guide targeting it.",
      expectedImpact: "Organic traffic growth within 30-90 days",
      effort: "M",
    },
    {
      title: "A/B test your main landing page CTA",
      why: "Small conversion improvements multiply across all traffic.",
      howToStart: "Change your CTA button text and color. Run for 1 week and compare.",
      expectedImpact: "10-30% conversion rate improvement",
      effort: "S",
      condition: (i) => (i.conversionRatePct ?? 100) < 3,
    },
    {
      title: "Set up one referral incentive",
      why: "Referred customers have 2-3x higher LTV than paid acquisition.",
      howToStart: "Offer existing customers $20 credit for each referral that converts.",
      expectedImpact: "New acquisition channel with low CAC",
      effort: "M",
    },
    {
      title: "Optimize your signup/checkout flow",
      why: "Every unnecessary step in your funnel loses 10-20% of prospects.",
      howToStart: "Walk through your checkout as a new user. Remove or combine any unnecessary steps.",
      expectedImpact: "Immediate conversion lift",
      effort: "S",
    },
    {
      title: "Install analytics and set up conversion tracking",
      why: "You can't optimize acquisition without knowing where visitors come from and convert.",
      howToStart: "Set up Google Analytics 4 with conversion events for signups/purchases.",
      expectedImpact: "Data-driven acquisition decisions",
      effort: "M",
      condition: (i) => i.trafficMonthly === undefined,
    },
  ],
  ops: [
    {
      title: "Automate your most repeated weekly task",
      why: "Every hour saved on ops is an hour you can spend on growth.",
      howToStart: "List your 5 most repetitive tasks. Pick the easiest to automate with Zapier or similar.",
      expectedImpact: "2-5 hours saved per week",
      effort: "M",
    },
    {
      title: "Document your top 3 processes as SOPs",
      why: "SOPs let you delegate or automate — you can't scale what isn't documented.",
      howToStart: "Screen-record yourself doing each process. Turn into step-by-step checklists.",
      expectedImpact: "Foundation for delegation and scaling",
      effort: "M",
    },
    {
      title: "Batch similar tasks into time blocks",
      why: "Context switching is the #1 productivity killer.",
      howToStart: "Group email, calls, and admin into dedicated 1-hour blocks. Protect deep work time.",
      expectedImpact: "30-50% improvement in productive output",
      effort: "S",
    },
    {
      title: "Reduce support ticket volume",
      why: "Each ticket costs time — prevention is better than response.",
      howToStart: "Review top 5 ticket categories. Create FAQ or help docs for the most common issues.",
      expectedImpact: "20-40% reduction in support load",
      effort: "M",
      condition: (i) => (i.supportTicketsPerWeek ?? 0) > 15,
    },
    {
      title: "Set up a weekly 15-minute ops review",
      why: "A brief weekly check prevents small issues from becoming big problems.",
      howToStart: "Block 15 min every Friday. Review: what broke, what's slow, what to fix next week.",
      expectedImpact: "Continuous operational improvement",
      effort: "S",
    },
  ],
};

// ── Plan Generation ──

function getWeakestPillars(
  result: RevenueHealthScoreResult,
): [PillarName, PillarName] {
  const sorted = (
    Object.entries(result.pillars) as [PillarName, { score: number }][]
  ).sort((a, b) => a[1].score - b[1].score);

  return [sorted[0][0], sorted[1][0]];
}

export function generateActionPlan(
  result: RevenueHealthScoreResult,
  inputs: RevenueInputs,
): ActionPlan {
  const [primary, secondary] = getWeakestPillars(result);

  const tasks: ActionTask[] = [];
  let idCounter = 1;
  let dayCounter = 1;

  // Pick tasks from primary pillar (up to 5)
  const primaryTemplates = PILLAR_TASKS[primary].filter(
    (t) => !t.condition || t.condition(inputs),
  );
  for (const t of primaryTemplates.slice(0, 5)) {
    tasks.push({
      id: `ap-${idCounter++}`,
      title: t.title,
      why: t.why,
      howToStart: t.howToStart,
      expectedImpact: t.expectedImpact,
      effort: t.effort,
      dueInDays: Math.min(dayCounter++, 7),
      pillar: primary,
    });
  }

  // Pick tasks from secondary pillar (up to 3)
  const secondaryTemplates = PILLAR_TASKS[secondary].filter(
    (t) => !t.condition || t.condition(inputs),
  );
  for (const t of secondaryTemplates.slice(0, 3)) {
    tasks.push({
      id: `ap-${idCounter++}`,
      title: t.title,
      why: t.why,
      howToStart: t.howToStart,
      expectedImpact: t.expectedImpact,
      effort: t.effort,
      dueInDays: Math.min(dayCounter++, 7),
      pillar: secondary,
    });
  }

  // Add missing-data tasks if important fields are absent
  const missingDataTasks: ActionTask[] = [];
  if (result.missingData.includes("cac") || result.missingData.includes("ltv")) {
    missingDataTasks.push({
      id: `ap-${idCounter++}`,
      title: "Set up CAC and LTV tracking",
      why: "These are the two most important unit economics metrics — everything else depends on them.",
      howToStart: "Calculate: Total marketing spend ÷ new customers = CAC. Revenue per customer × lifetime = LTV.",
      expectedImpact: "Unlocks accurate profitability and acquisition scoring",
      effort: "S",
      dueInDays: Math.min(dayCounter++, 7),
      pillar: "profitability",
    });
  }
  if (result.missingData.includes("churnMonthlyPct")) {
    missingDataTasks.push({
      id: `ap-${idCounter++}`,
      title: "Start tracking monthly churn rate",
      why: "Without churn data, your retention score is a guess.",
      howToStart: "Count active customers at month start vs end. Formula: (lost ÷ starting) × 100.",
      expectedImpact: "Accurate retention pillar scoring",
      effort: "S",
      dueInDays: Math.min(dayCounter++, 7),
      pillar: "retention",
    });
  }

  // Only add missing-data tasks if we have room (max 10 total)
  for (const mt of missingDataTasks) {
    if (tasks.length >= 10) break;
    // Don't duplicate if similar task already exists
    if (!tasks.some((t) => t.title.toLowerCase().includes("cac") && mt.title.toLowerCase().includes("cac"))) {
      tasks.push(mt);
    }
  }

  return { tasks: tasks.slice(0, 10), primaryPillar: primary, secondaryPillar: secondary };
}
