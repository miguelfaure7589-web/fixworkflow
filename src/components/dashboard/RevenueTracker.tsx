"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Trash2, Loader2, BarChart3 } from "lucide-react";
import { ProBadge } from "@/components/ProBadge";
import { useToast } from "@/components/Toast";
import { useIsMobile } from "@/hooks/useMediaQuery";

// ── Types ──

interface WeeklyLogEntry {
  id: string;
  weekOf: string;
  revenue: number;
  orders: number | null;
  expenses: number | null;
  aov: number | null;
  profit: number | null;
  margin: number | null;
}

interface MonthlySummary {
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  avgWeeklyRevenue: number;
  monthlyTarget: number | null;
  targetPct: number | null;
  trend: "up" | "down" | null;
  weeksLogged: number;
}

// ── Helpers ──

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n * 7);
  return d;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function fmtDollar(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtWeekLabel(date: Date): string {
  const monday = getMonday(date);
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function isSameWeek(a: Date, b: Date): boolean {
  const ma = getMonday(a);
  const mb = getMonday(b);
  return ma.toISOString().slice(0, 10) === mb.toISOString().slice(0, 10);
}

// ── Smooth SVG Sparkline with Gradient Fill ──

function TrendChart({
  data,
  target,
  isMobile,
  range,
  onRangeChange,
}: {
  data: { weekOf: string; revenue: number }[];
  target: number | null;
  isMobile: boolean;
  range: number;
  onRangeChange: (r: number) => void;
}) {
  const sorted = [...data]
    .sort((a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime())
    .slice(-range);

  const tooFew = sorted.length < 2;

  const W = isMobile ? 340 : 640;
  const H = 160;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const weeklyTarget = target ? target / 4.33 : null;
  const allVals = sorted.map((d) => d.revenue);
  if (weeklyTarget) allVals.push(weeklyTarget);
  const maxRev = Math.max(...allVals, 1) * 1.12;
  const minRev = 0;

  const xOf = (i: number) => padL + (sorted.length > 1 ? (i / (sorted.length - 1)) * chartW : chartW / 2);
  const yOf = (v: number) => padT + chartH * (1 - (v - minRev) / (maxRev - minRev || 1));

  // Smooth cubic bezier path
  function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return "";
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
  }

  const points = sorted.map((d, i) => ({ x: xOf(i), y: yOf(d.revenue) }));
  const linePath = smoothPath(points);
  const fillPath = points.length >= 2
    ? `${linePath} L${points[points.length - 1].x},${padT + chartH} L${points[0].x},${padT + chartH} Z`
    : "";

  // Y-axis grid lines (4 levels)
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = minRev + ((maxRev - minRev) / gridCount) * i;
    return { val, y: yOf(val) };
  });

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const rangePills = [4, 8, 12] as const;

  return (
    <div style={{ background: "#fff", border: "1px solid #f0f2f6", borderRadius: 12, padding: isMobile ? 12 : 16, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Revenue Trend
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {rangePills.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
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
        <div style={{ height: H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <BarChart3 size={28} style={{ color: "#d1d5db" }} />
          <span style={{ fontSize: 13, color: "#8d95a3" }}>Log a few more weeks to see your trend line.</span>
        </div>
      ) : (
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", overflow: "visible" }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4361ee" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#4361ee" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={padL} y1={g.y} x2={W - padR} y2={g.y} stroke="#f0f2f6" strokeWidth={1} />
              <text x={padL - 8} y={g.y + 3} textAnchor="end" fontSize={9} fill="#b4bac5" fontFamily="sans-serif">
                {g.val >= 1000 ? `$${(g.val / 1000).toFixed(g.val >= 10000 ? 0 : 1)}k` : `$${Math.round(g.val)}`}
              </text>
            </g>
          ))}

          {/* Target dashed line */}
          {weeklyTarget != null && (
            <g>
              <line x1={padL} y1={yOf(weeklyTarget)} x2={W - padR} y2={yOf(weeklyTarget)} stroke="#b4bac5" strokeWidth={1} strokeDasharray="6,4" />
              <text x={W - padR + 4} y={yOf(weeklyTarget) + 3} fontSize={9} fill="#b4bac5" fontFamily="sans-serif">
                Target
              </text>
            </g>
          )}

          {/* Area fill */}
          <path d={fillPath} fill="url(#areaGrad)" />

          {/* Smooth line */}
          <path d={linePath} fill="none" stroke="#4361ee" strokeWidth={2.5} strokeLinecap="round" />

          {/* Data points + hover hitboxes */}
          {points.map((p, i) => (
            <g key={i}>
              {/* Invisible wider hitbox */}
              <circle
                cx={p.x}
                cy={p.y}
                r={14}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 5 : 3.5}
                fill={hoveredIdx === i ? "#4361ee" : "#fff"}
                stroke="#4361ee"
                strokeWidth={2}
                style={{ transition: "r 0.15s" }}
              />
            </g>
          ))}

          {/* Hover tooltip */}
          {hoveredIdx !== null && sorted[hoveredIdx] && (
            <g>
              <rect
                x={points[hoveredIdx].x - 42}
                y={points[hoveredIdx].y - 36}
                width={84}
                height={24}
                rx={6}
                fill="#1b2434"
                opacity={0.92}
              />
              <text
                x={points[hoveredIdx].x}
                y={points[hoveredIdx].y - 20}
                textAnchor="middle"
                fontSize={11}
                fontWeight="700"
                fill="#fff"
                fontFamily="sans-serif"
              >
                {fmtDollar(sorted[hoveredIdx].revenue)}
              </text>
            </g>
          )}

          {/* X-axis labels */}
          {sorted.map((d, i) => (
            <text key={i} x={points[i].x} y={H - 4} textAnchor="middle" fontSize={9} fill="#8d95a3" fontFamily="sans-serif">
              {fmtDate(d.weekOf)}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

// ── Pill Badge ──

function Pill({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: bg, color, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

// ── Main Component ──

export default function RevenueTracker({
  isPremium,
  onScoreRefresh,
}: {
  isPremium: boolean;
  onScoreRefresh: () => void;
}) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(isPremium);
  const [logs, setLogs] = useState<WeeklyLogEntry[]>([]);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState(8);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Form state
  const [revenue, setRevenue] = useState("");
  const [orders, setOrders] = useState("");
  const [expenses, setExpenses] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(() => getMonday(new Date()));

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tracker/history");
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs ?? []);
        setMonthly(json.monthly ?? null);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isPremium) fetchHistory();
  }, [isPremium, fetchHistory]);

  const handleSubmit = async () => {
    const rev = parseFloat(revenue);
    if (!rev || rev <= 0) {
      toast("Enter a valid revenue amount.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        revenue: rev,
        weekOf: selectedWeek.toISOString(),
      };
      if (orders) body.orders = parseInt(orders);
      if (expenses) body.expenses = parseFloat(expenses);

      const res = await fetch("/api/tracker/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Failed to log", "error");
        return;
      }
      toast("Week logged! Your score has been updated.", "success");
      setRevenue("");
      setOrders("");
      setExpenses("");
      fetchHistory();
      onScoreRefresh();
    } catch {
      toast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/tracker/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Entry deleted.", "info");
        fetchHistory();
        onScoreRefresh();
      }
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const weeklyTarget = monthly?.monthlyTarget ? monthly.monthlyTarget / 4.33 : null;
  const currentMonday = getMonday(new Date());
  const canGoForward = selectedWeek < currentMonday;

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e6e9ef",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* ── Gradient top accent ── */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #4361ee, #6366f1)" }} />

      {/* ── Section header ── */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "14px 16px" : "16px 24px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>📊</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Revenue Tracker
          </span>
          <ProBadge small />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isMobile && (
            <span style={{ fontSize: 11, color: "#b4bac5" }}>Log your weekly numbers to sharpen your score.</span>
          )}
          <ChevronDown
            size={16}
            style={{ color: "#8d95a3", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}
          />
        </div>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #f0f2f6" }}>
          {!isPremium ? (
            /* ── Free user: locked ── */
            <div style={{ padding: "48px 24px", textAlign: "center", background: "linear-gradient(180deg, #fafbfd 0%, #fff 100%)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(67,97,238,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <BarChart3 size={22} style={{ color: "#4361ee" }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1b2434", margin: "0 0 6px" }}>
                Track your real revenue weekly
              </p>
              <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 24px", maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
                Log weekly numbers and watch your Revenue Health Score update automatically. See trends, margins, and targets at a glance.
              </p>
              <Link
                href="/pricing"
                style={{
                  display: "inline-block",
                  padding: "11px 28px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #4361ee, #6366f1)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(67,97,238,0.25)",
                }}
              >
                Upgrade to Pro →
              </Link>
            </div>
          ) : (
            /* ── Pro user: full tracker ── */
            <div style={{ padding: isMobile ? 16 : 24 }}>

              {/* ═══ PART 1: Quick Log Form ═══ */}
              <div style={{ marginBottom: 0 }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr auto",
                  gap: 12,
                  alignItems: "end",
                }}>
                  {/* Revenue */}
                  <InputCell label="REVENUE" required>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, fontWeight: 600, color: "#b4bac5", pointerEvents: "none" }}>$</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={revenue}
                        onChange={(e) => setRevenue(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 28px",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#1b2434",
                          background: "transparent",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </InputCell>

                  {/* Orders */}
                  <InputCell label="ORDERS">
                    <input
                      type="number"
                      placeholder="0"
                      value={orders}
                      onChange={(e) => setOrders(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#1b2434",
                        background: "transparent",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </InputCell>

                  {/* Expenses */}
                  <InputCell label="EXPENSES">
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, fontWeight: 600, color: "#b4bac5", pointerEvents: "none" }}>$</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 28px",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#1b2434",
                          background: "transparent",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </InputCell>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      padding: isMobile ? "12px 20px" : "12px 24px",
                      borderRadius: 10,
                      background: submitting ? "#b4bac5" : "linear-gradient(135deg, #4361ee, #6366f1)",
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                      border: "none",
                      cursor: submitting ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      boxShadow: submitting ? "none" : "0 4px 14px rgba(67,97,238,0.25)",
                      transition: "box-shadow 0.2s, transform 0.15s",
                      height: isMobile ? "auto" : 52,
                    }}
                  >
                    {submitting && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
                    Log Week →
                  </button>
                </div>

                {/* Week selector */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  marginTop: 14,
                  paddingBottom: 20,
                  borderBottom: "1px solid #f0f2f6",
                }}>
                  <button
                    onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))}
                    style={{ background: "none", border: "1px solid #e6e9ef", borderRadius: 6, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", color: "#8d95a3" }}
                    title="Previous week"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isSameWeek(selectedWeek, new Date()) ? "#4361ee" : "#5a6578" }}>
                    Week of {fmtWeekLabel(selectedWeek)}
                    {isSameWeek(selectedWeek, new Date()) && (
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#4361ee", background: "rgba(67,97,238,0.08)", padding: "2px 6px", borderRadius: 4 }}>
                        THIS WEEK
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => canGoForward && setSelectedWeek(addWeeks(selectedWeek, 1))}
                    disabled={!canGoForward}
                    style={{ background: "none", border: "1px solid #e6e9ef", borderRadius: 6, padding: "4px 6px", cursor: canGoForward ? "pointer" : "not-allowed", display: "flex", alignItems: "center", color: canGoForward ? "#8d95a3" : "#e6e9ef" }}
                    title="Next week"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* ═══ PART 2: Weekly History ═══ */}
              <div style={{ paddingTop: 20 }}>
                {loading ? (
                  <div style={{ textAlign: "center", padding: 32, color: "#8d95a3", fontSize: 13 }}>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 8, verticalAlign: "middle" }} />
                    Loading history…
                  </div>
                ) : logs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f8f9fb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <BarChart3 size={22} style={{ color: "#d1d5db" }} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#5a6578", margin: "0 0 4px" }}>No entries yet</p>
                    <p style={{ fontSize: 13, color: "#8d95a3", margin: 0 }}>Log your first week to start tracking trends.</p>
                  </div>
                ) : (
                  <>
                    {/* History table */}
                    <div style={{ overflowX: "auto", marginBottom: 20 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 620 }}>
                        <thead>
                          <tr>
                            {["Week", "Revenue", "Orders", "AOV", "Expenses", "Profit", "Margin", "vs Target", ""].map((h) => (
                              <th key={h} style={{
                                textAlign: h === "" ? "center" : "left",
                                padding: "10px 12px",
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#8d95a3",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                borderBottom: "2px solid #f0f2f6",
                              }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {logs.slice(0, 8).map((log) => {
                            const isCurrentWeek = isSameWeek(new Date(log.weekOf), new Date());
                            const vsTarget = weeklyTarget
                              ? log.revenue >= weeklyTarget ? "above" : "below"
                              : null;
                            const isHovered = hoveredRow === log.id;

                            return (
                              <tr
                                key={log.id}
                                onMouseEnter={() => setHoveredRow(log.id)}
                                onMouseLeave={() => setHoveredRow(null)}
                                style={{
                                  background: isHovered ? "#f8f9fd" : "transparent",
                                  borderLeft: isCurrentWeek ? "4px solid #4361ee" : "4px solid transparent",
                                  transition: "background 0.15s",
                                }}
                              >
                                <td style={{ padding: "11px 12px", fontWeight: 600, color: "#5a6578" }}>
                                  {fmtDate(log.weekOf)}
                                  {isCurrentWeek && (
                                    <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: "#4361ee", background: "rgba(67,97,238,0.08)", padding: "1px 5px", borderRadius: 3, verticalAlign: "middle" }}>NOW</span>
                                  )}
                                </td>
                                <td style={{ padding: "11px 12px", fontSize: 15, fontWeight: 700, color: "#1b2434" }}>
                                  {fmtDollar(log.revenue)}
                                </td>
                                <td style={{ padding: "11px 12px", color: "#5a6578" }}>{log.orders ?? "—"}</td>
                                <td style={{ padding: "11px 12px", color: "#5a6578" }}>{log.aov != null ? fmtDollar(Math.round(log.aov)) : "—"}</td>
                                <td style={{ padding: "11px 12px", color: "#5a6578" }}>{log.expenses != null ? fmtDollar(Math.round(log.expenses)) : "—"}</td>
                                <td style={{ padding: "11px 12px", fontWeight: 600, color: log.profit != null ? (log.profit >= 0 ? "#10b981" : "#ef4444") : "#b4bac5" }}>
                                  {log.profit != null ? fmtDollar(Math.round(log.profit)) : "—"}
                                </td>
                                <td style={{ padding: "11px 12px" }}>
                                  {log.margin != null ? (
                                    <MarginPill value={log.margin} />
                                  ) : (
                                    <span style={{ color: "#b4bac5" }}>—</span>
                                  )}
                                </td>
                                <td style={{ padding: "11px 12px" }}>
                                  {vsTarget === "above" ? (
                                    <Pill bg="rgba(16,185,129,0.08)" color="#10b981">↑ Above</Pill>
                                  ) : vsTarget === "below" ? (
                                    <Pill bg="rgba(239,68,68,0.08)" color="#ef4444">↓ Below</Pill>
                                  ) : (
                                    <span style={{ color: "#b4bac5", fontSize: 12 }}>—</span>
                                  )}
                                </td>
                                <td style={{ padding: "11px 8px", textAlign: "center" }}>
                                  <button
                                    onClick={() => handleDelete(log.id)}
                                    disabled={deleting === log.id}
                                    title="Delete entry"
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: isHovered ? "#8d95a3" : "transparent",
                                      padding: 4,
                                      borderRadius: 4,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      transition: "color 0.15s",
                                    }}
                                  >
                                    {deleting === log.id ? (
                                      <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                                    ) : (
                                      <Trash2 size={13} />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* ═══ PART 3: Trend Chart ═══ */}
                    <div style={{ marginBottom: 20 }}>
                      <TrendChart
                        data={logs.map((l) => ({ weekOf: l.weekOf, revenue: l.revenue }))}
                        target={monthly?.monthlyTarget ?? null}
                        isMobile={isMobile}
                        range={chartRange}
                        onRangeChange={setChartRange}
                      />
                    </div>

                    {/* ═══ PART 4: Monthly Summary ═══ */}
                    {monthly && (
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
                          value={monthly.targetPct != null ? `${monthly.targetPct}%` : "—"}
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
                          value={monthly.avgWeeklyRevenue > 0 ? fmtDollar(Math.round(monthly.avgWeeklyRevenue)) : "—"}
                          sub={monthly.weeksLogged > 0 ? `across ${monthly.weeksLogged} week${monthly.weeksLogged !== 1 ? "s" : ""}` : ""}
                        />
                        <SummaryCard
                          label="Trend"
                          value={monthly.trend === "up" ? "↑ Up" : monthly.trend === "down" ? "↓ Down" : "—"}
                          sub={monthly.trend ? "vs last month" : "Need more data"}
                          valueColor={monthly.trend === "up" ? "#10b981" : monthly.trend === "down" ? "#ef4444" : "#8d95a3"}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Integration hint */}
              <div style={{ marginTop: 16, padding: "10px 14px", background: "#fafbfd", borderRadius: 8, border: "1px solid #f0f2f6", textAlign: "center" }}>
                <span style={{ fontSize: 12, color: "#8d95a3" }}>
                  Want this to fill automatically?{" "}
                  <Link href="/settings" style={{ color: "#4361ee", fontWeight: 600, textDecoration: "none" }}>
                    Connect Shopify or Stripe in Settings →
                  </Link>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Input Cell ──

function InputCell({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#f8f9fb",
      borderRadius: 10,
      padding: "10px 12px 6px",
      border: "1px solid #f0f2f6",
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#8d95a3",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: 2,
      }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </div>
      {children}
    </div>
  );
}

// ── Margin Pill ──

function MarginPill({ value }: { value: number }) {
  const bg = value >= 40 ? "rgba(16,185,129,0.08)" : value >= 20 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
  const color = value >= 40 ? "#10b981" : value >= 20 ? "#f59e0b" : "#ef4444";
  return <Pill bg={bg} color={color}>{value.toFixed(1)}%</Pill>;
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
