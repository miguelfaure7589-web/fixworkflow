"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { WeeklyLogEntry, MonthlySummary } from "./types";

// ── Helpers ──

function fmtDollar(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

// ── Summary Card ──

function SummaryCard({
  label,
  value,
  sub,
  valueColor = "#1b2434",
  bgTint,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  bgTint?: string;
}) {
  return (
    <div style={{
      background: bgTint || "#fff",
      border: "1px solid #f0f2f6",
      borderRadius: 12,
      padding: "14px 16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: valueColor, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#b4bac5", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Custom Tooltip ──

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div style={{
      background: "#1b2434",
      color: "#fff",
      padding: "6px 12px",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 700,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    }}>
      <div>{fmtDollar(payload[0].value)}</div>
      <div style={{ fontSize: 10, fontWeight: 500, color: "#b4bac5", marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Main Component ──

export default function RevenueOverview({
  weeklyLogs,
  monthly,
  monthlyTarget,
  isMobile,
}: {
  weeklyLogs: WeeklyLogEntry[];
  monthly: MonthlySummary;
  monthlyTarget: number | null;
  isMobile: boolean;
}) {
  const [range, setRange] = useState(8);
  const rangePills = [4, 8, 12] as const;

  const sorted = [...weeklyLogs]
    .sort((a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime())
    .slice(-range);

  const chartData = sorted.map((d) => ({
    name: fmtDate(d.weekOf),
    revenue: d.revenue,
  }));

  const weeklyTargetLine = monthlyTarget ? monthlyTarget / 4.33 : null;
  const tooFew = chartData.length < 2;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Chart card */}
      <div style={{
        background: "#fff",
        border: "1px solid #f0f2f6",
        borderRadius: 12,
        padding: isMobile ? 12 : 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        marginBottom: 16,
      }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Revenue Trend
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {rangePills.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: "3px 10px",
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor: range === r ? "#4361ee" : "#e6e9ef",
                  background: range === r ? "rgba(67,97,238,0.06)" : "#fff",
                  color: range === r ? "#4361ee" : "#8d95a3",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {r}w
              </button>
            ))}
          </div>
        </div>

        {tooFew ? (
          <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <BarChart3 size={28} style={{ color: "#d1d5db" }} />
            <span style={{ fontSize: 13, color: "#8d95a3" }}>Log a few more weeks to see your trend line.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="ccAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4361ee" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#4361ee" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#8d95a3" }}
                tickLine={false}
                axisLine={{ stroke: "#f0f2f6" }}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `$${v}`
                }
                tick={{ fontSize: 10, fill: "#b4bac5" }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e6e9ef" }} />
              {weeklyTargetLine != null && (
                <ReferenceLine
                  y={weeklyTargetLine}
                  stroke="#b4bac5"
                  strokeDasharray="6 4"
                  label={{ value: "Target", position: "right", fontSize: 9, fill: "#b4bac5" }}
                />
              )}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4361ee"
                strokeWidth={2.5}
                fill="url(#ccAreaGrad)"
                dot={{ r: 3.5, fill: "#fff", stroke: "#4361ee", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#4361ee", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: 12,
      }}>
        <SummaryCard
          label="This Month"
          value={fmtDollar(Math.round(monthly.thisMonthRevenue))}
          sub={`${monthly.weeksLogged} week${monthly.weeksLogged !== 1 ? "s" : ""} logged`}
        />
        <SummaryCard
          label="vs Target"
          value={monthly.targetPct != null ? `${monthly.targetPct}%` : "\u2014"}
          sub={monthly.monthlyTarget ? `of ${fmtDollar(Math.round(monthly.monthlyTarget))}` : "No target set"}
          valueColor={
            monthly.targetPct == null ? "#8d95a3"
              : monthly.targetPct >= 80 ? "#10b981"
              : monthly.targetPct >= 50 ? "#f59e0b"
              : "#ef4444"
          }
          bgTint={
            monthly.targetPct == null ? undefined
              : monthly.targetPct >= 80 ? "rgba(16,185,129,0.04)"
              : monthly.targetPct >= 50 ? "rgba(245,158,11,0.04)"
              : "rgba(239,68,68,0.04)"
          }
        />
        <SummaryCard
          label="Avg Weekly"
          value={monthly.avgWeeklyRevenue > 0 ? fmtDollar(Math.round(monthly.avgWeeklyRevenue)) : "\u2014"}
          sub={monthly.weeksLogged > 0 ? `across ${monthly.weeksLogged} week${monthly.weeksLogged !== 1 ? "s" : ""}` : ""}
        />
        <SummaryCard
          label="Trend"
          value={monthly.trend === "up" ? "Up" : monthly.trend === "down" ? "Down" : "\u2014"}
          sub={monthly.trend ? "vs last month" : "Need more data"}
          valueColor={monthly.trend === "up" ? "#10b981" : monthly.trend === "down" ? "#ef4444" : "#8d95a3"}
        />
      </div>
    </div>
  );
}
