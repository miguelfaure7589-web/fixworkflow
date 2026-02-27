"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import SourceBadge from "./SourceBadge";
import type { IntegrationStream } from "./types";

const PROVIDER_CONFIG: Record<string, {
  label: string;
  color: string;
  metricLabels: Record<string, string>;
  metricFormat: Record<string, "dollar" | "pct" | "number">;
}> = {
  shopify: {
    label: "Shopify",
    color: "#95bf47",
    metricLabels: { orders: "Orders", revenue: "Revenue (7d)", aov: "AOV", newCustomers: "New Customers" },
    metricFormat: { orders: "number", revenue: "dollar", aov: "dollar", newCustomers: "number" },
  },
  "google-analytics": {
    label: "Google Analytics",
    color: "#e37400",
    metricLabels: { sessions: "Sessions", conversionRate: "Conv. Rate", newUsers: "New Users", bounceRate: "Bounce Rate" },
    metricFormat: { sessions: "number", conversionRate: "pct", newUsers: "number", bounceRate: "pct" },
  },
  quickbooks: {
    label: "QuickBooks",
    color: "#2ca01c",
    metricLabels: { totalIncome: "Income", totalExpenses: "Expenses", netIncome: "Net Income", overdueCount: "Overdue" },
    metricFormat: { totalIncome: "dollar", totalExpenses: "dollar", netIncome: "dollar", overdueCount: "number" },
  },
  "stripe-data": {
    label: "Stripe",
    color: "#635bff",
    metricLabels: { revenue: "Revenue (7d)", fees: "Fees", mrr: "MRR", activeCustomers: "Active Customers" },
    metricFormat: { revenue: "dollar", fees: "dollar", mrr: "dollar", activeCustomers: "number" },
  },
};

function fmtVal(value: number | string | null, format: "dollar" | "pct" | "number"): string {
  if (value == null) return "\u2014";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "\u2014";
  if (format === "dollar") return "$" + Math.round(n).toLocaleString("en-US");
  if (format === "pct") return n.toFixed(1) + "%";
  return Math.round(n).toLocaleString("en-US");
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const h = 28;
  const w = 80;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Never synced";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function IntegrationStreams({
  streams,
  isMobile,
  isTablet,
  onSync,
}: {
  streams: IntegrationStream[];
  isMobile: boolean;
  isTablet: boolean;
  onSync: (integrationId: string) => void;
}) {
  const [syncingId, setSyncingId] = useState<string | null>(null);

  if (streams.length === 0) return null;

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      onSync(id);
    } finally {
      // The parent will refresh; we clear after a delay
      setTimeout(() => setSyncingId(null), 3000);
    }
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
        Integration Data Streams
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile || isTablet ? "1fr" : "repeat(2, 1fr)",
        gap: 12,
      }}>
        {streams.map((stream) => {
          const cfg = PROVIDER_CONFIG[stream.provider];
          if (!cfg) return null;
          const isSyncing = syncingId === stream.id || stream.status === "syncing";

          return (
            <div key={stream.id} style={{
              background: "#fff", border: "1px solid #f0f2f6", borderRadius: 12,
              padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SourceBadge source={stream.provider} />
                  <span style={{ fontSize: 11, color: "#b4bac5" }}>{timeAgo(stream.lastSyncAt)}</span>
                  {stream.status === "error" && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#ef4444", background: "rgba(239,68,68,0.08)", padding: "1px 6px", borderRadius: 4 }}>Error</span>
                  )}
                </div>
                <button
                  onClick={() => handleSync(stream.id)}
                  disabled={isSyncing}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 6, border: "1px solid #e6e9ef",
                    background: "#fff", cursor: isSyncing ? "not-allowed" : "pointer",
                    fontSize: 11, fontWeight: 600, color: "#4361ee",
                  }}
                >
                  {isSyncing ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={12} />}
                  {isSyncing ? "Syncing…" : "Sync"}
                </button>
              </div>

              {/* Metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                {Object.entries(cfg.metricLabels).map(([key, label]) => (
                  <div key={key}>
                    <div style={{ fontSize: 10, color: "#8d95a3", fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1b2434", marginTop: 1 }}>
                      {fmtVal(stream.metrics[key], cfg.metricFormat[key])}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sparkline */}
              {stream.sparkline.length >= 2 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <MiniSparkline data={stream.sparkline} color={cfg.color} />
                  <span style={{ fontSize: 10, color: "#b4bac5" }}>8-week score trend</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
