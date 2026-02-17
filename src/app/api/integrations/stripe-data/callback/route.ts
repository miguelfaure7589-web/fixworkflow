import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import "@/lib/integrations/providers/stripe-data";
import { getProvider } from "@/lib/integrations/registry";
import { parseStateToken } from "@/lib/integrations/providers/stripe-data";
import { syncIntegration } from "@/lib/integrations/sync";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&error=missing_params`,
    );
  }

  const parsed = parseStateToken(state);
  if (!parsed?.userId) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&error=invalid_state`,
    );
  }

  const provider = getProvider("stripe-data");
  if (!provider) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&error=provider_missing`,
    );
  }

  try {
    const result = await provider.handleCallback(code, parsed.userId);

    const integration = await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: parsed.userId,
          provider: "stripe-data",
        },
      },
      create: {
        userId: parsed.userId,
        provider: "stripe-data",
        status: "connected",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenExpiresAt: result.tokenExpiresAt,
        externalId: result.externalId,
        scopes: result.scopes,
        metadata: result.metadata,
      },
      update: {
        status: "connected",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenExpiresAt: result.tokenExpiresAt,
        externalId: result.externalId,
        scopes: result.scopes,
        metadata: result.metadata,
        lastSyncError: null,
      },
    });

    // Trigger immediate first sync
    syncIntegration(integration.id).catch(console.error);

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&connected=stripe`,
    );
  } catch (err: any) {
    console.error("Stripe Connect callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&error=oauth_failed`,
    );
  }
}
