/**
 * Integration Provider Registry
 *
 * Maps provider IDs to their implementations.
 */

import type { IntegrationProvider, ProviderCatalogEntry } from "./types";

const registry: Record<string, IntegrationProvider> = {};

export function registerProvider(provider: IntegrationProvider) {
  registry[provider.id] = provider;
}

export function getProvider(id: string): IntegrationProvider | undefined {
  return registry[id];
}

export function getAllProviders(): IntegrationProvider[] {
  return Object.values(registry);
}

// ── Provider Catalog (includes coming soon) ──

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "shopify",
    name: "Shopify",
    icon: "cdn.shopify.com",
    description: "Sync revenue, orders, customers, and conversion data.",
    pillarsAffected: ["revenue", "profitability", "retention", "acquisition"],
    status: "active",
    scopesPlainEnglish: [
      "Read your orders and revenue data",
      "Read customer information (repeat rates, new customers)",
      "Read store analytics (traffic, conversion)",
    ],
  },
  {
    id: "stripe-data",
    name: "Stripe",
    icon: "stripe.com",
    description: "Sync payment data, MRR, fees, and customer growth.",
    pillarsAffected: ["revenue", "profitability", "retention"],
    status: "active",
    scopesPlainEnglish: [
      "Read your charges and payment data",
      "Read subscription and MRR data",
      "Read customer information",
    ],
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    icon: "quickbooks.intuit.com",
    description: "Sync accounting data, margins, expenses, and invoices.",
    pillarsAffected: ["profitability", "operations"],
    status: "coming_soon",
    scopesPlainEnglish: [
      "Read income and expense reports",
      "Read invoice and payment data",
    ],
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    icon: "analytics.google.com",
    description: "Sync traffic, conversion rates, and acquisition channels.",
    pillarsAffected: ["acquisition", "revenue"],
    status: "active",
    scopesPlainEnglish: [
      "Read traffic and session data",
      "Read conversion and goal data",
      "Read acquisition channel breakdowns",
    ],
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    icon: "mailchimp.com",
    description: "Sync email performance, list growth, and campaign revenue.",
    pillarsAffected: ["acquisition", "retention"],
    status: "coming_soon",
    scopesPlainEnglish: [
      "Read email campaign performance",
      "Read subscriber list data",
    ],
  },
];
