"use client";

const SOURCE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  shopify: { label: "Shopify", bg: "rgba(149,191,71,0.10)", color: "#5e8e3e" },
  "stripe-data": { label: "Stripe", bg: "rgba(99,91,255,0.08)", color: "#635bff" },
  stripe: { label: "Stripe", bg: "rgba(99,91,255,0.08)", color: "#635bff" },
  quickbooks: { label: "QuickBooks", bg: "rgba(44,160,28,0.08)", color: "#2ca01c" },
  "google-analytics": { label: "GA4", bg: "rgba(227,116,0,0.08)", color: "#e37400" },
  tracker: { label: "Manual", bg: "rgba(67,97,238,0.08)", color: "#4361ee" },
};

const DEFAULT_CONFIG = { bg: "rgba(141,149,163,0.08)", color: "#8d95a3" };

export default function SourceBadge({ source }: { source: string }) {
  const cfg = SOURCE_CONFIG[source] ?? DEFAULT_CONFIG;
  const label = SOURCE_CONFIG[source]?.label ?? source;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: 6,
      fontSize: 10, fontWeight: 600,
      background: cfg.bg, color: cfg.color, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}
