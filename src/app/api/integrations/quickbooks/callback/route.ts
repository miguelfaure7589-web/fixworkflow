import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import "@/lib/integrations/providers/quickbooks";
import { getProvider } from "@/lib/integrations/registry";
import { parseStateToken } from "@/lib/integrations/providers/quickbooks";
import { syncIntegration } from "@/lib/integrations/sync";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const realmId = url.searchParams.get("realmId");

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

  const provider = getProvider("quickbooks");
  if (!provider) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&error=provider_missing`,
    );
  }

  try {
    const result = await provider.handleCallback(code, parsed.userId, {
      realmId: realmId || "",
    });

    // Fetch company name for display
    let companyName = "";
    if (realmId && result.accessToken) {
      try {
        const infoRes = await fetch(
          `https://quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}?minorversion=75`,
          {
            headers: {
              Authorization: `Bearer ${result.accessToken}`,
              Accept: "application/json",
            },
          },
        );
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          companyName = infoData?.CompanyInfo?.CompanyName || "";
        }
      } catch {
        // Non-critical — continue without company name
      }
    }

    const integration = await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: parsed.userId,
          provider: "quickbooks",
        },
      },
      create: {
        userId: parsed.userId,
        provider: "quickbooks",
        status: "connected",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenExpiresAt: result.tokenExpiresAt,
        externalId: result.externalId,
        scopes: result.scopes,
        metadata: { companyName },
      },
      update: {
        status: "connected",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenExpiresAt: result.tokenExpiresAt,
        externalId: result.externalId,
        scopes: result.scopes,
        metadata: { companyName },
        lastSyncError: null,
      },
    });

    // Fire-and-forget first sync
    syncIntegration(integration.id).catch(console.error);

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&connected=quickbooks`,
    );
  } catch (err: any) {
    console.error("QuickBooks callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&error=oauth_failed`,
    );
  }
}
