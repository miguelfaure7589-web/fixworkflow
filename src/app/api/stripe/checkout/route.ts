import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // @ts-expect-error stripe version mismatch
    apiVersion: "2024-06-20",
  });
}

export async function POST(req: Request) {
  const stripe = getStripe();
  try {
    console.log("[CHECKOUT] POST /api/stripe/checkout hit");
    console.log("[CHECKOUT] STRIPE_SECRET_KEY set:", !!process.env.STRIPE_SECRET_KEY);
    console.log("[CHECKOUT] STRIPE_PREMIUM_MONTHLY_PRICE_ID:", process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? "(not set)");
    console.log("[CHECKOUT] STRIPE_PRICE_ID:", process.env.STRIPE_PRICE_ID ?? "(not set)");
    console.log("[CHECKOUT] STRIPE_PREMIUM_YEARLY_PRICE_ID:", process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID ?? "(not set)");

    const session = await getServerSession(authOptions);
    console.log("[CHECKOUT] Session found:", !!session, "| email:", session?.user?.email ?? "(none)");

    if (!session?.user?.email) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, stripeCustomerId: true },
    });
    console.log("[CHECKOUT] User found:", !!user, "| stripeCustomerId:", user?.stripeCustomerId ?? "(none)");

    if (!user?.email) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Determine plan (default to monthly)
    let plan = "monthly";
    try {
      const body = await req.json().catch(() => null);
      if (body?.plan === "yearly") plan = "yearly";
    } catch { /* empty body is fine — defaults to monthly */ }

    const priceId =
      plan === "yearly"
        ? process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!
        : (process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || process.env.STRIPE_PRICE_ID)!;

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://fixworkflow.com";

    console.log("[CHECKOUT] plan:", plan, "| priceId:", priceId, "| baseUrl:", baseUrl);

    if (!priceId) {
      console.error("[CHECKOUT] No price ID resolved — all env vars are missing");
      return Response.json({ error: "Server misconfiguration: no Stripe price ID" }, { status: 500 });
    }

    // Reuse existing Stripe customer if available
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      success_url: `${baseUrl}/dashboard?upgraded=1`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
      metadata: {
        userId: user.id,
        plan,
      },
    };

    if (user.stripeCustomerId) {
      checkoutParams.customer = user.stripeCustomerId;
    } else {
      checkoutParams.customer_email = user.email;
    }

    console.log("[CHECKOUT] Creating Stripe checkout session...");
    const checkout = await stripe.checkout.sessions.create(checkoutParams);
    console.log("[CHECKOUT] Success — checkout URL:", checkout.url);

    return Response.json({ url: checkout.url });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[CHECKOUT] ERROR:", error.message);
    console.error("[CHECKOUT] Stack:", error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
