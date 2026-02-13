import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

function getPeriodEnd(subscription: Stripe.Subscription): Date {
  const sub = subscription as unknown as Record<string, unknown>;
  const periodEnd = sub.current_period_end as number | undefined;
  if (periodEnd) return new Date(periodEnd * 1000);
  return new Date();
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_email || session.metadata?.email;
      const subscriptionId = session.subscription as string;

      if (email && subscriptionId) {
        const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
        const subscription = subResponse as unknown as Stripe.Subscription;

        await prisma.user.upsert({
          where: { email },
          update: {
            plan: "premium",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
          },
          create: {
            email,
            plan: "premium",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: subscription.status === "active" ? "premium" : "free",
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: "free", stripeSubscriptionId: null },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
