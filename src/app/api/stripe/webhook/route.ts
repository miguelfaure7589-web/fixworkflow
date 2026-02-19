import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error stripe version mismatch
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  console.log("[STRIPE WEBHOOK] Received event");

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig) {
    console.log("[STRIPE WEBHOOK] Missing stripe-signature header");
    return new Response("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("[STRIPE WEBHOOK] Signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("[STRIPE WEBHOOK] Event type:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const userId = session.metadata?.userId;
    console.log("[STRIPE WEBHOOK] checkout.session.completed — userId:", userId, "customer:", session.customer, "subscription:", session.subscription);

    if (!userId) {
      console.log("[STRIPE WEBHOOK] No userId in metadata — cannot upgrade");
      return new Response("Missing userId", { status: 400 });
    }

    // Store Stripe IDs for portal + cancellation
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        stripeCustomerId: session.customer ?? null,
        stripeSubscriptionId: session.subscription ?? null,
        cancellationDate: null,
      },
    });
    console.log("[STRIPE WEBHOOK] User upgraded to premium:", userId);
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;

    // If cancel_at_period_end was set, record the cancellation date
    if (sub.cancel_at_period_end && sub.cancel_at) {
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          cancellationDate: new Date(sub.cancel_at * 1000),
        },
      });
    } else if (!sub.cancel_at_period_end) {
      // Cancellation was reversed
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { cancellationDate: null },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await prisma.user.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: {
        isPremium: false,
        stripeSubscriptionId: null,
        cancellationDate: null,
      },
    });
  }

  return new Response("ok");
}
