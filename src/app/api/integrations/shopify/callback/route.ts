import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import "@/lib/integrations/providers/shopify";
import { getProvider } from "@/lib/integrations/registry";
import { parseStateToken } from "@/lib/integrations/providers/shopify";
import { syncIntegration } from "@/lib/integrations/sync";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const shop = url.searchParams.get("shop");

  if (!code || !state || !shop) {
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

  const provider = getProvider("shopify");
  if (!provider) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&error=provider_missing`,
    );
  }

  try {
    const result = await provider.handleCallback(code, parsed.userId, { storeDomain: shop });

    // Create or update integration record
    const integration = await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: parsed.userId,
          provider: "shopify",
        },
      },
      create: {
        userId: parsed.userId,
        provider: "shopify",
        status: "connected",
        accessToken: result.accessToken,
        storeDomain: result.storeDomain,
        externalId: result.externalId,
        scopes: result.scopes,
        metadata: result.metadata,
      },
      update: {
        status: "connected",
        accessToken: result.accessToken,
        storeDomain: result.storeDomain,
        externalId: result.externalId,
        scopes: result.scopes,
        metadata: result.metadata,
        lastSyncError: null,
      },
    });

    // Trigger immediate first sync (don't await — let it run in background)
    syncIntegration(integration.id).catch(console.error);

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&connected=shopify`,
    );
  } catch (err: any) {
    console.error("Shopify callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&error=oauth_failed`,
    );
  }
}
