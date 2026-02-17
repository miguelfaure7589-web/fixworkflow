/**
 * Shopify Integration Provider
 *
 * Connects to a user's Shopify store via OAuth and pulls
 * orders, customers, and analytics data weekly.
 */

import type { Integration } from "@/generated/prisma/client";
import { registerProvider } from "../registry";
import type { IntegrationProvider, OAuthResult, PulledData, PillarMetrics } from "../types";

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || "";
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || "";
const SHOPIFY_SCOPES = "read_orders,read_customers,read_analytics,read_products";
const API_VERSION = "2024-01";

function normalizeStoreDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, "");
  domain = domain.replace(/\/$/, "");
  if (!domain.includes(".myshopify.com")) {
    domain = domain.replace(/\.myshopify\.com.*/, "");
    domain = `${domain}.myshopify.com`;
  }
  return domain;
}

function buildStateToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64url");
}

export function parseStateToken(state: string): { userId: string; ts: number } | null {
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return null;
  }
}

const shopifyProvider: IntegrationProvider = {
  id: "shopify",
  name: "Shopify",
  icon: "cdn.shopify.com",
  description: "Sync revenue, orders, customers, and conversion data from your Shopify store.",
  requiredScopes: SHOPIFY_SCOPES.split(","),
  pillarsAffected: ["revenue", "profitability", "retention", "acquisition"],

  getAuthUrl(userId: string, _redirectUri: string, extra?: Record<string, string>): string {
    const storeDomain = extra?.storeDomain;
    if (!storeDomain) throw new Error("storeDomain is required for Shopify OAuth");

    const normalized = normalizeStoreDomain(storeDomain);
    const state = buildStateToken(userId);
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/shopify/callback`;

    return `https://${normalized}/admin/oauth/authorize?client_id=${SHOPIFY_CLIENT_ID}&scope=${SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  },

  async handleCallback(code: string, userId: string, extra?: Record<string, string>): Promise<OAuthResult> {
    const storeDomain = extra?.storeDomain;
    if (!storeDomain) throw new Error("storeDomain required");

    const normalized = normalizeStoreDomain(storeDomain);

    const res = await fetch(`https://${normalized}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shopify token exchange failed: ${text}`);
    }

    const data = await res.json();

    return {
      accessToken: data.access_token,
      scopes: data.scope,
      storeDomain: normalized,
      externalId: normalized,
    };
  },

  // Shopify tokens don't expire (permanent until app uninstalled)
  // No refreshAccessToken needed

  async pullData(integration: Integration): Promise<PulledData> {
    const { accessToken, storeDomain } = integration;
    if (!storeDomain) throw new Error("No store domain configured");

    const baseUrl = `https://${storeDomain}/admin/api/${API_VERSION}`;
    const headers = {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    };

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const minDate = sevenDaysAgo.toISOString();
    const maxDate = now.toISOString();

    // Pull orders
    const ordersRes = await fetch(
      `${baseUrl}/orders.json?status=any&created_at_min=${minDate}&created_at_max=${maxDate}&limit=250`,
      { headers },
    );
    const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
    const orders = ordersData.orders || [];

    // Pull new customers
    const customersRes = await fetch(
      `${baseUrl}/customers.json?created_at_min=${minDate}&limit=250`,
      { headers },
    );
    const customersData = customersRes.ok ? await customersRes.json() : { customers: [] };
    const newCustomers = customersData.customers || [];

    // Pull repeat customers (orders_count >= 2)
    const repeatRes = await fetch(
      `${baseUrl}/customers/count.json?orders_count_min=2`,
      { headers },
    );
    const repeatData = repeatRes.ok ? await repeatRes.json() : { count: 0 };

    const totalCustomersRes = await fetch(`${baseUrl}/customers/count.json`, { headers });
    const totalCustomersData = totalCustomersRes.ok ? await totalCustomersRes.json() : { count: 0 };

    // Calculate metrics from orders
    let totalRevenue = 0;
    let totalRefunds = 0;
    let fulfilledOrders = 0;
    let totalFulfillmentHours = 0;
    let pendingOrders = 0;

    for (const order of orders) {
      const price = parseFloat(order.total_price || "0");
      totalRevenue += price;

      if (order.refunds?.length > 0) {
        for (const refund of order.refunds) {
          for (const item of refund.refund_line_items || []) {
            totalRefunds += parseFloat(item.subtotal || "0");
          }
        }
      }

      if (order.fulfillment_status === "fulfilled" && order.fulfillments?.length > 0) {
        const created = new Date(order.created_at).getTime();
        const fulfilled = new Date(order.fulfillments[0].created_at).getTime();
        totalFulfillmentHours += (fulfilled - created) / (1000 * 60 * 60);
        fulfilledOrders++;
      }

      if (order.fulfillment_status === null || order.fulfillment_status === "partial") {
        pendingOrders++;
      }
    }

    const orderCount = orders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const refundRate = orderCount > 0 ? (orders.filter((o: any) => o.refunds?.length > 0).length / orderCount) * 100 : 0;
    const avgFulfillmentTime = fulfilledOrders > 0 ? totalFulfillmentHours / fulfilledOrders : undefined;
    const repeatRate = totalCustomersData.count > 0 ? (repeatData.count / totalCustomersData.count) * 100 : undefined;

    // Try GraphQL for conversion/session data (may not be available on all plans)
    let sessions: number | undefined;
    let conversionRate: number | undefined;

    try {
      const gqlRes = await fetch(`${baseUrl}/graphql.json`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: `{
            shopifyqlQuery(query: "FROM sessions SINCE -7d UNTIL today SHOW sum(sessions) AS total_sessions, sum(convertedSessions) AS converted_sessions") {
              tableData {
                rowData
              }
            }
          }`,
        }),
      });

      if (gqlRes.ok) {
        const gqlData = await gqlRes.json();
        const rows = gqlData?.data?.shopifyqlQuery?.tableData?.rowData;
        if (rows?.[0]) {
          sessions = parseInt(rows[0][0]) || undefined;
          const converted = parseInt(rows[0][1]) || 0;
          if (sessions && sessions > 0) {
            conversionRate = (converted / sessions) * 100;
          }
        }
      }
    } catch {
      // Analytics not available on this plan — skip
    }

    return {
      provider: "shopify",
      pulledAt: now,
      periodStart: sevenDaysAgo,
      periodEnd: now,
      raw: { orders: orders.length, newCustomers: newCustomers.length, sessions },
      metrics: {
        totalRevenue,
        orderCount,
        averageOrderValue: avgOrderValue,
        grossRevenue: totalRevenue,
        refunds: totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
        grossMargin: totalRevenue > 0 ? ((totalRevenue - totalRefunds) / totalRevenue) * 100 : undefined,
        newCustomers: newCustomers.length,
        repeatCustomerRate: repeatRate,
        conversionRate,
        sessions,
        fulfillmentTime: avgFulfillmentTime,
        refundRate,
        pendingOrders,
      },
    };
  },

  mapToPillars(data: PulledData, _currentProfile: any): PillarMetrics {
    const m = data.metrics;
    const changes: string[] = [];

    // Revenue
    let revenueResult;
    if (m.totalRevenue !== undefined) {
      const monthly = m.totalRevenue * (30 / 7);
      changes.push(`Revenue updated to ~$${Math.round(monthly).toLocaleString()}/mo from Shopify orders`);
      revenueResult = {
        score: monthly >= 50000 ? 90 : monthly >= 15000 ? 75 : monthly >= 5000 ? 60 : monthly >= 1000 ? 40 : 20,
        metrics: { monthlyRevenue: monthly, weeklyRevenue: m.totalRevenue, orderCount: m.orderCount, aov: m.averageOrderValue },
        changes: [changes[changes.length - 1]],
      };
    }

    // Profitability
    let profitabilityResult;
    if (m.grossMargin !== undefined) {
      changes.push(`Gross margin at ${m.grossMargin.toFixed(1)}% after refunds`);
      profitabilityResult = {
        score: m.grossMargin >= 70 ? 90 : m.grossMargin >= 50 ? 70 : m.grossMargin >= 30 ? 50 : 25,
        metrics: { grossMargin: m.grossMargin, refunds: m.refunds, netRevenue: m.netRevenue },
        changes: [changes[changes.length - 1]],
      };
    }

    // Retention
    let retentionResult;
    if (m.repeatCustomerRate !== undefined) {
      changes.push(`Repeat customer rate: ${m.repeatCustomerRate.toFixed(1)}%`);
      retentionResult = {
        score: m.repeatCustomerRate >= 40 ? 85 : m.repeatCustomerRate >= 25 ? 70 : m.repeatCustomerRate >= 15 ? 50 : 30,
        metrics: { repeatCustomerRate: m.repeatCustomerRate },
        changes: [changes[changes.length - 1]],
      };
    }

    // Acquisition
    let acquisitionResult;
    if (m.newCustomers !== undefined) {
      const monthlyNew = m.newCustomers * (30 / 7);
      changes.push(`${Math.round(monthlyNew)} new customers/mo from Shopify`);
      const acqScore = m.conversionRate !== undefined
        ? (m.conversionRate >= 5 ? 90 : m.conversionRate >= 3 ? 75 : m.conversionRate >= 1 ? 50 : 25)
        : (monthlyNew >= 100 ? 80 : monthlyNew >= 30 ? 60 : monthlyNew >= 10 ? 40 : 25);
      acquisitionResult = {
        score: acqScore,
        metrics: { newCustomers: monthlyNew, conversionRate: m.conversionRate, sessions: m.sessions },
        changes: [changes[changes.length - 1]],
      };
    }

    // Operations
    let operationsResult;
    if (m.fulfillmentTime !== undefined || m.refundRate !== undefined) {
      const opsChanges: string[] = [];
      let opsScore = 70;
      if (m.fulfillmentTime !== undefined) {
        opsScore = m.fulfillmentTime <= 24 ? 90 : m.fulfillmentTime <= 72 ? 75 : m.fulfillmentTime <= 168 ? 55 : 30;
        opsChanges.push(`Avg fulfillment: ${m.fulfillmentTime.toFixed(0)}h`);
      }
      if (m.refundRate !== undefined && m.refundRate > 3) {
        opsChanges.push(`Refund rate: ${m.refundRate.toFixed(1)}%`);
        opsScore = Math.min(opsScore, 50);
      }
      operationsResult = {
        score: opsScore,
        metrics: { fulfillmentTime: m.fulfillmentTime, refundRate: m.refundRate, pendingOrders: m.pendingOrders },
        changes: opsChanges,
      };
    }

    return {
      revenue: revenueResult,
      profitability: profitabilityResult,
      retention: retentionResult,
      acquisition: acquisitionResult,
      operations: operationsResult,
    };
  },

  async disconnect(integration: Integration): Promise<void> {
    // Shopify doesn't have a formal revoke endpoint for custom apps
    // The token is simply discarded
  },
};

// Register on import
registerProvider(shopifyProvider);

export { shopifyProvider, normalizeStoreDomain };
