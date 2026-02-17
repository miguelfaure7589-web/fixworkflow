/**
 * Action Playbook seed data
 */

export interface PlaybookSeed {
  slug: string;
  title: string;
  category: string;
  businessTypes: string[];
  triggerRule: Record<string, unknown>;
  baseSteps: { step: number; title: string; action: string }[];
  baseImpact: string;
  effortLevel: string;
}

export const playbookSeeds: PlaybookSeed[] = [
  {
    slug: "revenue_surge",
    title: "Revenue Surge Sprint",
    category: "revenue",
    businessTypes: ["ecommerce", "saas", "service_agency", "creator", "local_business"],
    triggerRule: { pillar: "revenue", belowScore: 70 },
    baseSteps: [
      { step: 1, title: "Audit top revenue sources", action: "List your top 5 revenue streams and rank by margin. Identify the one with the most upside." },
      { step: 2, title: "Create a 7-day promo push", action: "Pick your best offer and run a focused campaign: email blast + social posts + direct outreach." },
      { step: 3, title: "Activate dormant leads", action: "Pull contacts who engaged in the last 90 days but didn't buy. Send a personalized re-engagement offer." },
      { step: 4, title: "Add an upsell or bundle", action: "Create a bundle or upsell for your best-selling product. Test a 20-30% price increase with added value." },
      { step: 5, title: "Set a daily revenue target", action: "Break your monthly goal into a daily number. Track it visibly and adjust tactics daily." },
    ],
    baseImpact: "10-25% revenue increase within 30 days when executed consistently.",
    effortLevel: "medium",
  },
  {
    slug: "conversion_optimization",
    title: "Conversion Rate Fix",
    category: "acquisition",
    businessTypes: ["ecommerce", "creator", "local_business"],
    triggerRule: { metric: "conversionRate", below: 2.5, businessTypes: ["ecommerce", "creator", "local_business"] },
    baseSteps: [
      { step: 1, title: "Identify the biggest drop-off", action: "Check your funnel analytics: where do most visitors leave? Landing page, product page, or checkout?" },
      { step: 2, title: "Rewrite your main CTA", action: "Replace generic CTAs with benefit-driven copy. Test 'Get [outcome]' vs 'Buy now'." },
      { step: 3, title: "Add social proof above the fold", action: "Place 2-3 testimonials, review count, or trust badges within the first screen visitors see." },
      { step: 4, title: "Simplify checkout / signup", action: "Remove unnecessary form fields. Aim for 3 fields or fewer. Add guest checkout if missing." },
      { step: 5, title: "Run one A/B test", action: "Test your highest-traffic page: change the headline or hero image. Run for 7 days minimum." },
      { step: 6, title: "Add exit-intent capture", action: "Set up an exit-intent popup with a compelling offer (discount, free guide, demo) to capture abandoning visitors." },
    ],
    baseImpact: "0.5-2% conversion rate improvement, translating to 20-80% more revenue from existing traffic.",
    effortLevel: "low",
  },
  {
    slug: "reduce_churn",
    title: "Churn Reduction Program",
    category: "retention",
    businessTypes: ["saas"],
    triggerRule: { metric: "churnMonthlyPct", above: 5, businessTypes: ["saas"] },
    baseSteps: [
      { step: 1, title: "Survey recent churns", action: "Email your last 20 churned users with a 1-question survey: 'What was the #1 reason you left?' Categorize responses." },
      { step: 2, title: "Fix the top churn reason", action: "Take the most common reason and create a fix plan. Ship it within 7 days, even if it's a partial fix." },
      { step: 3, title: "Build a health score", action: "Define 3-5 usage signals that predict churn (login frequency, feature adoption, support tickets). Flag at-risk accounts." },
      { step: 4, title: "Launch a save flow", action: "When users click 'cancel', show a retention offer: pause instead of cancel, discount, or a call with support." },
      { step: 5, title: "Improve onboarding", action: "Audit your first-7-day experience. Add a checklist, welcome email sequence, and a 'quick win' users can hit in 5 minutes." },
    ],
    baseImpact: "1-3% monthly churn reduction, which compounds to 12-36% more annual retained revenue.",
    effortLevel: "high",
  },
  {
    slug: "operational_efficiency",
    title: "Ops Efficiency Overhaul",
    category: "ops",
    businessTypes: ["ecommerce", "saas", "service_agency", "creator", "local_business"],
    triggerRule: { metric: "opsHoursPerWeek", above: 40 },
    baseSteps: [
      { step: 1, title: "Time-audit your week", action: "Track every task for 3 days. Categorize into: billable, admin, repetitive, meetings, and fire-fighting." },
      { step: 2, title: "Identify your top 3 time sinks", action: "Rank the repetitive tasks by hours spent. These are your automation candidates." },
      { step: 3, title: "Automate the #1 time sink", action: "Use Zapier, Make, or a script to automate your most repetitive task. Target saving 3+ hours/week." },
      { step: 4, title: "Create SOPs for delegation", action: "Write a step-by-step SOP for your 2nd and 3rd time sinks. Make them delegate-ready." },
      { step: 5, title: "Batch and block your calendar", action: "Group similar tasks (email, calls, admin) into time blocks. Protect 2+ hours daily for deep/growth work." },
      { step: 6, title: "Set an ops budget", action: "Cap ops hours at 25/week. Anything above that gets automated, delegated, or eliminated." },
    ],
    baseImpact: "10-15 hours/week reclaimed, directly freeable for revenue-generating work.",
    effortLevel: "medium",
  },
  {
    slug: "pricing_power",
    title: "Pricing & Margin Recovery",
    category: "profitability",
    businessTypes: ["ecommerce", "saas", "service_agency", "creator", "local_business"],
    triggerRule: { metric: "grossMarginPct", below: 30 },
    baseSteps: [
      { step: 1, title: "Calculate true unit economics", action: "For your top 5 products/services, list every cost (COGS, labor, tools, shipping). Get your real per-unit margin." },
      { step: 2, title: "Identify margin killers", action: "Find the items with margins below 20%. Decide: raise price, cut costs, or drop the product." },
      { step: 3, title: "Test a price increase", action: "Raise prices 10-15% on one product. Monitor volume for 14 days. Most businesses lose <5% of volume." },
      { step: 4, title: "Renegotiate vendor costs", action: "Contact your top 3 vendors and ask for a volume discount or payment terms. Aim for 5-10% savings." },
      { step: 5, title: "Introduce a premium tier", action: "Create a higher-priced version of your best seller with added value (priority support, extras, speed)." },
    ],
    baseImpact: "5-15% gross margin improvement, directly increasing profit without new sales.",
    effortLevel: "medium",
  },
  {
    slug: "ltv_expansion",
    title: "LTV Expansion Playbook",
    category: "retention",
    businessTypes: ["ecommerce", "saas", "service_agency", "creator"],
    triggerRule: { metric: "ltvToCac", below: 3 },
    baseSteps: [
      { step: 1, title: "Map your customer journey", action: "List every touchpoint from first purchase to year 1. Identify where customers go silent." },
      { step: 2, title: "Launch a post-purchase sequence", action: "Set up 5 automated emails: thank you (day 1), tips (day 3), cross-sell (day 7), review request (day 14), reorder (day 30)." },
      { step: 3, title: "Create a loyalty program", action: "Design a simple points or tier system. Reward repeat purchases, referrals, and reviews." },
      { step: 4, title: "Add a subscription or retainer option", action: "Offer a recurring plan for your most-purchased item. Discount 10-15% vs one-time to incentivize commitment." },
      { step: 5, title: "Reduce time-to-second-purchase", action: "Identify the average gap between purchases. Send a targeted nudge at 70% of that interval." },
    ],
    baseImpact: "Improving LTV:CAC from <3x to 4x+ makes every marketing dollar 30-50% more effective.",
    effortLevel: "medium",
  },
];
