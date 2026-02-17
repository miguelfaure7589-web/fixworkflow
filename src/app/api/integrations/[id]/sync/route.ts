import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import "@/lib/integrations/providers/shopify";
import "@/lib/integrations/providers/stripe-data";
import { syncIntegration } from "@/lib/integrations/sync";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const { id } = await params;

  // Verify the integration belongs to this user
  const integration = await prisma.integration.findFirst({
    where: { id, userId },
  });

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  const result = await syncIntegration(integration.id);
  return NextResponse.json(result);
}
