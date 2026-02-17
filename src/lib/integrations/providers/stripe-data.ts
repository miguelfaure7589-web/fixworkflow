/**
 * Stripe Data Integration Provider
 *
 * Connects to the user's OWN Stripe account (where they collect payments)
 * via Stripe Connect OAuth (Standard). Separate from FixWorkFlow's payment Stripe.
 */

import Stripe from "stripe";
import type { Integration } from "@/generated/prisma/client";
import { registerProvider } from "../registry";
import type { IntegrationProvider, OAuthResult, PulledData, PillarMetrics } from "../types";

const STRIPE_CONNECT_CLIENT_ID = process.env.STRIPE_CONNECT_CLIENT_ID || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

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

const stripeDataProvider: IntegrationProvider = {
  id: "stripe-data",
  name: "Stripe",
  icon: "stripe.com",
  description: "Sync payment data, MRR, fees, and customer growth from your Stripe account.",
  requiredScopes: ["read_only"],
  pillarsAffected: ["revenue", "profitability", "retention"],

  getAuthUrl(userId: string): string {
    const state = buildStateToken(userId);
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/stripe-data/callback`;

    return `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${STRIPE_CONNECT_CLIENT_ID}&scope=read_only&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  },

  async handleCallback(code: string, _userId: string): Promise<OAuthResult> {
    const res = await fetch("https://connect.stripe.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_secret: STRIPE_SECRET_KEY,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stripe Connect token exchange failed: ${text}`);
    }

    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      externalId: data.stripe_user_id,
      scopes: data.scope,
    };
  },

  async refreshAccessToken(integration: Integration) {
    if (!integration.refreshToken) throw new Error("No refresh token");

    const res = await fetch("https://connect.stripe.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: integration.refreshToken,
        client_secret: STRIPE_SECRET_KEY,
      }),
    });

    if (!res.ok) throw new Error("Failed to refresh Stripe token");
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  },

  async pullData(integration: Integration): Promise<PulledData> {
    const stripe = new Stripe(integration.accessToken, {
      // @ts-expect-error stripe version mismatch
      apiVersion: "2024-06-20",
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const gte = Math.floor(sevenDaysAgo.getTime() / 1000);

    // Pull balance transactions
    let grossRevenue = 0;
    let totalFees = 0;
    let netRevenue = 0;
    let refundAmount = 0;
    let refundCount = 0;

    const txns = await stripe.balanceTransactions.list({
      created: { gte },
      limit: 100,
    }) as unknown as Stripe.ApiList<Stripe.BalanceTransaction>;

    for (const txn of txns.data) {
      if (txn.type === "charge") {
        grossRevenue += txn.amount / 100;
        totalFees += txn.fee / 100;
        netRevenue += txn.net / 100;
      } else if (txn.type === "refund") {
        refundAmount += Math.abs(txn.amount) / 100;
        refundCount++;
      }
    }

    // Pull charges for customer data
    const charges = await stripe.charges.list({
      created: { gte },
      limit: 100,
    }) as unknown as Stripe.ApiList<Stripe.Charge>;

    const successfulCharges = charges.data.filter((c) => c.status === "succeeded");
    const chargeCount = successfulCharges.length;
    const avgChargeAmount = chargeCount > 0 ? grossRevenue / chargeCount : 0;

    // Track unique customers from charges
    const customerIds = new Set<string>();
    for (const charge of successfulCharges) {
      if (charge.customer) {
        customerIds.add(typeof charge.customer === "string" ? charge.customer : charge.customer.toString());
      }
    }

    // Pull new customers
    const newCustomersResp = await stripe.customers.list({
      created: { gte },
      limit: 100,
    }) as unknown as Stripe.ApiList<Stripe.Customer>;
    const newCustomerCount = newCustomersResp.data.length;

    // Pull subscriptions for MRR and churn
    let mrr = 0;
    let activeSubCount = 0;
    let cancelledSubCount = 0;
    let churnRate: number | undefined;

    try {
      const activeSubs = await stripe.subscriptions.list({
        status: "active",
        limit: 100,
      }) as unknown as Stripe.ApiList<Stripe.Subscription>;
      activeSubCount = activeSubs.data.length;

      for (const sub of activeSubs.data) {
        const items = sub.items?.data || [];
        for (const item of items) {
          const price = item.price;
          if (price?.unit_amount && price?.recurring?.interval) {
            let monthly = price.unit_amount / 100;
            if (price.recurring.interval === "year") monthly /= 12;
            else if (price.recurring.interval === "week") monthly *= 4.33;
            mrr += monthly * (item.quantity || 1);
          }
        }
      }

      // Cancelled in last 7 days
      const cancelledSubs = await stripe.subscriptions.list({
        status: "canceled",
        limit: 100,
      }) as unknown as Stripe.ApiList<Stripe.Subscription>;

      cancelledSubCount = cancelledSubs.data.filter((s) => {
        const cancelledAt = (s as any).canceled_at;
        return cancelledAt && cancelledAt >= gte;
      }).length;

      const totalRelevant = activeSubCount + cancelledSubCount;
      if (totalRelevant > 0) {
        churnRate = (cancelledSubCount / totalRelevant) * 100;
      }
    } catch {
      // Subscriptions might not be used
    }

    const grossMargin = grossRevenue > 0
      ? ((grossRevenue - totalFees - refundAmount) / grossRevenue) * 100
      : undefined;

    return {
      provider: "stripe-data",
      pulledAt: now,
      periodStart: sevenDaysAgo,
      periodEnd: now,
      raw: {
        transactions: txns.data.length,
        charges: chargeCount,
        newCustomers: newCustomerCount,
        activeSubscriptions: activeSubCount,
      },
      metrics: {
        totalRevenue: grossRevenue,
        orderCount: chargeCount,
        averageOrderValue: avgChargeAmount,
        recurringRevenue: mrr,
        grossRevenue,
        fees: totalFees,
        refunds: refundAmount,
        netRevenue,
        grossMargin,
        newCustomers: newCustomerCount,
        activeCustomers: customerIds.size,
        churnRate,
        cancelledSubscriptions: cancelledSubCount,
        refundRate: chargeCount > 0 ? (refundCount / chargeCount) * 100 : 0,
      },
    };
  },

  mapToPillars(data: PulledData, _currentProfile: any): PillarMetrics {
    const m = data.metrics;
    const changes: string[] = [];

    // Revenue
    let revenueResult;
    if (m.grossRevenue !== undefined) {
      const monthly = m.grossRevenue * (30 / 7);
      changes.push(`Revenue: ~$${Math.round(monthly).toLocaleString()}/mo from Stripe charges`);

      let score = 30;
      if (monthly >= 50000) score = 90;
      else if (monthly >= 15000) score = 75;
      else if (monthly >= 5000) score = 60;
      else if (monthly >= 1000) score = 40;

      revenueResult = {
        score,
        metrics: {
          monthlyRevenue: monthly,
          weeklyRevenue: m.grossRevenue,
          mrr: m.recurringRevenue,
          avgTransaction: m.averageOrderValue,
        },
        changes: [changes[changes.length - 1]],
      };

      if (m.recurringRevenue && m.recurringRevenue > 0) {
        changes.push(`MRR: $${Math.round(m.recurringRevenue).toLocaleString()}`);
      }
    }

    // Profitability
    let profitabilityResult;
    if (m.grossMargin !== undefined) {
      changes.push(`Stripe margin: ${m.grossMargin.toFixed(1)}% (after fees & refunds)`);
      profitabilityResult = {
        score: m.grossMargin >= 70 ? 90 : m.grossMargin >= 50 ? 70 : m.grossMargin >= 30 ? 50 : 25,
        metrics: { grossMargin: m.grossMargin, fees: m.fees, refunds: m.refunds, netRevenue: m.netRevenue },
        changes: [changes[changes.length - 1]],
      };
    }

    // Retention
    let retentionResult;
    if (m.churnRate !== undefined) {
      changes.push(`Churn rate: ${m.churnRate.toFixed(1)}% (${m.cancelledSubscriptions} cancelled this week)`);
      retentionResult = {
        score: m.churnRate <= 2 ? 90 : m.churnRate <= 5 ? 70 : m.churnRate <= 10 ? 45 : 15,
        metrics: { churnRate: m.churnRate, activeCustomers: m.activeCustomers, cancelledSubscriptions: m.cancelledSubscriptions },
        changes: [changes[changes.length - 1]],
      };
    }

    return {
      revenue: revenueResult,
      profitability: profitabilityResult,
      retention: retentionResult,
    };
  },

  async disconnect(integration: Integration): Promise<void> {
    // Deauthorize the connected account
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY, {
        // @ts-expect-error stripe version mismatch
        apiVersion: "2024-06-20",
      });
      if (integration.externalId) {
        await (stripe as any).oauth.deauthorize({
          client_id: STRIPE_CONNECT_CLIENT_ID,
          stripe_user_id: integration.externalId,
        });
      }
    } catch {
      // Best effort — token may already be invalid
    }
  },
};

// Register on import
registerProvider(stripeDataProvider);

export { stripeDataProvider };
