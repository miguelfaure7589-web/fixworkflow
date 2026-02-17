import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(session.user as Record<string, unknown>).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

    const users = await prisma.user.findMany({
      take: limit,
      orderBy: { id: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isPremium: true,
        onboardingCompleted: true,
        diagnosisCompleted: true,
        revenueProfile: {
          select: {
            businessType: true,
            usesPersonalCredit: true,
          },
        },
        revenueScoreSnapshots: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { score: true, createdAt: true },
        },
      },
    });

    const formatted = users.map((u) => {
      // Determine funnel stage
      let funnelStage = "signed_up";
      if (u.isPremium) funnelStage = "pro";
      else if (u.revenueScoreSnapshots.length > 0) funnelStage = "active";
      else if (u.onboardingCompleted) funnelStage = "onboarded";
      else if (u.diagnosisCompleted) funnelStage = "diagnosis_done";

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        isPremium: u.isPremium,
        onboardingCompleted: u.onboardingCompleted,
        diagnosisCompleted: u.diagnosisCompleted,
        businessType: u.revenueProfile?.businessType ?? null,
        usesPersonalCredit: u.revenueProfile?.usesPersonalCredit ?? null,
        score: u.revenueScoreSnapshots[0]?.score ?? null,
        scoredAt: u.revenueScoreSnapshots[0]?.createdAt?.toISOString() ?? null,
        funnelStage,
      };
    });

    return NextResponse.json({ users: formatted });
  } catch (err: unknown) {
    console.error("ADMIN_USERS_ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
