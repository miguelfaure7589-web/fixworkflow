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
    // NOTE: The Google Analytics Admin API must be enabled separately in GCP Console.
    // It's a different API from the GA4 Data API.
    let properties: { id: string; name: string }[] = [];
    let adminApiError: string | null = null;
    try {
      // Paginate through all account summaries
      let pageToken: string | undefined;
      do {
        const adminUrl = new URL("https://analyticsadmin.googleapis.com/v1beta/accountSummaries");
        adminUrl.searchParams.set("pageSize", "200");
        if (pageToken) adminUrl.searchParams.set("pageToken", pageToken);

        const adminRes = await fetch(adminUrl.toString(), {
          headers: { Authorization: `Bearer ${result.accessToken}` },
        });

        if (!adminRes.ok) {
          const errBody = await adminRes.text();
          console.error(`[GA] Admin API failed (${adminRes.status}):`, errBody);

          // Detect "API not enabled" specifically
          if (adminRes.status === 403 && errBody.includes("has not been used in project")) {
            adminApiError = "Google Analytics Admin API is not enabled in your Google Cloud project. Enable it at console.cloud.google.com, then reconnect — or enter your GA4 Property ID manually below.";
          } else if (adminRes.status === 403) {
            adminApiError = `Admin API access denied (${adminRes.status}). You can enter your GA4 Property ID manually below.`;
          } else {
            adminApiError = `Failed to list GA4 properties (HTTP ${adminRes.status}). You can enter your GA4 Property ID manually below.`;
          }
          break;
        }

        const adminData = await adminRes.json();
        for (const account of adminData.accountSummaries || []) {
          for (const prop of account.propertySummaries || []) {
            // prop.property is like "properties/123456"
            const propId = prop.property?.replace("properties/", "") || "";
            if (propId) {
              properties.push({
                id: propId,
                name: prop.displayName || `Property ${propId}`,
              });
            }
          }
        }
        pageToken = adminData.nextPageToken;
      } while (pageToken);

      if (!adminApiError) {
        console.log(`[GA] Found ${properties.length} GA4 properties`);
      }
    } catch (adminErr: any) {
      console.error("[GA] Admin API call threw:", adminErr);
      adminApiError = `Failed to fetch properties: ${adminErr.message || "unknown error"}. You can enter your GA4 Property ID manually below.`;
    }

    const metadata: Record<string, any> = { properties };
    if (adminApiError) metadata.adminApiError = adminApiError;

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
