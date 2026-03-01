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

export async function POST() {
  const stripe = getStripe();
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return Response.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/settings`,
  }) as unknown as Stripe.BillingPortal.Session;

  return Response.json({ url: portalSession.url });
}
