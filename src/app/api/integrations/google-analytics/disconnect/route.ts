import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import "@/lib/integrations/providers/google-analytics";
import { getProvider } from "@/lib/integrations/registry";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  const integration = await prisma.integration.findFirst({
    where: { userId, provider: "google-analytics" },
  });

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  // Call provider's disconnect method (revoke token)
  const provider = getProvider("google-analytics");
  if (provider) {
    try {
      await provider.disconnect(integration);
    } catch {
      // Best effort
    }
  }

  // Delete integration record
  await prisma.integration.delete({ where: { id: integration.id } });

  return NextResponse.json({ success: true });
}
