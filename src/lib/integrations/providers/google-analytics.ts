/**
 * Google Analytics Integration Provider
 *
 * Connects to the user's GA4 property via Google OAuth.
 * Pulls traffic, conversion, and acquisition channel data.
 */

import type { Integration } from "@/generated/prisma/client";
import { registerProvider } from "../registry";
import type { IntegrationProvider, OAuthResult, PulledData, PillarMetrics } from "../types";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

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

const googleAnalyticsProvider: IntegrationProvider = {
  id: "google-analytics",
  name: "Google Analytics",
  icon: "analytics.google.com",
  description: "Sync traffic, conversion rates, and acquisition channels.",
  requiredScopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  pillarsAffected: ["acquisition", "revenue"],

  getAuthUrl(userId: string): string {
    const state = buildStateToken(userId);
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-analytics/callback`;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async handleCallback(code: string, _userId: string): Promise<OAuthResult> {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-analytics/callback`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google token exchange failed: ${text}`);
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: expiresAt,
      scopes: "analytics.readonly",
    };
  },

  async refreshAccessToken(integration: Integration) {
    if (!integration.refreshToken) throw new Error("No refresh token");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: integration.refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
      }),
    });

    if (!res.ok) throw new Error("Failed to refresh Google token");
    const data = await res.json();

    return {
      accessToken: data.access_token,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  },

  async pullData(integration: Integration): Promise<PulledData> {
    const propertyId = integration.externalId;
    if (!propertyId) throw new Error("No GA4 property selected");

    const token = integration.accessToken;
    const baseUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const eightyFourDaysAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    async function runReport(body: object) {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GA4 report failed: ${text}`);
      }
      return res.json();
    }

    // 1. Traffic overview (30 days)
    const trafficReport = await runReport({
      dateRanges: [{ startDate: fmt(thirtyDaysAgo), endDate: fmt(now) }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    });

    // 2. Conversions (30 days)
    const conversionReport = await runReport({
      dateRanges: [{ startDate: fmt(thirtyDaysAgo), endDate: fmt(now) }],
      metrics: [
        { name: "conversions" },
        { name: "userConversionRate" },
      ],
    });

    // 3. Acquisition channels (30 days)
    const channelReport = await runReport({
      dateRanges: [{ startDate: fmt(thirtyDaysAgo), endDate: fmt(now) }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      limit: 10,
    });

    // 4. Weekly traffic trend (84 days)
    const trendReport = await runReport({
      dateRanges: [{ startDate: fmt(eightyFourDaysAgo), endDate: fmt(now) }],
      dimensions: [{ name: "week" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
      ],
    });

    // Parse traffic overview
    const trafficRow = trafficReport.rows?.[0]?.metricValues || [];
    const sessions = parseInt(trafficRow[0]?.value || "0", 10);
    const totalUsers = parseInt(trafficRow[1]?.value || "0", 10);
    const newUsers = parseInt(trafficRow[2]?.value || "0", 10);
    const bounceRate = parseFloat(trafficRow[3]?.value || "0");
    const avgSessionDuration = parseFloat(trafficRow[4]?.value || "0");

    // Parse conversions
    const convRow = conversionReport.rows?.[0]?.metricValues || [];
    const conversions = parseInt(convRow[0]?.value || "0", 10);
    const conversionRate = parseFloat(convRow[1]?.value || "0") * 100; // API returns 0-1, convert to %

    // Parse channels
    const topChannels = (channelReport.rows || []).map((row: any) => ({
      name: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0", 10),
      conversions: parseInt(row.metricValues?.[2]?.value || "0", 10),
    }));

    // Parse weekly trend
    const weeklyTrend = (trendReport.rows || []).map((row: any) => ({
      week: row.dimensionValues?.[0]?.value || "",
      sessions: parseInt(row.metricValues?.[0]?.value || "0", 10),
      users: parseInt(row.metricValues?.[1]?.value || "0", 10),
    }));

    return {
      provider: "google-analytics",
      pulledAt: now,
      periodStart: thirtyDaysAgo,
      periodEnd: now,
      raw: {
        sessions,
        totalUsers,
        newUsers,
        bounceRate,
        avgSessionDuration,
        conversions,
        conversionRate,
        topChannels,
        weeklyTrend,
      },
      metrics: {
        sessions,
        conversionRate,
        newCustomers: newUsers,
        topChannels,
      },
    };
  },

  mapToPillars(data: PulledData, _currentProfile: any): PillarMetrics {
    const m = data.metrics;
    const raw = data.raw;
    const changes: string[] = [];

    // Acquisition pillar
    let acquisitionResult;
    if (m.sessions !== undefined) {
      const monthly = m.sessions; // already 30 days of data
      changes.push(`Traffic: ${monthly.toLocaleString()} sessions/month from GA`);

      // Traffic scoring tiers (match engine.ts)
      let trafficScore = 30;
      if (monthly >= 50000) trafficScore = 90;
      else if (monthly >= 10000) trafficScore = 70;
      else if (monthly >= 2000) trafficScore = 50;

      // Boost for conversion rate
      let convBoost = 0;
      if (m.conversionRate !== undefined) {
        if (m.conversionRate >= 5) convBoost = 15;
        else if (m.conversionRate >= 3) convBoost = 10;
        else if (m.conversionRate >= 1) convBoost = 5;
        changes.push(`Conversion rate: ${m.conversionRate.toFixed(1)}%`);
      }

      // Channel diversification bonus
      let channelBonus = 0;
      if (m.topChannels && m.topChannels.length >= 3) {
        const totalSessions = m.topChannels.reduce((s, c) => s + c.sessions, 0);
        const topShare = totalSessions > 0 ? (m.topChannels[0].sessions / totalSessions) : 1;
        if (topShare < 0.5) channelBonus = 10;
        else if (topShare < 0.7) channelBonus = 5;
        changes.push(`${m.topChannels.length} acquisition channels (top: ${m.topChannels[0]?.name})`);
      }

      const score = Math.min(100, trafficScore + convBoost + channelBonus);

      acquisitionResult = {
        score,
        metrics: {
          monthlySessions: monthly,
          conversionRate: m.conversionRate,
          newUsers: m.newCustomers,
          topChannels: m.topChannels?.slice(0, 5),
          bounceRate: raw.bounceRate,
        },
        changes: [...changes],
      };
    }

    // Revenue pillar — traffic trend feeds into revenue growth signal
    let revenueResult;
    if (raw.weeklyTrend && raw.weeklyTrend.length >= 4) {
      const weeks = raw.weeklyTrend;
      const recent = weeks.slice(-4);
      const earlier = weeks.slice(0, -4);

      const recentAvg = recent.reduce((s: number, w: any) => s + w.sessions, 0) / recent.length;
      const earlierAvg = earlier.length > 0
        ? earlier.reduce((s: number, w: any) => s + w.sessions, 0) / earlier.length
        : recentAvg;

      const growthPct = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

      let trendScore = 50;
      if (growthPct >= 20) trendScore = 85;
      else if (growthPct >= 5) trendScore = 70;
      else if (growthPct >= 0) trendScore = 55;
      else if (growthPct >= -10) trendScore = 40;
      else trendScore = 25;

      const trendLabel = growthPct >= 0 ? `+${growthPct.toFixed(1)}%` : `${growthPct.toFixed(1)}%`;
      changes.push(`Traffic trend: ${trendLabel} (12-week comparison)`);

      revenueResult = {
        score: trendScore,
        metrics: {
          trafficGrowthPct: growthPct,
          recentWeeklyAvg: recentAvg,
          earlierWeeklyAvg: earlierAvg,
        },
        changes: [`Traffic trend: ${trendLabel} (12-week comparison)`],
      };
    }

    return {
      acquisition: acquisitionResult,
      revenue: revenueResult,
    };
  },

  async disconnect(integration: Integration): Promise<void> {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${integration.accessToken}`,
        { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } },
      );
    } catch {
      // Best effort — token may already be invalid
    }
  },
};

// Register on import
registerProvider(googleAnalyticsProvider);

export { googleAnalyticsProvider };
