import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import "@/lib/integrations/providers/google-analytics";
import { getProvider } from "@/lib/integrations/registry";
import { parseStateToken } from "@/lib/integrations/providers/google-analytics";
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

  const provider = getProvider("google-analytics");
  if (!provider) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&error=provider_missing`,
    );
  }

  try {
    const result = await provider.handleCallback(code, parsed.userId);

    // Fetch GA4 property list from Admin API
    let properties: { id: string; name: string }[] = [];
    try {
      const adminRes = await fetch(
        "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
        {
          headers: { Authorization: `Bearer ${result.accessToken}` },
        },
      );
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        for (const account of adminData.accountSummaries || []) {
          for (const prop of account.propertySummaries || []) {
            // prop.property is like "properties/123456"
            const propId = prop.property?.replace("properties/", "") || "";
            properties.push({
              id: propId,
              name: prop.displayName || `Property ${propId}`,
            });
          }
        }
      }
    } catch {
      // Non-fatal — user can still select property later
    }

    const metadata = { properties };

    const integration = await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: parsed.userId,
          provider: "google-analytics",
        },
      },
      create: {
        userId: parsed.userId,
        provider: "google-analytics",
        status: "connected",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenExpiresAt: result.tokenExpiresAt,
        scopes: result.scopes,
        metadata,
      },
      update: {
        status: "connected",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenExpiresAt: result.tokenExpiresAt,
        scopes: result.scopes,
        metadata,
        lastSyncError: null,
      },
    });

    // If user has exactly 1 property, auto-select it and trigger sync
    if (properties.length === 1) {
      await prisma.integration.update({
        where: { id: integration.id },
        data: { externalId: properties[0].id },
      });
      syncIntegration(integration.id).catch(console.error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?tab=integrations&connected=google-analytics`,
      );
    }

    // Multiple properties — redirect with flag so UI shows property selector
    if (properties.length > 1) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?tab=integrations&connected=google-analytics&needs_property_select=true`,
      );
    }

    // No properties found — still connected, but sync will fail until property is set
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&connected=google-analytics`,
    );
  } catch (err: any) {
    console.error("Google Analytics callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?tab=integrations&error=oauth_failed`,
    );
  }
}
