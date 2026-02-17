import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const body = await req.json();
  const { key, value, type } = body;

  if (typeof key !== "string" || typeof value !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true, privacyPrefs: true },
  });

  if (type === "privacy") {
    const current = (user?.privacyPrefs as Record<string, boolean> | null) || {
      anonymousAnalytics: true,
      personalizedRecs: true,
    };
    const updated = { ...current, [key]: value };

    await prisma.user.update({
      where: { id: userId },
      data: { privacyPrefs: updated },
    });

    return NextResponse.json(updated);
  }

  // Default: notification prefs
  const current = (user?.notificationPrefs as Record<string, boolean> | null) || {
    scoreUpdates: true,
    playbookReminders: true,
    newRecommendations: true,
    productUpdates: true,
    tipsInsights: true,
    marketingEmails: false,
  };
  const updated = { ...current, [key]: value };

  await prisma.user.update({
    where: { id: userId },
    data: { notificationPrefs: updated },
  });

  return NextResponse.json(updated);
}
