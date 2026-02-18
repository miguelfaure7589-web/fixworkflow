import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { computeRevenueHealthScore } from "@/lib/revenue-health";
import type { RevenueInputs, BusinessTypeName } from "@/lib/revenue-health";

const VALID_BUSINESS_TYPES = new Set<string>([
  "ecommerce", "saas", "service_agency", "creator", "local_business",
]);

interface ProfilePayload {
  revenueMonthly?: number;
  grossMarginPct?: number;
  netProfitMonthly?: number;
  runwayMonths?: number;
  churnMonthlyPct?: number;
  conversionRatePct?: number;
  trafficMonthly?: number;
  avgOrderValue?: number;
  cac?: number;
  ltv?: number;
  opsHoursPerWeek?: number;
  fulfillmentDays?: number;
  supportTicketsPerWeek?: number;
}

const NUMERIC_FIELDS: (keyof ProfilePayload)[] = [
  "revenueMonthly",
  "grossMarginPct",
  "netProfitMonthly",
  "runwayMonths",
  "churnMonthlyPct",
  "conversionRatePct",
  "trafficMonthly",
  "avgOrderValue",
  "cac",
  "ltv",
  "opsHoursPerWeek",
  "fulfillmentDays",
  "supportTicketsPerWeek",
];

function validateNumeric(
  body: Record<string, unknown>,
): { data: ProfilePayload; errors: string[] } {
  const data: ProfilePayload = {};
  const errors: string[] = [];

  for (const key of NUMERIC_FIELDS) {
    const val = body[key];
    if (val === undefined || val === null || val === "") continue;
    const num = Number(val);
    if (Number.isNaN(num)) {
      errors.push(`${key} must be a number`);
      continue;
    }
    if (key === "grossMarginPct" || key === "churnMonthlyPct" || key === "conversionRatePct") {
      if (num < 0 || num > 100) {
        errors.push(`${key} must be between 0 and 100`);
        continue;
      }
    }
    if (key !== "netProfitMonthly" && num < 0) {
      errors.push(`${key} must be non-negative`);
      continue;
    }
    data[key] = num;
  }

  return { data, errors };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(session.user as Record<string, unknown>).isPremium) {
    return Response.json({ error: "Premium required" }, { status: 402 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data, errors } = validateNumeric(body);

  if (errors.length > 0) {
    return Response.json({ ok: false, errors }, { status: 400 });
  }

  // Validate businessType
  const rawBt = body.businessType as string | undefined;
  const businessType = rawBt && VALID_BUSINESS_TYPES.has(rawBt)
    ? (rawBt as BusinessTypeName)
    : undefined;

  // Save profile
  const profile = await prisma.revenueProfile.upsert({
    where: { userId },
    create: { userId, businessType: businessType ?? null, ...data },
    update: { businessType: businessType ?? undefined, ...data },
  });

  // Compute score from the saved profile
  const inputs: RevenueInputs = {
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
  };

  const bt = (profile.businessType as BusinessTypeName | null) ?? undefined;
  const result = computeRevenueHealthScore(inputs, bt);

  // Save snapshot
  const snapshot = await prisma.revenueScoreSnapshot.create({
    data: {
      userId,
      score: result.score,
      pillarRevenue: result.pillars.revenue.score,
      pillarProfitability: result.pillars.profitability.score,
      pillarRetention: result.pillars.retention.score,
      pillarAcquisition: result.pillars.acquisition.score,
      pillarOps: result.pillars.ops.score,
      pillarsJson: JSON.stringify(result.pillars),
      primaryRisk: result.primaryRisk,
      fastestLever: result.fastestLever,
      nextStepsJson: JSON.stringify(result.recommendedNextSteps),
      missingDataJson: JSON.stringify(result.missingData),
    },
  });

  return Response.json({
    ok: true,
    result,
    updatedAt: snapshot.createdAt.toISOString(),
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const profile = await prisma.revenueProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return Response.json({ ok: true, data: null });
  }

  return Response.json({ ok: true, data: profile });
}
