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

export async function GET() {
  const stripe = getStripe();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ invoices: [] });
  }

  const invoicesResponse = await stripe.invoices.list({
    customer: user.stripeCustomerId,
    limit: 24,
  }) as unknown as Stripe.ApiList<Stripe.Invoice>;

  const formatted = invoicesResponse.data.map((inv) => ({
    id: inv.id,
    date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
    description: inv.lines.data[0]?.description || "Pro subscription",
    amount: inv.amount_paid != null ? (inv.amount_paid / 100).toFixed(2) : "0.00",
    status: inv.status || "unknown",
    invoiceUrl: inv.hosted_invoice_url || null,
    pdfUrl: inv.invoice_pdf || null,
  }));

  return NextResponse.json({ invoices: formatted });
}
