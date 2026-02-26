/**
 * QuickBooks Integration Provider
 *
 * Connects to the user's QuickBooks Online account via Intuit OAuth 2.0.
 * Pulls P&L reports, invoices, and customer data to score
 * the profitability and operations pillars.
 */

import type { Integration } from "@/generated/prisma/client";
import { registerProvider } from "../registry";
import type {
  IntegrationProvider,
  OAuthResult,
  PulledData,
  PillarMetrics,
} from "../types";

const CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || "";
const CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || "";

const INTUIT_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const INTUIT_TOKEN_URL =
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_API_BASE = "https://quickbooks.api.intuit.com/v3/company";
const INTUIT_REVOKE_URL =
  "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

function basicAuthHeader(): string {
  return "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
}

function buildStateToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString(
    "base64url",
  );
}

export function parseStateToken(
  state: string,
): { userId: string; ts: number } | null {
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return null;
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const quickbooksProvider: IntegrationProvider = {
  id: "quickbooks",
  name: "QuickBooks",
  icon: "quickbooks.intuit.com",
  description:
    "Sync accounting data, profit & loss, margins, expenses, and invoices.",
  requiredScopes: ["com.intuit.quickbooks.accounting"],
  pillarsAffected: ["profitability", "operations"],

  getAuthUrl(userId: string): string {
    const state = buildStateToken(userId);
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/quickbooks/callback`;

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "com.intuit.quickbooks.accounting",
      state,
    });

    return `${INTUIT_AUTH_URL}?${params.toString()}`;
  },

  async handleCallback(
    code: string,
    _userId: string,
    extra?: Record<string, string>,
  ): Promise<OAuthResult> {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/quickbooks/callback`;

    const res = await fetch(INTUIT_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: basicAuthHeader(),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`QuickBooks token exchange failed: ${text}`);
    }

    const data = await res.json();
    const realmId = extra?.realmId;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      externalId: realmId,
      scopes: "com.intuit.quickbooks.accounting",
    };
  },

  async refreshAccessToken(integration: Integration) {
    if (!integration.refreshToken) throw new Error("No refresh token");

    const res = await fetch(INTUIT_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: basicAuthHeader(),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: integration.refreshToken,
      }),
    });

    if (!res.ok) throw new Error("Failed to refresh QuickBooks token");
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  },

  async pullData(integration: Integration): Promise<PulledData> {
    const realmId = integration.externalId;
    if (!realmId) throw new Error("No QuickBooks realmId (externalId)");

    const baseUrl = `${QB_API_BASE}/${realmId}`;
    const headers = {
      Authorization: `Bearer ${integration.accessToken}`,
      Accept: "application/json",
    };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = formatDate(thirtyDaysAgo);
    const endDate = formatDate(now);

    // Pull P&L Report
    const plRes = await fetch(
      `${baseUrl}/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}&minorversion=75`,
      { headers },
    );
    if (!plRes.ok) {
      const text = await plRes.text();
      throw new Error(`QuickBooks P&L fetch failed: ${text}`);
    }
    const plData = await plRes.json();

    // Extract P&L totals from the report rows
    let totalIncome = 0;
    let totalExpenses = 0;
    let netIncome = 0;

    const rows = plData?.Rows?.Row || [];
    for (const row of rows) {
      const summary = row?.Summary?.ColData;
      if (!summary) continue;
      const group = row.group;
      const value = parseFloat(summary[1]?.value) || 0;

      if (group === "Income") totalIncome = value;
      else if (group === "Expenses" || group === "CostOfGoodsSold")
        totalExpenses += value;
      else if (group === "NetIncome") netIncome = value;
    }

    const grossProfit = totalIncome - totalExpenses;

    // Pull Invoices (last 30 days)
    const invQuery = encodeURIComponent(
      `SELECT * FROM Invoice WHERE TxnDate >= '${startDate}' MAXRESULTS 1000`,
    );
    const invRes = await fetch(`${baseUrl}/query?query=${invQuery}&minorversion=75`, {
      headers,
    });
    if (!invRes.ok) {
      const text = await invRes.text();
      throw new Error(`QuickBooks invoice query failed: ${text}`);
    }
    const invData = await invRes.json();

    const invoices = invData?.QueryResponse?.Invoice || [];
    const invoiceCount = invoices.length;
    let invoiceTotalAmount = 0;
    let overdueCount = 0;
    const todayStr = formatDate(now);

    for (const inv of invoices) {
      invoiceTotalAmount += parseFloat(inv.TotalAmt) || 0;
      const balance = parseFloat(inv.Balance) || 0;
      if (balance > 0 && inv.DueDate && inv.DueDate < todayStr) {
        overdueCount++;
      }
    }

    // Pull active customer count
    const custQuery = encodeURIComponent(
      "SELECT COUNT(*) FROM Customer WHERE Active = true",
    );
    const custRes = await fetch(
      `${baseUrl}/query?query=${custQuery}&minorversion=75`,
      { headers },
    );
    let totalCustomers = 0;
    if (custRes.ok) {
      const custData = await custRes.json();
      totalCustomers = custData?.QueryResponse?.totalCount ?? 0;
    }

    return {
      provider: "quickbooks",
      pulledAt: now,
      periodStart: thirtyDaysAgo,
      periodEnd: now,
      raw: {
        totalIncome,
        totalExpenses,
        netIncome,
        grossProfit,
        invoiceCount,
        invoiceTotalAmount,
        overdueCount,
        totalCustomers,
      },
      metrics: {
        totalRevenue: totalIncome,
        grossRevenue: totalIncome,
        netRevenue: netIncome,
        grossMargin:
          totalIncome > 0
            ? ((totalIncome - totalExpenses) / totalIncome) * 100
            : undefined,
        activeCustomers: totalCustomers,
        overdueInvoices: overdueCount,
        orderCount: invoiceCount,
      },
    };
  },

  mapToPillars(data: PulledData, _currentProfile: any): PillarMetrics {
    const raw = data.raw as {
      totalIncome: number;
      totalExpenses: number;
      netIncome: number;
      grossProfit: number;
      invoiceCount: number;
      overdueCount: number;
      totalCustomers: number;
    };

    // Profitability — based on gross margin %
    const grossMarginPct =
      raw.totalIncome > 0
        ? ((raw.totalIncome - raw.totalExpenses) / raw.totalIncome) * 100
        : 0;

    let profitScore: number;
    if (grossMarginPct >= 70) profitScore = 90;
    else if (grossMarginPct >= 50) profitScore = 70;
    else if (grossMarginPct >= 30) profitScore = 50;
    else if (grossMarginPct >= 10) profitScore = 30;
    else profitScore = 15;

    // Boost for positive net income
    if (raw.netIncome > 0 && profitScore < 95) profitScore += 5;

    const profitChanges: string[] = [];
    profitChanges.push(
      `Gross margin: ${grossMarginPct.toFixed(1)}% ($${Math.round(raw.totalIncome).toLocaleString()} income, $${Math.round(raw.totalExpenses).toLocaleString()} expenses)`,
    );
    if (raw.netIncome !== 0) {
      profitChanges.push(
        `Net income: $${Math.round(raw.netIncome).toLocaleString()} (last 30 days)`,
      );
    }

    // Operations — based on overdue invoice ratio
    const overdueRatio =
      raw.invoiceCount > 0 ? (raw.overdueCount / raw.invoiceCount) * 100 : 0;

    let opsScore: number;
    if (raw.overdueCount === 0) opsScore = 90;
    else if (overdueRatio < 10) opsScore = 70;
    else if (overdueRatio < 25) opsScore = 50;
    else opsScore = 30;

    const opsChanges: string[] = [];
    opsChanges.push(
      `Invoices: ${raw.invoiceCount} total, ${raw.overdueCount} overdue (${overdueRatio.toFixed(1)}%)`,
    );
    if (raw.totalCustomers > 0) {
      opsChanges.push(`Active customers: ${raw.totalCustomers}`);
    }

    return {
      profitability: {
        score: profitScore,
        metrics: {
          grossMarginPct,
          totalIncome: raw.totalIncome,
          totalExpenses: raw.totalExpenses,
          netIncome: raw.netIncome,
        },
        changes: profitChanges,
      },
      operations: {
        score: opsScore,
        metrics: {
          invoiceCount: raw.invoiceCount,
          overdueCount: raw.overdueCount,
          overdueRatio,
          totalCustomers: raw.totalCustomers,
        },
        changes: opsChanges,
      },
    };
  },

  async disconnect(integration: Integration): Promise<void> {
    if (!integration.refreshToken) return;

    try {
      await fetch(INTUIT_REVOKE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuthHeader(),
        },
        body: JSON.stringify({ token: integration.refreshToken }),
      });
    } catch {
      // Best effort — token may already be invalid
    }
  },
};

// Register on import
registerProvider(quickbooksProvider);

export { quickbooksProvider };
