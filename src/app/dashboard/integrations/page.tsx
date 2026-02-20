"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Zap } from "lucide-react";

// ── Pillar colors ──
const PILLAR_COLORS: Record<string, { bg: string; text: string }> = {
  Revenue: { bg: "rgba(67,97,238,0.08)", text: "#4361ee" },
  Profitability: { bg: "rgba(16,185,129,0.08)", text: "#10b981" },
  Retention: { bg: "rgba(249,115,22,0.08)", text: "#f97316" },
  Acquisition: { bg: "rgba(139,92,246,0.08)", text: "#8b5cf6" },
  Operations: { bg: "rgba(107,114,128,0.08)", text: "#6b7280" },
};

// ── Integration data ──
interface Integration {
  name: string;
  brandColor: string;
  description: string;
  pillars: string[];
}

interface Category {
  name: string;
  emoji: string;
  integrations: Integration[];
}

const categories: Category[] = [
  {
    name: "Revenue & Payments",
    emoji: "\ud83d\udcb0",
    integrations: [
      { name: "Shopify", brandColor: "#96BF48", description: "Sync orders, revenue, repeat customers, and average order value.", pillars: ["Revenue", "Retention", "Acquisition"] },
      { name: "Stripe", brandColor: "#635BFF", description: "Sync payment data, MRR, churn rate, and revenue trends.", pillars: ["Revenue", "Profitability"] },
      { name: "Square", brandColor: "#000000", description: "Sync POS transactions, sales data, and customer purchase history.", pillars: ["Revenue", "Retention"] },
      { name: "PayPal", brandColor: "#003087", description: "Sync transaction history, payment volume, and revenue data.", pillars: ["Revenue"] },
      { name: "WooCommerce", brandColor: "#96588A", description: "Sync e-commerce orders, revenue, products, and customer data.", pillars: ["Revenue", "Retention"] },
    ],
  },
  {
    name: "Marketing & Acquisition",
    emoji: "\ud83d\udcca",
    integrations: [
      { name: "Google Analytics", brandColor: "#F9AB00", description: "Sync website traffic, conversion rates, and acquisition channels.", pillars: ["Acquisition", "Revenue"] },
      { name: "Meta Ads", brandColor: "#0668E1", description: "Sync ad spend, impressions, conversions, and cost per acquisition.", pillars: ["Acquisition"] },
      { name: "Google Ads", brandColor: "#4285F4", description: "Sync ad campaigns, spend, clicks, conversions, and ROAS.", pillars: ["Acquisition"] },
      { name: "Mailchimp", brandColor: "#FFE01B", description: "Sync email performance, list growth, open rates, and campaign revenue.", pillars: ["Acquisition", "Retention"] },
    ],
  },
  {
    name: "Accounting & Finance",
    emoji: "\ud83d\udcd2",
    integrations: [
      { name: "QuickBooks", brandColor: "#2CA01C", description: "Sync accounting data, profit & loss, margins, expenses, and invoices.", pillars: ["Profitability", "Operations"] },
      { name: "Xero", brandColor: "#13B5EA", description: "Sync financial reports, bank transactions, invoices, and cash flow.", pillars: ["Profitability", "Operations"] },
      { name: "Wave", brandColor: "#0764E6", description: "Sync income, expenses, invoicing, and financial reports.", pillars: ["Profitability", "Operations"] },
    ],
  },
  {
    name: "CRM & Operations",
    emoji: "\ud83e\udd1d",
    integrations: [
      { name: "HubSpot", brandColor: "#FF7A59", description: "Sync CRM contacts, deal pipeline, customer lifecycle, and leads.", pillars: ["Retention", "Acquisition"] },
      { name: "Calendly", brandColor: "#006BFF", description: "Sync booking data, appointment volume, and no-show rates.", pillars: ["Operations"] },
      { name: "Notion", brandColor: "#000000", description: "Sync project tracking, task completion, and team productivity.", pillars: ["Operations"] },
    ],
  },
];

const totalIntegrations = categories.reduce((sum, c) => sum + c.integrations.length, 0);

// ── Component ──
export default function IntegrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    categories.forEach((_, i) => { init[i] = true; });
    return init;
  });

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "3px solid #e6e9ef", borderTopColor: "#4361ee", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  const toggle = (idx: number) => setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#4361ee", fontSize: 13, fontWeight: 600 }}>
              <ChevronLeft size={16} />
              Dashboard
            </Link>
          </div>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #4361ee, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#1b2434" }}>FixWorkFlow</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1b2434", margin: "0 0 6px" }}>Integrations</h1>
          <p style={{ fontSize: 14, color: "#5a6578", margin: "0 0 12px", lineHeight: 1.6 }}>
            Connect your business tools for a more accurate Revenue Health Score. More connections = better insights.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "rgba(67,97,238,0.06)", fontSize: 13, fontWeight: 600, color: "#4361ee" }}>
            0 of {totalIntegrations} connected
          </div>
        </div>

        {/* Accordion sections */}
        {categories.map((cat, catIdx) => (
          <div key={catIdx} style={{ marginBottom: 16 }}>
            {/* Category header */}
            <button
              onClick={() => toggle(catIdx)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", background: "#fff", border: "1px solid #e6e9ef", borderRadius: expanded[catIdx] ? "14px 14px 0 0" : 14,
                cursor: "pointer", fontFamily: "inherit", transition: "border-radius 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#1b2434" }}>{cat.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#8d95a3", background: "#f4f5f8", padding: "2px 8px", borderRadius: 6 }}>
                  {cat.integrations.length}
                </span>
              </div>
              <ChevronDown
                size={18}
                color="#8d95a3"
                style={{ transition: "transform 0.25s ease", transform: expanded[catIdx] ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {/* Expanded content */}
            <div style={{
              maxHeight: expanded[catIdx] ? cat.integrations.length * 200 : 0,
              overflow: "hidden",
              transition: "max-height 0.35s ease",
              background: "#fff",
              borderLeft: "1px solid #e6e9ef",
              borderRight: "1px solid #e6e9ef",
              borderBottom: expanded[catIdx] ? "1px solid #e6e9ef" : "none",
              borderRadius: "0 0 14px 14px",
            }}>
              {cat.integrations.map((intg, intgIdx) => (
                <div
                  key={intgIdx}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 18px",
                    borderTop: intgIdx > 0 ? "1px solid #f0f0f0" : "none",
                  }}
                >
                  {/* Logo placeholder */}
                  <div style={{
                    width: 40, height: 40, minWidth: 40, borderRadius: 10,
                    background: intg.brandColor, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 800, color: intg.brandColor === "#000000" || intg.brandColor === "#003087" ? "#fff" : "#fff",
                    fontFamily: "inherit",
                  }}>
                    {intg.name[0]}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1b2434", marginBottom: 3 }}>{intg.name}</div>
                    <div style={{ fontSize: 12, color: "#5a6578", lineHeight: 1.5, marginBottom: 6 }}>{intg.description}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {intg.pillars.map((p) => {
                        const c = PILLAR_COLORS[p] || { bg: "#f4f5f8", text: "#6b7280" };
                        return (
                          <span key={p} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: c.bg, color: c.text }}>
                            {p}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Coming Soon button */}
                  <button
                    disabled
                    style={{
                      padding: "8px 16px", borderRadius: 8,
                      border: "1px solid #e6e9ef", background: "#f4f5f8",
                      color: "#8d95a3", fontSize: 12, fontWeight: 600,
                      cursor: "not-allowed", fontFamily: "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Coming Soon
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom note */}
        <div style={{ textAlign: "center", marginTop: 32, padding: "20px", background: "#fff", borderRadius: 14, border: "1px solid #e6e9ef" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1b2434", margin: "0 0 4px" }}>Want an integration we don&apos;t have?</p>
          <p style={{ fontSize: 13, color: "#8d95a3", margin: 0 }}>
            Let us know at{" "}
            <a href="mailto:support@fixworkflow.com" style={{ color: "#4361ee", textDecoration: "none", fontWeight: 600 }}>support@fixworkflow.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
