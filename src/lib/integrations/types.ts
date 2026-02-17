/**
 * Universal Integration Framework — Type Definitions
 */

import type { Integration } from "@/generated/prisma/client";

// ── Provider Interface ──

export interface IntegrationProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiredScopes: string[];
  pillarsAffected: string[];

  getAuthUrl(userId: string, redirectUri: string, extra?: Record<string, string>): string;
  handleCallback(
    code: string,
    userId: string,
    extra?: Record<string, string>,
  ): Promise<OAuthResult>;
  refreshAccessToken?(
    integration: Integration,
  ): Promise<{ accessToken: string; refreshToken?: string; tokenExpiresAt?: Date }>;
  pullData(integration: Integration): Promise<PulledData>;
  mapToPillars(data: PulledData, currentProfile: any): PillarMetrics;
  disconnect(integration: Integration): Promise<void>;
}

export interface OAuthResult {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  externalId?: string;
  storeDomain?: string;
  scopes?: string;
  metadata?: any;
}

// ── Pulled Data ──

export interface PulledData {
  provider: string;
  pulledAt: Date;
  periodStart: Date;
  periodEnd: Date;
  raw: any;
  metrics: PulledMetrics;
}

export interface PulledMetrics {
  // Revenue
  totalRevenue?: number;
  orderCount?: number;
  averageOrderValue?: number;
  recurringRevenue?: number;

  // Profitability
  grossRevenue?: number;
  fees?: number;
  refunds?: number;
  netRevenue?: number;
  grossMargin?: number;

  // Retention
  repeatCustomerRate?: number;
  churnRate?: number;
  customerLifetimeValue?: number;
  activeCustomers?: number;
  cancelledSubscriptions?: number;

  // Acquisition
  newCustomers?: number;
  conversionRate?: number;
  sessions?: number;
  topChannels?: { name: string; sessions: number; conversions: number }[];

  // Operations
  fulfillmentTime?: number;
  refundRate?: number;
  pendingOrders?: number;
  overdueInvoices?: number;
}

// ── Pillar Metrics ──

export interface PillarMetricResult {
  score: number;
  metrics: any;
  changes: string[];
}

export interface PillarMetrics {
  revenue?: PillarMetricResult;
  profitability?: PillarMetricResult;
  retention?: PillarMetricResult;
  acquisition?: PillarMetricResult;
  operations?: PillarMetricResult;
}

// ── Sync Result ──

export interface SyncResult {
  integrationId: string;
  provider: string;
  status: "success" | "partial" | "failed";
  metricsUpdated: Record<string, boolean>;
  pillarImpact: Record<string, number>;
  changes: string[];
  error?: string;
  duration: number;
}

// ── Provider Catalog Entry (for UI) ──

export interface ProviderCatalogEntry {
  id: string;
  name: string;
  icon: string;
  description: string;
  pillarsAffected: string[];
  status: "active" | "coming_soon";
  scopesPlainEnglish: string[];
}
