"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";

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

function fmtWeekLabel(date: Date): string {
  const monday = getMonday(date);
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function isSameWeek(a: Date, b: Date): boolean {
  const ma = getMonday(a);
  const mb = getMonday(b);
  return ma.toISOString().slice(0, 10) === mb.toISOString().slice(0, 10);
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
      background: "var(--bg-input)",
      borderRadius: 10,
      padding: "10px 12px 6px",
      border: "1px solid var(--border-light)",
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-muted)",
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

// ── Main Component ──

export default function ManualLogForm({
  onSubmit,
  submitting,
  isTablet,
}: {
  onSubmit: (data: { revenue: number; orders?: number; expenses?: number; weekOf: string }) => void;
  submitting: boolean;
  isTablet?: boolean;
}) {
  const isMobile = useIsMobile();
  const [revenue, setRevenue] = useState("");
  const [orders, setOrders] = useState("");
  const [expenses, setExpenses] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(() => getMonday(new Date()));

  const currentMonday = getMonday(new Date());
  const canGoForward = selectedWeek < currentMonday;

  const handleSubmit = () => {
    const rev = parseFloat(revenue);
    if (!rev || rev <= 0) return;

    const data: { revenue: number; orders?: number; expenses?: number; weekOf: string } = {
      revenue: rev,
      weekOf: selectedWeek.toISOString(),
    };
    if (orders) data.orders = parseInt(orders);
    if (expenses) data.expenses = parseFloat(expenses);

    onSubmit(data);
    setRevenue("");
    setOrders("");
    setExpenses("");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    borderRadius: 8,
    fontSize: 20,
    fontWeight: 700,
    color: "var(--text-primary)",
    background: "transparent",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr auto",
        gap: 12,
        alignItems: "end",
      }}>
        {/* Revenue */}
        <InputCell label="REVENUE" required>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, fontWeight: 600, color: "var(--text-faint)", pointerEvents: "none" }}>$</span>
            <input
              type="number"
              placeholder="0"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 28 }}
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
            style={inputStyle}
          />
        </InputCell>

        {/* Expenses */}
        <InputCell label="EXPENSES">
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, fontWeight: 600, color: "var(--text-faint)", pointerEvents: "none" }}>$</span>
            <input
              type="number"
              placeholder="0"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 28 }}
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
            background: submitting ? "var(--text-faint)" : "linear-gradient(135deg, #4361ee, #6366f1)",
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
          Log Week
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
        borderBottom: "1px solid var(--border-light)",
      }}>
        <button
          onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))}
          style={{ background: "none", border: "1px solid var(--border-default)", borderRadius: 6, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-muted)" }}
          title="Previous week"
        >
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: isSameWeek(selectedWeek, new Date()) ? "#4361ee" : "var(--text-secondary)" }}>
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
          style={{ background: "none", border: "1px solid var(--border-default)", borderRadius: 6, padding: "4px 6px", cursor: canGoForward ? "pointer" : "not-allowed", display: "flex", alignItems: "center", color: canGoForward ? "var(--text-muted)" : "var(--border-default)" }}
          title="Next week"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
