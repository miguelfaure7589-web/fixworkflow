/**
 * Sprint B — Tool Recommendations Engine
 *
 * Maps weak pillars to tool categories, queries the Tool table,
 * and returns grouped recommendations with "why it fits" reasons.
 */

import type { RevenueHealthScoreResult, PillarName, RevenueInputs } from "./types";

export interface RecommendedTool {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  affiliateUrl: string;
  hasFreeTier: boolean;
  pricing: string | null;
  rating: number | null;
  whyItFits: string;
  promoLabel: string | null;
  pickLabel: "Best for you" | "Top partner";
  pillar: PillarName;
}

export interface ToolsByPillar {
  pillar: PillarName;
  pillarLabel: string;
  pillarScore: number;
  tools: RecommendedTool[];
}

// ── Pillar → Tool category mapping ──

const PILLAR_CATEGORIES: Record<PillarName, string[]> = {
  acquisition: ["crm", "email_marketing", "scheduling"],
  retention: ["crm", "email_marketing", "communication"],
  profitability: ["invoicing", "bookkeeping", "business_banking", "payment_processing"],
  ops: ["project_management", "automation", "time_tracking", "communication"],
  revenue: ["crm", "email_marketing", "payment_processing", "scheduling"],
};

const PILLAR_LABEL: Record<PillarName, string> = {
  revenue: "Revenue",
  profitability: "Profitability",
  retention: "Retention",
  acquisition: "Acquisition",
  ops: "Operations",
};

// ── "Why it fits" reason generator ──

function generateWhyItFits(
  tool: { category: string; name: string; hasFreeTier: boolean },
  pillar: PillarName,
  inputs: RevenueInputs,
): string {
  const reasons: Record<string, Record<string, string>> = {
    acquisition: {
      crm: "Track and nurture leads systematically instead of losing them in your inbox.",
      email_marketing: "Build an audience you own — email converts 3-5x better than social.",
      scheduling: "Remove friction from booking — every missed call is a lost opportunity.",
    },
    retention: {
      crm: "Stay on top of customer relationships and catch churn signals early.",
      email_marketing: "Automated sequences keep customers engaged between purchases.",
      communication: "Faster, better communication reduces support churn.",
    },
    profitability: {
      invoicing: "Get paid faster — every day of delayed payment hurts cash flow.",
      bookkeeping: "Know your real margins so you can price confidently.",
      business_banking: "Separate business finances and see true profitability.",
      payment_processing: "Lower processing fees and faster payouts improve margins.",
    },
    ops: {
      project_management: "Stop losing tasks and deadlines — reclaim hours every week.",
      automation: "Eliminate repetitive work and focus on what actually grows revenue.",
      time_tracking: "See where your hours actually go — most people are surprised.",
      communication: "Reduce meetings and async better to save 5+ hours/week.",
    },
    revenue: {
      crm: "A pipeline you can see is a pipeline you can grow.",
      email_marketing: "Your email list is your most reliable revenue channel.",
      payment_processing: "Accept more payment methods to capture more revenue.",
      scheduling: "Make it effortless for prospects to book and buy.",
    },
  };

  return (
    reasons[pillar]?.[tool.category] ??
    `${tool.name} helps improve your ${PILLAR_LABEL[pillar].toLowerCase()} performance.`
  );
}

// ── Promo label logic ──

function getPromoLabel(
  tool: { hasFreeTier: boolean; rating: number | null; pricing: string | null },
): string | null {
  if (tool.hasFreeTier) return "Free tier available";
  if (tool.rating && tool.rating >= 4.7) return "Top rated";
  if (tool.pricing && tool.pricing.includes("/mo") && parseFloat(tool.pricing) < 15) {
    return "Budget friendly";
  }
  return null;
}

// ── Main recommendation function ──
// This returns the query parameters; the API route does the actual DB query.

export function getRecommendationParams(
  result: RevenueHealthScoreResult,
  inputs: RevenueInputs,
): { pillarsToQuery: { pillar: PillarName; categories: string[]; score: number }[] } {
  // Sort pillars by score ascending (weakest first), take top 3-4
  const sorted = (
    Object.entries(result.pillars) as [PillarName, { score: number }][]
  ).sort((a, b) => a[1].score - b[1].score);

  const pillarsToQuery = sorted.slice(0, 3).map(([pillar, { score }]) => ({
    pillar,
    categories: PILLAR_CATEGORIES[pillar],
    score,
  }));

  return { pillarsToQuery };
}

function parseCommission(rate: string | null): number {
  if (!rate) return 0;
  const num = parseFloat(rate.replace(/[^0-9.]/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

export function buildToolRecommendations(
  tools: { id: string; slug: string; name: string; description: string; category: string; affiliateUrl: string; hasFreeTier: boolean; pricing: string | null; rating: number | null; commissionRate?: string | null }[],
  pillarsToQuery: { pillar: PillarName; categories: string[]; score: number }[],
  inputs: RevenueInputs,
): ToolsByPillar[] {
  const result: ToolsByPillar[] = [];
  const usedIds = new Set<string>();

  for (const { pillar, categories, score } of pillarsToQuery) {
    const matched = tools.filter((t) => categories.includes(t.category) && !usedIds.has(t.id));

    if (matched.length === 0) continue;

    // "Best for you": prefer free tier + highest rating
    const bestForUser = [...matched].sort((a, b) => {
      if (a.hasFreeTier !== b.hasFreeTier) return a.hasFreeTier ? -1 : 1;
      return (b.rating ?? 0) - (a.rating ?? 0);
    })[0];

    // "Top partner": highest commission rate, excluding the user pick
    const bestReferral = [...matched]
      .filter((t) => t.id !== bestForUser.id)
      .sort((a, b) => parseCommission(b.commissionRate ?? null) - parseCommission(a.commissionRate ?? null))[0];

    const picks: RecommendedTool[] = [];

    if (bestForUser) {
      usedIds.add(bestForUser.id);
      picks.push({
        id: bestForUser.id,
        slug: bestForUser.slug,
        name: bestForUser.name,
        description: bestForUser.description,
        category: bestForUser.category,
        affiliateUrl: bestForUser.affiliateUrl,
        hasFreeTier: bestForUser.hasFreeTier,
        pricing: bestForUser.pricing,
        rating: bestForUser.rating,
        whyItFits: generateWhyItFits(bestForUser, pillar, inputs),
        promoLabel: getPromoLabel(bestForUser),
        pickLabel: "Best for you",
        pillar,
      });
    }

    if (bestReferral) {
      usedIds.add(bestReferral.id);
      picks.push({
        id: bestReferral.id,
        slug: bestReferral.slug,
        name: bestReferral.name,
        description: bestReferral.description,
        category: bestReferral.category,
        affiliateUrl: bestReferral.affiliateUrl,
        hasFreeTier: bestReferral.hasFreeTier,
        pricing: bestReferral.pricing,
        rating: bestReferral.rating,
        whyItFits: generateWhyItFits(bestReferral, pillar, inputs),
        promoLabel: getPromoLabel(bestReferral),
        pickLabel: "Top partner",
        pillar,
      });
    }

    if (picks.length > 0) {
      result.push({
        pillar,
        pillarLabel: PILLAR_LABEL[pillar],
        pillarScore: score,
        tools: picks,
      });
    }
  }

  return result;
}
