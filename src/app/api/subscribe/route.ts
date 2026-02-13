import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const { email, plan } = body; // plan: "monthly" | "yearly"

    const priceId =
      plan === "yearly"
        ? process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
        : process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID not configured" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/diagnose?upgraded=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: { email, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
