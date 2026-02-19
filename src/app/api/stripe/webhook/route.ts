import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error stripe version mismatch
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  console.log("[STRIPE WEBHOOK] ──── Incoming request ────");
  console.log("[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET set:", !!process.env.STRIPE_WEBHOOK_SECRET);

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig) {
    console.error("[STRIPE WEBHOOK] Missing stripe-signature header");
    return new Response("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[STRIPE WEBHOOK] Signature verification FAILED:", msg);
    console.error("[STRIPE WEBHOOK] This usually means STRIPE_WEBHOOK_SECRET doesn't match the endpoint.");
    console.error("[STRIPE WEBHOOK] Verify the webhook in Stripe Dashboard points to: https://fixworkflow.com/api/stripe/webhook");
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  console.log("[STRIPE WEBHOOK] Event verified — type:", event.type, "| id:", event.id);

  try {
    // ── checkout.session.completed → upgrade to Pro ──
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const customerEmail = session.customer_details?.email ?? session.customer_email;

      console.log("[STRIPE WEBHOOK] checkout.session.completed");
      console.log("[STRIPE WEBHOOK]   userId from metadata:", userId ?? "(none)");
      console.log("[STRIPE WEBHOOK]   customer:", session.customer);
      console.log("[STRIPE WEBHOOK]   subscription:", session.subscription);
      console.log("[STRIPE WEBHOOK]   customer_email:", customerEmail ?? "(none)");

      // Try metadata userId first, fall back to email lookup
      let targetUserId = userId;
      if (!targetUserId && customerEmail) {
        console.log("[STRIPE WEBHOOK]   No userId in metadata — looking up by email:", customerEmail);
        const userByEmail = await prisma.user.findUnique({
          where: { email: customerEmail },
          select: { id: true },
        });
        targetUserId = userByEmail?.id;
        console.log("[STRIPE WEBHOOK]   Email lookup result:", targetUserId ?? "NOT FOUND");
      }

      if (!targetUserId) {
        console.error("[STRIPE WEBHOOK]   CANNOT UPGRADE: no userId from metadata or email lookup");
        return new Response("ok"); // Return 200 so Stripe doesn't retry endlessly
      }

      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isPremium: true,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
          cancellationDate: null,
        },
      });
      console.log("[STRIPE WEBHOOK]   User UPGRADED to premium:", targetUserId);
    }

    // ── customer.subscription.updated → track cancellation scheduling ──
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      console.log("[STRIPE WEBHOOK] subscription.updated — sub:", sub.id, "cancel_at_period_end:", sub.cancel_at_period_end);

      if (sub.cancel_at_period_end && sub.cancel_at) {
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { cancellationDate: new Date(sub.cancel_at * 1000) },
        });
        console.log("[STRIPE WEBHOOK]   Cancellation date set for sub:", sub.id);
      } else if (!sub.cancel_at_period_end) {
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { cancellationDate: null },
        });
        console.log("[STRIPE WEBHOOK]   Cancellation reversed for sub:", sub.id);
      }
    }

    // ── customer.subscription.deleted → downgrade to free ──
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      console.log("[STRIPE WEBHOOK] subscription.deleted — sub:", sub.id);

      const result = await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          isPremium: false,
          stripeSubscriptionId: null,
          cancellationDate: null,
        },
      });
      console.log("[STRIPE WEBHOOK]   Users downgraded:", result.count);
    }

    // ── invoice.payment_failed → log for awareness ──
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      console.error("[STRIPE WEBHOOK] PAYMENT FAILED — customer:", invoice.customer);
    }

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[STRIPE WEBHOOK] Handler error:", error.message);
    console.error("[STRIPE WEBHOOK] Stack:", error.stack);
    // Return 200 anyway — a DB error shouldn't cause Stripe to retry and double-charge
    return new Response("ok");
  }

  console.log("[STRIPE WEBHOOK] ──── Done ────");
  return new Response("ok");
}
