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
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import SourceBadge from "./SourceBadge";
import type { WeeklyLogEntry, MonthlySummary } from "./types";

function fmtDollar(n: number): string {
  if (n >= 1000) return "$" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtDollarFull(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div style={{
      background: "var(--tooltip-bg)", color: "var(--tooltip-text)", padding: "8px 14px", borderRadius: 8,
      fontSize: 12, fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    }}>
      <div style={{ fontSize: 16 }}>{fmtDollarFull(payload[0].value)}</div>
      <div style={{ fontSize: 10, fontWeight: 500, color: "var(--text-faint)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SummaryCard({ label, value, sub, valueColor = "var(--text-primary)", bgTint }: {
  label: string; value: string; sub?: string; valueColor?: string; bgTint?: string;
}) {
  return (
    <div style={{
      background: bgTint || "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12,
      padding: "14px 16px", boxShadow: "var(--shadow-card)",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: valueColor, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function RevenueOverview({
  weeklyLogs,
  monthly,
  monthlyTarget,
  totalRevenue,
  revenueSource,
  isMobile,
  isTablet,
}: {
  weeklyLogs: WeeklyLogEntry[];
  monthly: MonthlySummary;
  monthlyTarget: number | null;
  totalRevenue: number;
  revenueSource: string | null;
  isMobile: boolean;
  isTablet: boolean;
}) {
  const { isDark } = useTheme();
  const ranges = [
    { label: "4w", weeks: 4 },
    { label: "8w", weeks: 8 },
    { label: "12w", weeks: 12 },
  ] as const;
  const [rangeIdx, setRangeIdx] = useState(1);
  const range = ranges[rangeIdx].weeks;

  const sorted = [...weeklyLogs]
    .sort((a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime())
    .slice(-range);

  const chartData = sorted.map((d) => ({
    name: fmtDate(d.weekOf),
    revenue: d.revenue,
  }));

  const weeklyTargetLine = monthlyTarget ? monthlyTarget / 4.33 : null;
  const tooFew = chartData.length < 2;
  const vsLastMonth = monthly.lastMonthRevenue > 0
    ? ((monthly.thisMonthRevenue - monthly.lastMonthRevenue) / monthly.lastMonthRevenue * 100).toFixed(1)
    : null;
  const isUp = monthly.trend === "up";

  const tickColor = isDark ? "#9ca0b0" : "#8d95a3";
  const faintTickColor = isDark ? "#6b6f82" : "#b4bac5";
  const axisStroke = isDark ? "#252838" : "#f0f2f6";
  const cursorStroke = isDark ? "#303548" : "#e6e9ef";

  return (
    <div style={{ marginBottom: 28 }}>
      {/* ── Big Revenue Header ── */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 14,
        padding: isMobile ? "20px 16px" : "24px 28px",
        boxShadow: "var(--shadow-card)", marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Revenue Overview
          </div>
          {revenueSource && <SourceBadge source={revenueSource} />}
        </div>

        {/* Big number + delta */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: isMobile ? 32 : isTablet ? 36 : 44, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
            {fmtDollarFull(totalRevenue)}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>this month</span>
          {vsLastMonth && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: isUp ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              color: isUp ? "#10b981" : "#ef4444",
            }}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isUp ? "+" : ""}{vsLastMonth}% vs last month
            </span>
          )}
        </div>

        {/* Chart */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {ranges.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setRangeIdx(i)}
                  style={{
                    padding: "3px 10px", borderRadius: 6, border: "1px solid",
                    borderColor: rangeIdx === i ? "#4361ee" : "var(--border-default)",
                    background: rangeIdx === i ? "rgba(67,97,238,0.06)" : "var(--bg-card)",
                    color: rangeIdx === i ? "#4361ee" : "var(--text-muted)",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {tooFew ? (
            <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <BarChart3 size={28} style={{ color: "var(--text-faint)" }} />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Log a few more weeks to see your trend line.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="ccAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4361ee" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#4361ee" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={{ stroke: axisStroke }} />
                <YAxis
                  tickFormatter={(v: number) => fmtDollar(v)}
                  tick={{ fontSize: 10, fill: faintTickColor }} tickLine={false} axisLine={false} width={48}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: cursorStroke }} />
                {weeklyTargetLine != null && (
                  <ReferenceLine y={weeklyTargetLine} stroke={faintTickColor} strokeDasharray="6 4"
                    label={{ value: "Target", position: "right", fontSize: 9, fill: faintTickColor }} />
                )}
                <Area type="monotone" dataKey="revenue" stroke="#4361ee" strokeWidth={2.5} fill="url(#ccAreaGrad)"
                  dot={{ r: 3.5, fill: isDark ? "#1a1d28" : "#fff", stroke: "#4361ee", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "#4361ee", stroke: isDark ? "#1a1d28" : "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
        <SummaryCard
          label="This Month"
          value={fmtDollarFull(Math.round(monthly.thisMonthRevenue))}
          sub={`${monthly.weeksLogged} week${monthly.weeksLogged !== 1 ? "s" : ""} logged`}
        />
        <SummaryCard
          label="vs Target"
          value={monthly.targetPct != null ? `${monthly.targetPct}%` : "\u2014"}
          sub={monthly.monthlyTarget ? `of ${fmtDollarFull(Math.round(monthly.monthlyTarget))}` : "No target set"}
          valueColor={monthly.targetPct == null ? "var(--text-muted)" : monthly.targetPct >= 80 ? "#10b981" : monthly.targetPct >= 50 ? "#f59e0b" : "#ef4444"}
          bgTint={monthly.targetPct == null ? undefined : monthly.targetPct >= 80 ? "rgba(16,185,129,0.04)" : monthly.targetPct >= 50 ? "rgba(245,158,11,0.04)" : "rgba(239,68,68,0.04)"}
        />
        <SummaryCard
          label="Avg Weekly"
          value={monthly.avgWeeklyRevenue > 0 ? fmtDollarFull(Math.round(monthly.avgWeeklyRevenue)) : "\u2014"}
          sub={monthly.weeksLogged > 0 ? `across ${monthly.weeksLogged} week${monthly.weeksLogged !== 1 ? "s" : ""}` : ""}
        />
        <SummaryCard
          label="Last Month"
          value={monthly.lastMonthRevenue > 0 ? fmtDollarFull(Math.round(monthly.lastMonthRevenue)) : "\u2014"}
          sub={monthly.trend ? `Trending ${monthly.trend}` : "Need more data"}
          valueColor={monthly.trend === "up" ? "#10b981" : monthly.trend === "down" ? "#ef4444" : "var(--text-muted)"}
        />
      </div>
    </div>
  );
}
