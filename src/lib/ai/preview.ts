/**
 * AI Explain — Deterministic Preview Generator
 *
 * No external API calls. Uses businessType, pillar, and scoring context
 * to produce tailored preview explanations. Copy should be short, punchy,
 * and connect the item back to the user's broader business situation.
 */
import type { PreviewExplanation } from "./types";
import type { BusinessTypeName, PillarName, RevenueHealthScoreResult } from "@/lib/revenue-health/types";

// ── Why copy: short, connects pillar to the rest of the business ──

const WHY: Record<string, Record<string, string>> = {
  revenue: {
    ecommerce: "Revenue is the foundation—more top line gives you room to invest in fulfillment and acquisition.",
    saas: "MRR is the one number that moves everything else—valuation, hiring capacity, runway.",
    service_agency: "Revenue is the foundation—more top line gives you room to invest in ops and acquisition.",
    creator: "Revenue turns your audience into a business—without it, reach is just a vanity metric.",
    local_business: "Revenue is the foundation—more top line gives you room to invest in staff and marketing.",
  },
  profitability: {
    ecommerce: "Margin is what you actually keep—without it, more revenue just means more work.",
    saas: "Unit economics decide whether growth helps or hurts—fix LTV:CAC before you scale.",
    service_agency: "Every point of margin you recover is pure profit with no extra sales effort.",
    creator: "Low overhead is your superpower—protect it and your revenue drops straight to the bottom line.",
    local_business: "Margins determine whether you can afford to grow or just survive.",
  },
  retention: {
    ecommerce: "A repeat buyer costs you nothing to acquire—retention is your highest-ROI channel.",
    saas: "Every 1% of churn you eliminate compounds across your entire MRR base every month.",
    service_agency: "Keeping a client is 5-7x cheaper than winning one—retention stabilizes your pipeline.",
    creator: "Loyal fans buy every launch—build retention and your revenue becomes predictable.",
    local_business: "Regulars are your most profitable segment and they bring friends.",
  },
  acquisition: {
    ecommerce: "More qualified traffic at a lower CAC means more orders without burning ad budget.",
    saas: "Efficient acquisition fuels trial-to-paid conversion—without it, growth stalls.",
    service_agency: "A steady inbound pipeline means you stop chasing clients and start choosing them.",
    creator: "Audience growth is the prerequisite for every monetization strategy you'll ever run.",
    local_business: "Local visibility—maps, reviews, referrals—drives walk-ins with near-zero spend.",
  },
  ops: {
    ecommerce: "Every hour you spend on fulfillment is an hour not spent on growth.",
    saas: "Ops overhead pulls engineering time away from the product that drives revenue.",
    service_agency: "Every ops hour you automate is an hour you can bill to a client—direct revenue recovery.",
    creator: "Streamlining production lets you publish more without burning out.",
    local_business: "Smooth operations mean faster service, fewer errors, and happier staff.",
  },
};

// ── First step: concrete, with numbers and a timeframe ──

const FIRST_STEP: Record<string, Record<string, string>> = {
  revenue: {
    ecommerce: "Pick your best-selling product, create a 7-day bundle offer, and push it to your email list today.",
    saas: "Identify your top-converting signup source and double down on it for the next 14 days.",
    service_agency: "Pick one offer and run a 7-day push: 20 outreaches/day + follow-up sequence.",
    creator: "Take your best-performing content, turn it into a paid asset, and launch it within 7 days.",
    local_business: "Run a 7-day \"bring a friend\" promo for your most popular service—track redemptions daily.",
  },
  profitability: {
    ecommerce: "Pull your top 10 SKUs, rank by margin, and cut or reprice the bottom 3 this week.",
    saas: "Calculate your LTV:CAC today—if it's below 3x, pause paid acquisition and focus on activation.",
    service_agency: "Audit your last 5 projects: which had the thinnest margin? Raise that rate 15% on the next quote.",
    creator: "List every recurring expense, cancel anything unused in 30 days, and reinvest the savings into content.",
    local_business: "Review your 3 biggest vendor costs and negotiate a 10% reduction on the largest one this week.",
  },
  retention: {
    ecommerce: "Set up a 3-email post-purchase sequence today: thank you (day 1), tips (day 5), reorder nudge (day 14).",
    saas: "Survey your 10 most recent churned users with one question: \"What would have kept you?\" Act on the top answer.",
    service_agency: "Schedule a 15-min check-in call with your 5 highest-value clients this week—ask what's next for them.",
    creator: "DM 10 loyal followers and ask what they'd pay for—use answers to shape your next offer.",
    local_business: "Launch a simple punch-card or loyalty reward this week and track repeat visits for 30 days.",
  },
  acquisition: {
    ecommerce: "A/B test your product page headline this week—test benefit-led vs. feature-led and measure add-to-cart rate.",
    saas: "Rewrite your signup page CTA to focus on the #1 outcome users want, then measure conversion for 7 days.",
    service_agency: "Publish one case study with real numbers this week and share it in 3 communities where your buyers hang out.",
    creator: "Publish 2 SEO-optimized posts targeting buyer-intent keywords this week and track inbound leads.",
    local_business: "Claim and optimize your Google Business Profile today—add 5 new photos and respond to every review.",
  },
  ops: {
    ecommerce: "Identify your most manual fulfillment step and automate it with Zapier or ShipStation this week.",
    saas: "List your 5 most repetitive weekly tasks, pick the worst one, and automate it by Friday.",
    service_agency: "Build one SOP for your most common deliverable—template it so you can delegate it next week.",
    creator: "Batch your next 2 weeks of content in one sitting and schedule it—reclaim 5+ hrs/week.",
    local_business: "Automate appointment reminders (SMS or email) to cut no-shows by 30% starting this week.",
  },
};

const DEFAULT_BT: BusinessTypeName = "service_agency";

export function generatePreview(
  itemType: "focus" | "tool",
  pillar: string,
  title: string,
  description: string,
  businessType?: BusinessTypeName | null,
  scoreResult?: RevenueHealthScoreResult | null,
): PreviewExplanation {
  const bt = businessType ?? DEFAULT_BT;
  const pk = pillar in WHY ? pillar : "ops";

  // Why
  const why = WHY[pk]?.[bt] ?? WHY[pk]?.[DEFAULT_BT] ?? WHY["ops"][DEFAULT_BT];

  // First step
  let firstStep: string;
  if (itemType === "tool") {
    firstStep = `Sign up for ${title}'s free tier (or trial), connect it to your main workflow, and run it side-by-side for 7 days before committing.`;
  } else {
    firstStep = FIRST_STEP[pk]?.[bt] ?? FIRST_STEP[pk]?.[DEFAULT_BT] ?? FIRST_STEP["ops"][DEFAULT_BT];
  }

  // If the pillar is critical, prepend urgency
  if (scoreResult) {
    const ps = scoreResult.pillars[pk as PillarName]?.score;
    if (ps !== undefined && ps < 40) {
      firstStep = `Your ${pk} score is ${ps}/100—this is urgent. ${firstStep}`;
    }
  }

  // Upgrade hint: short and punchy
  const upgradeHint = "Upgrade to get a step-by-step playbook tailored to your numbers.";

  return { why, firstStep, upgradeHint };
}
