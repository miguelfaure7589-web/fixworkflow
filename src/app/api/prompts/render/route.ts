import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";
import { generateRationale } from "@/lib/prompts/rationale";

const BT_LABELS: Record<string, string> = {
  ecommerce: "e-commerce",
  saas: "SaaS",
  service_agency: "service/agency",
  creator: "creator/content",
  local_business: "local business",
};

function safe(v: number | null | undefined, fallback = "unknown"): string {
  return v !== null && v !== undefined ? String(v) : fallback;
}

function fillTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "unknown");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const isPremium = !!(session.user as Record<string, unknown>).isPremium;

  let body: {
    slug?: string;
    selectedItem?: { title: string; category: string; description?: string };
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.slug) {
    return Response.json({ error: "slug is required" }, { status: 400 });
  }

  // Load template
  const template = await prisma.promptTemplate.findUnique({
    where: { slug: body.slug },
  });

  if (!template) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }

  // Enforce visibility
  if (template.visibility === "PREMIUM" && !isPremium) {
    return Response.json(
      { error: "Upgrade Required", message: "This prompt requires a Premium subscription." },
      { status: 402 },
    );
  }

  // Load user's profile
  const profile = await prisma.revenueProfile.findUnique({
    where: { userId },
  });

  // Compute score (or use cached snapshot)
  let scoreResult;
  const inputs: RevenueInputs = profile
    ? {
        revenueMonthly: profile.revenueMonthly ?? undefined,
        grossMarginPct: profile.grossMarginPct ?? undefined,
        netProfitMonthly: profile.netProfitMonthly ?? undefined,
        runwayMonths: profile.runwayMonths ?? undefined,
        churnMonthlyPct: profile.churnMonthlyPct ?? undefined,
        conversionRatePct: profile.conversionRatePct ?? undefined,
        trafficMonthly: profile.trafficMonthly ?? undefined,
        avgOrderValue: profile.avgOrderValue ?? undefined,
        cac: profile.cac ?? undefined,
        ltv: profile.ltv ?? undefined,
        opsHoursPerWeek: profile.opsHoursPerWeek ?? undefined,
        fulfillmentDays: profile.fulfillmentDays ?? undefined,
        supportTicketsPerWeek: profile.supportTicketsPerWeek ?? undefined,
      }
    : {};

  const bt = (profile?.businessType as BusinessTypeName | null) ?? undefined;
  scoreResult = computeRevenueHealthScore(inputs, bt);

  // Build pillar scores object
  const pillarScores: Record<string, number> = {};
  for (const [k, v] of Object.entries(scoreResult.pillars)) {
    pillarScores[k] = v.score;
  }

  // Fill template
  const businessTypeLabel = BT_LABELS[profile?.businessType ?? ""] ?? "service/agency";
  const vars: Record<string, string> = {
    businessType: businessTypeLabel,
    monthlyRevenue: safe(profile?.revenueMonthly, "$0"),
    grossMargin: safe(profile?.grossMarginPct, "unknown"),
    netProfitMonthly: safe(profile?.netProfitMonthly, "unknown"),
    runwayMonths: safe(profile?.runwayMonths, "unknown"),
    traffic: safe(profile?.trafficMonthly, "unknown"),
    conversionRate: safe(profile?.conversionRatePct, "unknown"),
    aov: safe(profile?.avgOrderValue, "unknown"),
    cac: safe(profile?.cac, "unknown"),
    ltv: safe(profile?.ltv, "unknown"),
    churn: safe(profile?.churnMonthlyPct, "unknown"),
    opsHoursPerWeek: safe(profile?.opsHoursPerWeek, "unknown"),
    supportTicketsPerWeek: safe(profile?.supportTicketsPerWeek, "unknown"),
    fulfillmentDays: safe(profile?.fulfillmentDays, "unknown"),
    healthScore: String(scoreResult.score),
    primaryRisk: scoreResult.primaryRisk,
    fastestLever: scoreResult.fastestLever,
    pillarScoresJson: JSON.stringify(pillarScores),
    selectedItemTitle: body.selectedItem?.title ?? "General",
    selectedItemCategory: body.selectedItem?.category ?? "general",
    selectedItemDescription: body.selectedItem?.description
      ? `Additional context: ${body.selectedItem.description}`
      : "",
  };

  const prompt = fillTemplate(template.template, vars);

  // Generate deterministic rationale
  const rationale = generateRationale(template.category, {
    businessType: profile?.businessType ?? null,
    healthScore: scoreResult.score,
    pillarScores,
    primaryRisk: scoreResult.primaryRisk,
    fastestLever: scoreResult.fastestLever,
    revenueMonthly: profile?.revenueMonthly ?? undefined,
    grossMarginPct: profile?.grossMarginPct ?? undefined,
    churnMonthlyPct: profile?.churnMonthlyPct ?? undefined,
    conversionRatePct: profile?.conversionRatePct ?? undefined,
    opsHoursPerWeek: profile?.opsHoursPerWeek ?? undefined,
    supportTicketsPerWeek: profile?.supportTicketsPerWeek ?? undefined,
    cac: profile?.cac ?? undefined,
    ltv: profile?.ltv ?? undefined,
    avgOrderValue: profile?.avgOrderValue ?? undefined,
    trafficMonthly: profile?.trafficMonthly ?? undefined,
  });

  return Response.json({
    prompt,
    rationale,
    templateMeta: {
      slug: template.slug,
      title: template.title,
      category: template.category,
      visibility: template.visibility,
    },
  });
}
