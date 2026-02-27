"use client";

import type { WeeklyComparisonRow } from "./types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function fmtDollar(n: number | null): string {
  if (n == null) return "\u2014";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function DeltaCell({ value, format = "dollar" }: { value: number | null; format?: "dollar" | "number" }) {
  if (value == null || value === 0) return <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
  const isUp = value > 0;
  const formatted = format === "dollar"
    ? (isUp ? "+" : "") + "$" + Math.abs(Math.round(value)).toLocaleString("en-US")
    : (isUp ? "+" : "") + value;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      color: isUp ? "#10b981" : "#ef4444",
    }}>
      {formatted}
    </span>
  );
}

export default function WeeklyComparison({
  rows,
  isMobile,
}: {
  rows: WeeklyComparisonRow[];
  isMobile: boolean;
}) {
  if (rows.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
        Weekly Comparison
      </div>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12,
        overflow: "hidden", boxShadow: "var(--shadow-card)",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 12 : 13, minWidth: isMobile ? 500 : "auto" }}>
            <thead>
              <tr>
                {["Week", "Revenue", "\u0394", "Orders", "\u0394", "Expenses", "Profit", "Margin"].map((h, i) => (
                  <th key={i} style={{
                    textAlign: "left", padding: isMobile ? "8px 6px" : "10px 12px", fontSize: 10, fontWeight: 700,
                    color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
                    borderBottom: "2px solid var(--border-light)", whiteSpace: "nowrap",
                    ...(i === 0 ? { position: "sticky" as const, left: 0, zIndex: 1, background: "var(--bg-card)", boxShadow: "2px 0 4px rgba(0,0,0,0.04)" } : {}),
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.weekOf} style={{
                  background: i === 0 ? "rgba(67,97,238,0.02)" : "transparent",
                  borderLeft: i === 0 ? "3px solid #4361ee" : "3px solid transparent",
                }}>
                  <td style={{
                    padding: isMobile ? "8px 6px" : "10px 12px", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap",
                    position: "sticky", left: 0, zIndex: 1,
                    background: i === 0 ? "rgba(67,97,238,0.02)" : "var(--bg-card)",
                    boxShadow: "2px 0 4px rgba(0,0,0,0.04)",
                  }}>
                    {fmtDate(row.weekOf)}
                    {i === 0 && (
                      <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: "#4361ee", background: "rgba(67,97,238,0.08)", padding: "1px 5px", borderRadius: 3 }}>
                        LATEST
                      </span>
                    )}
                  </td>
                  <td style={{ padding: isMobile ? "8px 6px" : "10px 12px", fontWeight: 700, color: "var(--text-primary)" }}>{fmtDollar(row.revenue)}</td>
                  <td style={{ padding: isMobile ? "8px 6px" : "10px 12px" }}><DeltaCell value={row.revenueDelta} /></td>
                  <td style={{ padding: isMobile ? "8px 6px" : "10px 12px", color: "var(--text-secondary)" }}>{row.orders ?? "\u2014"}</td>
                  <td style={{ padding: isMobile ? "8px 6px" : "10px 12px" }}><DeltaCell value={row.ordersDelta} format="number" /></td>
                  <td style={{ padding: isMobile ? "8px 6px" : "10px 12px", color: "var(--text-secondary)" }}>{fmtDollar(row.expenses)}</td>
                  <td style={{ padding: isMobile ? "8px 6px" : "10px 12px", fontWeight: 600, color: row.profit != null ? (row.profit >= 0 ? "#10b981" : "#ef4444") : "var(--text-faint)" }}>
                    {fmtDollar(row.profit)}
                  </td>
                  <td style={{ padding: isMobile ? "8px 6px" : "10px 12px" }}>
                    {row.margin != null ? (
                      <span style={{
                        display: "inline-flex", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: row.margin >= 40 ? "rgba(16,185,129,0.08)" : row.margin >= 20 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                        color: row.margin >= 40 ? "#10b981" : row.margin >= 20 ? "#f59e0b" : "#ef4444",
                      }}>
                        {row.margin.toFixed(1)}%
                      </span>
                    ) : <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
