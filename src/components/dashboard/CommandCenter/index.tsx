"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, BarChart3, Loader2 } from "lucide-react";
import { ProBadge } from "@/components/ProBadge";
import { useToast } from "@/components/Toast";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useCommandCenter } from "./useCommandCenter";
import RevenueOverview from "./RevenueOverview";
import PillarHealthCards from "./PillarHealthCards";
import ManualLogForm from "./ManualLogForm";

export default function CommandCenter({
  isPremium,
  onScoreRefresh,
}: {
  isPremium: boolean;
  onScoreRefresh: () => void;
}) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(isPremium);
  const [submitting, setSubmitting] = useState(false);
  const { data, loading, refresh } = useCommandCenter(isPremium);

  const handleLogSubmit = useCallback(async (formData: { revenue: number; orders?: number; expenses?: number; weekOf: string }) => {
    if (!formData.revenue || formData.revenue <= 0) {
      toast("Enter a valid revenue amount.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        revenue: formData.revenue,
        weekOf: formData.weekOf,
      };
      if (formData.orders) body.orders = formData.orders;
      if (formData.expenses) body.expenses = formData.expenses;

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
      refresh();
      onScoreRefresh();
    } catch {
      toast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  }, [toast, refresh, onScoreRefresh]);

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
          <BarChart3 style={{ width: 15, height: 15, color: "#8d95a3" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Revenue Command Center
          </span>
          <ProBadge small />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isMobile && (
            <span style={{ fontSize: 11, color: "#b4bac5" }}>Track revenue, pillar health & integrations</span>
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
                Your Revenue Command Center
              </p>
              <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 24px", maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
                Track weekly revenue, monitor pillar health scores, and see integration data — all in one place. Upgrade to unlock.
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
                Upgrade to Pro
              </Link>
            </div>
          ) : (
            /* ── Pro user: full command center ── */
            <div style={{ padding: isMobile ? 16 : 24 }}>
              {/* Manual Log Form */}
              <ManualLogForm onSubmit={handleLogSubmit} submitting={submitting} />

              {loading ? (
                <div style={{ textAlign: "center", padding: 32, color: "#8d95a3", fontSize: 13 }}>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 8, verticalAlign: "middle" }} />
                  Loading command center…
                </div>
              ) : data ? (
                <div style={{ paddingTop: 20 }}>
                  {/* Revenue Overview */}
                  <RevenueOverview
                    weeklyLogs={data.weeklyLogs}
                    monthly={data.monthly}
                    monthlyTarget={data.monthlyTarget}
                    isMobile={isMobile}
                  />

                  {/* Pillar Health Cards */}
                  <PillarHealthCards
                    pillars={data.pillars}
                    isMobile={isMobile}
                  />

                  {/* Integration hint */}
                  <div style={{ marginTop: 16, padding: "10px 14px", background: "#fafbfd", borderRadius: 8, border: "1px solid #f0f2f6", textAlign: "center" }}>
                    <span style={{ fontSize: 12, color: "#8d95a3" }}>
                      Want this to fill automatically?{" "}
                      <Link href="/settings" style={{ color: "#4361ee", fontWeight: 600, textDecoration: "none" }}>
                        Connect Shopify or Stripe in Settings
                      </Link>
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "32px 16px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f8f9fb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <BarChart3 size={22} style={{ color: "#d1d5db" }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#5a6578", margin: "0 0 4px" }}>No data yet</p>
                  <p style={{ fontSize: 13, color: "#8d95a3", margin: 0 }}>Log your first week to start tracking trends.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
