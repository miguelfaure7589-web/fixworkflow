import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // @ts-expect-error stripe version mismatch
    apiVersion: "2024-06-20",
  });
}

export async function POST() {
  const stripe = getStripe();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, stripeSubscriptionId: true },
  });

  if (!user?.isPremium) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  let cancellationDate: Date;

  if (user.stripeSubscriptionId) {
    // Cancel at period end through Stripe — user keeps access until billing date
    const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    }) as unknown as Stripe.Subscription;

    // cancel_at is set by Stripe when cancel_at_period_end is true
    if (sub.cancel_at) {
      cancellationDate = new Date(sub.cancel_at * 1000);
    } else {
      // Fallback: items carry the period end
      const itemEnd = sub.items?.data?.[0]?.current_period_end;
      cancellationDate = itemEnd ? new Date(itemEnd * 1000) : new Date(Date.now() + 30 * 86400000);
    }
  } else {
    // Fallback: no Stripe sub ID (legacy) — set 30-day grace period
    cancellationDate = new Date();
    cancellationDate.setDate(cancellationDate.getDate() + 30);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { cancellationDate },
  });

  return NextResponse.json({
    success: true,
    cancellationDate: cancellationDate.toISOString(),
  });
}
