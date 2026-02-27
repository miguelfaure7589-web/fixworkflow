"use client";

import { useState } from "react";
import { Target, Check, Loader2 } from "lucide-react";
import type { GoalData } from "./types";

function ProgressBar({ current, target, color }: { current: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div style={{ width: "100%", height: 8, borderRadius: 4, background: "var(--bg-subtle)", overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%", borderRadius: 4,
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

function fmtDollar(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default function GoalTracking({
  goals,
  onSaveGoals,
  isMobile,
  isTablet,
}: {
  goals: GoalData;
  onSaveGoals: (goals: { monthlyRevenue?: number; grossMargin?: number }) => void;
  isMobile: boolean;
  isTablet: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revenueGoal, setRevenueGoal] = useState(goals.monthlyRevenue?.toString() ?? "");
  const [marginGoal, setMarginGoal] = useState(goals.grossMargin?.toString() ?? "");

  const handleSave = async () => {
    setSaving(true);
    const data: { monthlyRevenue?: number; grossMargin?: number } = {};
    if (revenueGoal) data.monthlyRevenue = parseFloat(revenueGoal);
    if (marginGoal) data.grossMargin = parseFloat(marginGoal);
    onSaveGoals(data);
    setSaving(false);
    setEditing(false);
  };

  const revTarget = goals.monthlyRevenue;
  const revPct = revTarget && revTarget > 0 ? Math.round((goals.currentRevenue / revTarget) * 100) : null;
  const marginTarget = goals.grossMargin;
  const marginPct = marginTarget && goals.currentMargin != null ? Math.round((goals.currentMargin / marginTarget) * 100) : null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Target size={14} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Goal Tracking
          </span>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            fontSize: 11, fontWeight: 600, color: "#4361ee",
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          {editing ? "Cancel" : "Set Goals"}
        </button>
      </div>

      {editing ? (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12,
          padding: 16, boxShadow: "var(--shadow-card)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                MONTHLY REVENUE TARGET
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text-faint)" }}>$</span>
                <input
                  type="number"
                  value={revenueGoal}
                  onChange={(e) => setRevenueGoal(e.target.value)}
                  placeholder="10000"
                  style={{
                    width: "100%", padding: "8px 10px 8px 24px", border: "1px solid var(--border-default)",
                    borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--text-primary)", outline: "none",
                    boxSizing: "border-box", background: "var(--bg-input)",
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                GROSS MARGIN TARGET
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  value={marginGoal}
                  onChange={(e) => setMarginGoal(e.target.value)}
                  placeholder="40"
                  style={{
                    width: "100%", padding: "8px 28px 8px 10px", border: "1px solid var(--border-default)",
                    borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--text-primary)", outline: "none",
                    boxSizing: "border-box", background: "var(--bg-input)",
                  }}
                />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text-faint)" }}>%</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 20px", borderRadius: 8,
              background: "linear-gradient(135deg, #4361ee, #6366f1)",
              color: "#fff", fontSize: 13, fontWeight: 700, border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              width: isMobile ? "100%" : "auto",
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />}
            Save Goals
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {/* Revenue goal */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12,
            padding: 16, boxShadow: "var(--shadow-card)",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
              Monthly Revenue
            </div>
            {revTarget ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{fmtDollar(goals.currentRevenue)}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>of {fmtDollar(revTarget)}</span>
                </div>
                <ProgressBar current={goals.currentRevenue} target={revTarget} color="#4361ee" />
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>{revPct}% complete</div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-faint)" }}>No target set</div>
            )}
          </div>

          {/* Margin goal */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12,
            padding: 16, boxShadow: "var(--shadow-card)",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
              Gross Margin
            </div>
            {marginTarget ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{goals.currentMargin?.toFixed(1) ?? "0"}%</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>of {marginTarget}%</span>
                </div>
                <ProgressBar current={goals.currentMargin ?? 0} target={marginTarget} color="#10b981" />
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>{marginPct}% complete</div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-faint)" }}>No target set</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
