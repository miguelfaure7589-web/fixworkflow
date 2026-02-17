import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error stripe version mismatch
  apiVersion: "2024-06-20",
});

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, stripeCustomerId: true },
  });

  if (!user?.email) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Reuse existing Stripe customer if available
  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [
      { price: process.env.STRIPE_PRICE_ID!, quantity: 1 },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/pricing?success=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=1`,
    metadata: {
      userId: user.id,
    },
  };

  if (user.stripeCustomerId) {
    checkoutParams.customer = user.stripeCustomerId;
  } else {
    checkoutParams.customer_email = user.email;
  }

  const checkout = await stripe.checkout.sessions.create(checkoutParams);

  return Response.json({ url: checkout.url });
}
