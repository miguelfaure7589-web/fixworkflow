import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { syncIntegration } from "@/lib/integrations/sync";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const body = await req.json();
  const { integrationId, propertyId, propertyName } = body;

  if (!integrationId || !propertyId) {
    return NextResponse.json({ error: "Missing integrationId or propertyId" }, { status: 400 });
  }

  const integration = await prisma.integration.findFirst({
    where: { id: integrationId, userId, provider: "google-analytics" },
  });

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  // Update externalId to the selected property and store propertyName in metadata
  const existingMetadata = (integration.metadata as Record<string, any>) || {};
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      externalId: propertyId,
      metadata: { ...existingMetadata, selectedPropertyName: propertyName || `Property ${propertyId}` },
    },
  });

  // Trigger initial sync
  syncIntegration(integration.id).catch(console.error);

  return NextResponse.json({ success: true });
}
