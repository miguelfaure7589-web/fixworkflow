import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      isPremium: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      cancellationDate: true,
      notificationPrefs: true,
      privacyPrefs: true,
      accounts: { select: { provider: true }, take: 1 },
      businessProfiles: {
        select: { businessName: true, businessType: true },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name,
    email: user.email,
    phone: user.phone,
    isPremium: user.isPremium,
    stripeCustomerId: user.stripeCustomerId,
    hasStripeSubscription: !!user.stripeSubscriptionId,
    cancellationDate: user.cancellationDate,
    notificationPrefs: user.notificationPrefs,
    privacyPrefs: user.privacyPrefs,
    authProvider: user.accounts[0]?.provider || null,
    businessProfile: user.businessProfiles[0] || null,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const body = await req.json();
  const { name, email, businessName, businessType, phone } = body;

  // Validate email format
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Update User record
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
    },
  });

  // Update or create BusinessProfile
  if (businessName !== undefined || businessType !== undefined) {
    const existing = await prisma.businessProfile.findFirst({
      where: { userId },
    });

    if (existing) {
      await prisma.businessProfile.update({
        where: { id: existing.id },
        data: {
          ...(businessName !== undefined && { businessName }),
          ...(businessType !== undefined && businessType && { businessType }),
        },
      });
    } else if (businessType) {
      await prisma.businessProfile.create({
        data: {
          userId,
          businessName: businessName || null,
          businessType,
          revenueStage: "0_1k",
          primaryChannel: "organic",
          teamSize: "1",
          currentRevenue: 0,
          confidenceScore: 0.5,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
