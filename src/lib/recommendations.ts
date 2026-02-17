import { affiliateProducts, type AffiliateProduct } from '@/data/affiliates';

// ── Types ──

export interface UserProfile {
  businessType: string;
  revenueMonthly: number;
  grossMarginPct?: number;
  conversionRatePct?: number;
  trafficMonthly?: number;
  frictionAreas?: string[];
  pillarScores: Record<string, number>; // { revenue: 60, profitability: 78, ... }
}

export interface ScoredProduct extends AffiliateProduct {
  matchScore: number;
  matchLabel: string;
  matchColor: string;
  filledReasoning: string;
  filledPotential?: string;
}

// ── Helpers ──

const PILLAR_MAP: Record<string, string> = {
  'Revenue': 'revenue',
  'Profitability': 'profitability',
  'Retention': 'retention',
  'Acquisition': 'acquisition',
  'Operations': 'ops',
};

const PILLAR_LABEL: Record<string, string> = {
  revenue: 'Revenue',
  profitability: 'Profitability',
  retention: 'Retention',
  acquisition: 'Acquisition',
  ops: 'Operations',
};

function getRevenueStage(monthly: number): string {
  if (monthly <= 0) return 'pre_revenue';
  if (monthly < 1000) return '0_1k';
  if (monthly < 5000) return '1k_5k';
  if (monthly < 15000) return '5k_15k';
  if (monthly < 50000) return '15k_50k';
  return '50k_plus';
}

function formatRevenue(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `$${n}`;
}

function formatBusinessType(bt: string): string {
  const map: Record<string, string> = {
    ecommerce: 'e-commerce', saas: 'SaaS', service_agency: 'service/agency',
    creator: 'creator', local_business: 'local business',
  };
  return map[bt] || bt;
}

// ── Scoring ──

export function scoreProduct(product: AffiliateProduct, profile: UserProfile): number {
  let score = 0;

  // Pillar match (40 points) — product targets a weak pillar
  const pillarKeys = product.targetPillars.map(p => PILLAR_MAP[p] || p.toLowerCase());
  let bestPillarScore = 100;
  for (const key of pillarKeys) {
    const ps = profile.pillarScores[key];
    if (ps !== undefined && ps < bestPillarScore) bestPillarScore = ps;
  }
  if (bestPillarScore < 70) {
    score += bestPillarScore < 50 ? 40 : 20 + ((70 - bestPillarScore) / 20) * 20;
  }

  // Business type match (20 points)
  const allBiz = product.targetBusinessTypes.length >= 5;
  if (product.targetBusinessTypes.includes(profile.businessType)) {
    score += allBiz ? 15 : 20;
  } else if (allBiz) {
    score += 15;
  }

  // Revenue stage match (20 points)
  const stage = getRevenueStage(profile.revenueMonthly);
  const allRev = product.targetRevenueStages.length >= 6;
  if (product.targetRevenueStages.includes(stage)) {
    score += allRev ? 15 : 20;
  } else if (allRev) {
    score += 15;
  }

  // Friction area match (20 points)
  if (profile.frictionAreas?.length && product.targetFrictionAreas?.length) {
    const overlap = profile.frictionAreas.filter(f => product.targetFrictionAreas!.includes(f)).length;
    score += Math.min(overlap * 10, 20);
  }

  return Math.min(score, 100);
}

// ── Template Filling ──

export function fillReasoningTemplate(template: string, profile: UserProfile, product: AffiliateProduct): string {
  const primaryPillar = product.targetPillars[0];
  const pillarKey = PILLAR_MAP[primaryPillar] || primaryPillar.toLowerCase();
  const pillarScore = profile.pillarScores[pillarKey] ?? 50;
  const gm = profile.grossMarginPct ?? 0;

  return template
    .replace(/\{pillarScore\}/g, String(pillarScore))
    .replace(/\{revenue\}/g, formatRevenue(profile.revenueMonthly))
    .replace(/\{conversionRate\}/g, String(profile.conversionRatePct ?? 0))
    .replace(/\{grossMargin\}/g, String(gm))
    .replace(/\{marginAssessment\}/g, gm > 50 ? 'healthy' : gm < 30 ? 'concerning' : 'moderate')
    .replace(/\{businessType\}/g, formatBusinessType(profile.businessType))
    .replace(/\{name\}/g, product.name)
    .replace(/\{targetPillar\}/g, primaryPillar);
}

// ── Match Labels ──

export function getMatchLabel(score: number): { label: string; color: string } | null {
  if (score >= 90) return { label: 'Perfect match', color: '#10b981' };
  if (score >= 70) return { label: 'Strong match', color: '#4361ee' };
  if (score >= 50) return { label: 'Good match', color: '#f59e0b' };
  return null;
}

// ── Enrichment ──

function enrichProduct(product: AffiliateProduct, profile: UserProfile): ScoredProduct {
  const matchScore = scoreProduct(product, profile);
  const ml = getMatchLabel(matchScore);
  return {
    ...product,
    matchScore,
    matchLabel: ml?.label ?? '',
    matchColor: ml?.color ?? '',
    filledReasoning: fillReasoningTemplate(product.reasoningTemplate, profile, product),
    filledPotential: product.potentialTemplate
      ? fillReasoningTemplate(product.potentialTemplate, profile, product)
      : undefined,
  };
}

// ── Public API ──

export function getToolRecommendations(profile: UserProfile, limit = 5): ScoredProduct[] {
  return affiliateProducts
    .filter(p => p.type === 'tool' && p.isActive)
    .map(p => enrichProduct(p, profile))
    .filter(p => p.matchScore >= 50)
    .sort((a, b) => b.matchScore - a.matchScore || b.sortPriority - a.sortPriority)
    .slice(0, limit);
}

export function getPlaybookStepRecommendation(
  playbookCategory: string,
  stepIndex: number,
  profile: UserProfile,
): ScoredProduct | null {
  // Map playbook category to pillar label
  const pillarLabel = PILLAR_LABEL[playbookCategory] || playbookCategory;

  const candidates = affiliateProducts
    .filter(p =>
      p.type === 'tool' &&
      p.isActive &&
      p.placements.includes('playbook_inline') &&
      p.targetPillars.includes(pillarLabel),
    )
    .map(p => enrichProduct(p, profile))
    .filter(p => p.matchScore >= 50)
    .sort((a, b) => b.matchScore - a.matchScore || b.sortPriority - a.sortPriority);

  // Return different products for different step indices to avoid repetition
  return candidates[stepIndex - 1] ?? candidates[0] ?? null;
}

export function getResourceRecommendations(
  profile: UserProfile,
  type: 'book' | 'course' | 'template',
  limit = 3,
): ScoredProduct[] {
  return affiliateProducts
    .filter(p => p.type === type && p.isActive && p.placements.includes('resource_shelf'))
    .map(p => enrichProduct(p, profile))
    .sort((a, b) => b.matchScore - a.matchScore || b.sortPriority - a.sortPriority)
    .slice(0, limit);
}
