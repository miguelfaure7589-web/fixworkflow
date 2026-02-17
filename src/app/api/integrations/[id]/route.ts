import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import "@/lib/integrations/providers/shopify";
import "@/lib/integrations/providers/stripe-data";
import { getProvider } from "@/lib/integrations/registry";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const { id } = await params;

  const integration = await prisma.integration.findFirst({
    where: { id, userId },
  });

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  // Call provider's disconnect method
  const provider = getProvider(integration.provider);
  if (provider) {
    try {
      await provider.disconnect(integration);
    } catch {
      // Best effort
    }
  }

  // Delete integration and related sync logs (cascade)
  await prisma.integration.delete({ where: { id: integration.id } });

  return NextResponse.json({ success: true });
}
