import type { DiagnosticInput } from "./recommendation-engine";

export const BOTTLENECK_CATEGORIES = {
  lead_generation: "Lead Generation",
  conversion: "Conversion",
  retention: "Retention",
  pricing: "Pricing",
  offer_positioning: "Offer & Positioning",
  operations: "Operations",
  time_management: "Time Management",
  cashflow: "Cash Flow",
  marketing_channel_fit: "Marketing Channel Fit",
  sales_process: "Sales Process",
  tech_stack: "Tech Stack",
} as const;

export type BottleneckCategory = keyof typeof BOTTLENECK_CATEGORIES;

export interface BottleneckScore {
  category: BottleneckCategory;
  label: string;
  score: number;
}

// Maps friction areas to bottleneck category weights
const FRICTION_WEIGHTS: Record<string, Partial<Record<BottleneckCategory, number>>> = {
  sales_leads: { lead_generation: 35, sales_process: 30, conversion: 15 },
  client_work: { conversion: 25, retention: 30, sales_process: 15, operations: 10 },
  communication: { operations: 20, retention: 15, time_management: 15 },
  automation: { operations: 30, tech_stack: 25, time_management: 15 },
  task_management: { operations: 25, time_management: 30 },
  too_many_tools: { tech_stack: 40, operations: 15 },
  time_tracking: { time_management: 30, pricing: 15, operations: 10 },
  invoicing: { cashflow: 30, operations: 15, pricing: 10 },
  focus: { time_management: 35, operations: 10 },
  file_management: { operations: 25, tech_stack: 15 },
  remote_setup: { operations: 15, tech_stack: 10 },
  morale: { retention: 20, operations: 15 },
  finances: { cashflow: 40, pricing: 20 },
  phone_internet: { tech_stack: 20, operations: 10 },
  payments: { cashflow: 25, tech_stack: 15, operations: 10 },
  marketing: { marketing_channel_fit: 35, lead_generation: 25 },
  hiring_delegation: { operations: 25, time_management: 20 },
  training_onboarding: { operations: 25, retention: 15 },
  security_privacy: { tech_stack: 20, operations: 10 },
  scaling: { operations: 20, lead_generation: 15, conversion: 10, offer_positioning: 10 },
};

// Detailed answer refinements
const DETAIL_MODIFIERS: Record<string, Record<string, Partial<Record<BottleneckCategory, number>>>> = {
  sales_leads_detail: {
    not_enough_leads: { lead_generation: 20, marketing_channel_fit: 15 },
    no_pipeline: { sales_process: 20, conversion: 10 },
    bad_follow_up: { sales_process: 15, conversion: 15 },
    no_crm: { tech_stack: 15, sales_process: 10 },
  },
  scaling_detail: {
    bottleneck_me: { operations: 15, time_management: 10 },
    no_recurring_revenue: { pricing: 15, offer_positioning: 15, cashflow: 10 },
    cant_take_more: { operations: 15, offer_positioning: 10 },
    systems_breaking: { operations: 20, tech_stack: 10 },
  },
  client_detail: {
    onboarding: { operations: 15, retention: 10 },
    feedback: { retention: 15, conversion: 10 },
    tracking: { operations: 15, sales_process: 10 },
    communication: { retention: 10, operations: 10 },
  },
  automation_detail: {
    data_entry: { operations: 15, tech_stack: 10 },
    follow_ups: { sales_process: 10, conversion: 10 },
    reporting: { operations: 10, tech_stack: 5 },
    onboarding_steps: { operations: 15 },
  },
  communication_detail: {
    too_many_channels: { tech_stack: 10, operations: 10 },
    sync_overload: { time_management: 15 },
    messages_lost: { operations: 10 },
    no_async: { time_management: 10, operations: 10 },
  },
};

// Array-type detail modifiers (finance_detail, morale_detail, etc.)
const ARRAY_DETAIL_MODIFIERS: Record<string, Record<string, Partial<Record<BottleneckCategory, number>>>> = {
  finance_detail: {
    cash_flow: { cashflow: 15 },
    no_business_banking: { cashflow: 10 },
    need_credit: { cashflow: 15 },
    bookkeeping_mess: { operations: 10, cashflow: 5 },
    expense_tracking: { operations: 8, cashflow: 5 },
    tax_prep: { operations: 5, cashflow: 5 },
  },
  morale_detail: {
    burnout: { time_management: 10, retention: 5 },
    unclear_roles: { operations: 10 },
    no_recognition: { retention: 10 },
    no_growth: { retention: 10 },
    isolation: { retention: 8 },
    micromanagement: { operations: 8 },
  },
  payments_detail: {
    high_fees: { cashflow: 10, pricing: 5 },
    slow_payouts: { cashflow: 10 },
    no_online_payments: { tech_stack: 10 },
    recurring_billing: { cashflow: 8, tech_stack: 5 },
  },
  phone_internet_detail: {
    no_business_phone: { tech_stack: 8 },
    bad_internet: { tech_stack: 12 },
    need_call_system: { sales_process: 8, tech_stack: 8 },
  },
};

// Role baseline modifiers
const ROLE_MODIFIERS: Record<string, Partial<Record<BottleneckCategory, number>>> = {
  freelancer: { lead_generation: 5, pricing: 5, time_management: 5 },
  solopreneur: { lead_generation: 5, offer_positioning: 5, marketing_channel_fit: 5 },
  team_lead: { operations: 5, retention: 5, time_management: 3 },
  remote_employee: { time_management: 5, operations: 3 },
  agency_owner: { operations: 5, lead_generation: 3, cashflow: 5 },
};

function addWeights(
  scores: Record<BottleneckCategory, number>,
  weights: Partial<Record<BottleneckCategory, number>>
) {
  for (const [cat, weight] of Object.entries(weights)) {
    scores[cat as BottleneckCategory] += weight;
  }
}

export function scoreBottlenecks(input: DiagnosticInput): BottleneckScore[] {
  const scores: Record<BottleneckCategory, number> = {
    lead_generation: 0,
    conversion: 0,
    retention: 0,
    pricing: 0,
    offer_positioning: 0,
    operations: 0,
    time_management: 0,
    cashflow: 0,
    marketing_channel_fit: 0,
    sales_process: 0,
    tech_stack: 0,
  };

  // 1. Friction area weights
  for (const friction of input.frictionAreas) {
    const weights = FRICTION_WEIGHTS[friction];
    if (weights) addWeights(scores, weights);
  }

  // 2. Single-value detail modifiers
  for (const [detailKey, detailMap] of Object.entries(DETAIL_MODIFIERS)) {
    const answer = input.detailedAnswers[detailKey];
    if (typeof answer === "string" && detailMap[answer]) {
      addWeights(scores, detailMap[answer]);
    }
  }

  // 3. Array-value detail modifiers
  for (const [detailKey, detailMap] of Object.entries(ARRAY_DETAIL_MODIFIERS)) {
    const answer = input.detailedAnswers[detailKey];
    if (Array.isArray(answer)) {
      for (const item of answer) {
        if (detailMap[item]) addWeights(scores, detailMap[item]);
      }
    }
  }

  // 4. Role modifiers
  const roleMods = ROLE_MODIFIERS[input.role];
  if (roleMods) addWeights(scores, roleMods);

  // 5. Productivity modifier
  if (input.productivityScore <= 2) {
    scores.time_management += 10;
    scores.operations += 8;
  } else if (input.productivityScore <= 3) {
    scores.time_management += 5;
    scores.operations += 3;
  }

  // 6. Tool count modifier
  const toolCount = input.currentTools.filter((t) => t !== "none").length;
  if (toolCount > 8) scores.tech_stack += 10;
  else if (toolCount === 0) scores.tech_stack += 8;

  // 7. Morale modifier
  const moraleScore = input.moraleScore || 3;
  if (moraleScore <= 2) {
    scores.retention += 8;
    scores.time_management += 5;
  }

  // 8. No automation tools boost
  const hasAutomation = input.currentTools.some((t) => ["zapier", "make"].includes(t));
  if (!hasAutomation && input.frictionAreas.includes("automation")) {
    scores.tech_stack += 8;
    scores.operations += 5;
  }

  // Convert to sorted array
  return Object.entries(scores)
    .map(([category, score]) => ({
      category: category as BottleneckCategory,
      label: BOTTLENECK_CATEGORIES[category as BottleneckCategory],
      score,
    }))
    .sort((a, b) => b.score - a.score);
}

export function getTopCategories(
  scores: BottleneckScore[],
  isPremium: boolean
): BottleneckScore[] {
  const limit = isPremium ? 5 : 3;
  return scores.filter((s) => s.score > 0).slice(0, limit);
}
