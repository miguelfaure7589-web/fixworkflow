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
    const search = searchParams.get("search")?.trim() || "";

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
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

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(session.user as Record<string, unknown>).isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { id, name, email, businessType, score, funnelStage, usesPersonalCredit } = body as {
      id: string;
      name?: string;
      email?: string;
      businessType?: string;
      score?: number | null;
      funnelStage?: string;
      usesPersonalCredit?: string;
    };

    if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    // Update core user fields
    const userUpdate: Record<string, unknown> = {};
    if (name !== undefined) userUpdate.name = name;
    if (email !== undefined) userUpdate.email = email;
    if (funnelStage !== undefined) {
      if (funnelStage === "pro") userUpdate.isPremium = true;
      if (funnelStage === "onboarded") { userUpdate.onboardingCompleted = true; userUpdate.diagnosisCompleted = true; }
      if (funnelStage === "diagnosis_done") userUpdate.diagnosisCompleted = true;
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id }, data: userUpdate });
    }

    // Update revenue profile fields
    if (businessType !== undefined || usesPersonalCredit !== undefined) {
      const profileData: Record<string, unknown> = {};
      if (businessType !== undefined) profileData.businessType = businessType;
      if (usesPersonalCredit !== undefined) profileData.usesPersonalCredit = usesPersonalCredit;

      await prisma.revenueProfile.upsert({
        where: { userId: id },
        update: profileData,
        create: { userId: id, ...profileData },
      });
    }

    // Update score via new snapshot
    if (score !== undefined && score !== null) {
      await prisma.revenueScoreSnapshot.create({
        data: {
          userId: id,
          score,
          pillarRevenue: 0,
          pillarProfitability: 0,
          pillarRetention: 0,
          pillarAcquisition: 0,
          pillarOps: 0,
          pillarsJson: "{}",
          primaryRisk: "manual_edit",
          fastestLever: "manual_edit",
          nextStepsJson: "[]",
          missingDataJson: "[]",
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("ADMIN_USER_PATCH_ERROR:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(session.user as Record<string, unknown>).isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    // Prevent deleting yourself
    const adminId = (session.user as Record<string, unknown>).id as string;
    if (id === adminId) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("ADMIN_USER_DELETE_ERROR:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
