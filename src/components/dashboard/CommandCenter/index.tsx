"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, BarChart3, Loader2 } from "lucide-react";
import { ProBadge } from "@/components/ProBadge";
import { useToast } from "@/components/Toast";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useCommandCenter } from "./useCommandCenter";
import LoadingSkeleton from "./LoadingSkeleton";
import RevenueOverview from "./RevenueOverview";
import PillarHealthCards from "./PillarHealthCards";
import IntegrationStreams from "./IntegrationStreams";
import AlertsOpportunities from "./AlertsOpportunities";
import WeeklyComparison from "./WeeklyComparison";
import GoalTracking from "./GoalTracking";
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
  const [manualOpen, setManualOpen] = useState(false);
  const { data, loading, refresh } = useCommandCenter(isPremium);

  const handleLogSubmit = useCallback(async (formData: { revenue: number; orders?: number; expenses?: number; weekOf: string }) => {
    if (!formData.revenue || formData.revenue <= 0) {
      toast("Enter a valid revenue amount.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { revenue: formData.revenue, weekOf: formData.weekOf };
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

  const handleSync = useCallback(async (integrationId: string) => {
    try {
      const res = await fetch(`/api/integrations/${integrationId}/sync`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        toast("Integration synced successfully!", "success");
      } else {
        toast(json.error || "Sync failed", "error");
      }
      // Refresh command center data after sync
      setTimeout(() => { refresh(); onScoreRefresh(); }, 1500);
    } catch {
      toast("Sync failed", "error");
    }
  }, [toast, refresh, onScoreRefresh]);

  const handleSaveGoals = useCallback(async (goals: { monthlyRevenue?: number; grossMargin?: number }) => {
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals }),
      });
      if (res.ok) {
        toast("Goals saved!", "success");
        refresh();
      } else {
        toast("Failed to save goals", "error");
      }
    } catch {
      toast("Network error", "error");
    }
  }, [toast, refresh]);

  return (
    <div style={{
      background: "#fff", border: "1px solid #e6e9ef", borderRadius: 14,
      overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Gradient top accent */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #4361ee, #6366f1, #818cf8)" }} />

      {/* Section header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "14px 16px" : "16px 24px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 style={{ width: 15, height: 15, color: "#4361ee" }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#1b2434", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Revenue Command Center
          </span>
          <ProBadge small />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isMobile && data && (
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: data.overallScore >= 70 ? "#10b981" : data.overallScore >= 40 ? "#f59e0b" : "#ef4444",
            }}>
              Score: {data.overallScore}/100
            </span>
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
            /* Free user: locked CTA */
            <div style={{ padding: "48px 24px", textAlign: "center", background: "linear-gradient(180deg, #fafbfd 0%, #fff 100%)" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(67,97,238,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <BarChart3 size={26} style={{ color: "#4361ee" }} />
              </div>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#1b2434", margin: "0 0 8px" }}>
                Your Revenue Command Center
              </p>
              <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 24px", maxWidth: 380, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                Track revenue from connected integrations, monitor 5 pillar health scores, view weekly comparisons, set goals, and get AI-powered alerts — all in one premium dashboard.
              </p>
              <Link
                href="/pricing"
                style={{
                  display: "inline-block", padding: "12px 32px", borderRadius: 10,
                  background: "linear-gradient(135deg, #4361ee, #6366f1)",
                  color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(67,97,238,0.25)",
                }}
              >
                Upgrade to Pro
              </Link>
            </div>
          ) : (
            /* Pro user: full command center */
            <div style={{ padding: isMobile ? 16 : 24 }}>
              {loading ? (
                <LoadingSkeleton />
              ) : data ? (
                <>
                  {/* 1. Revenue Overview */}
                  <RevenueOverview
                    weeklyLogs={data.weeklyLogs}
                    monthly={data.monthly}
                    monthlyTarget={data.monthlyTarget}
                    totalRevenue={data.totalRevenue}
                    revenueSource={data.revenueSource}
                    isMobile={isMobile}
                  />

                  {/* 2. Pillar Health Cards */}
                  <PillarHealthCards
                    pillars={data.pillars}
                    overallScore={data.overallScore}
                    isMobile={isMobile}
                  />

                  {/* 3. Integration Data Streams */}
                  <IntegrationStreams
                    streams={data.integrationStreams}
                    isMobile={isMobile}
                    onSync={handleSync}
                  />

                  {/* 4. Alerts & Opportunities */}
                  <AlertsOpportunities alerts={data.alerts} />

                  {/* 5. Weekly Comparison Table */}
                  <WeeklyComparison rows={data.weeklyComparison} isMobile={isMobile} />

                  {/* 6. Goal Tracking */}
                  <GoalTracking goals={data.goals} onSaveGoals={handleSaveGoals} />

                  {/* 7. Manual Entry (collapsible fallback) */}
                  <div style={{
                    background: "#fafbfd", border: "1px solid #f0f2f6", borderRadius: 12,
                    overflow: "hidden",
                  }}>
                    <button
                      onClick={() => setManualOpen(!manualOpen)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", background: "none", border: "none", cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Manual Entry
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#b4bac5" }}>Log weekly numbers manually</span>
                        <ChevronDown size={14} style={{
                          color: "#8d95a3", transition: "transform 0.15s",
                          transform: manualOpen ? "rotate(180deg)" : "none",
                        }} />
                      </div>
                    </button>
                    {manualOpen && (
                      <div style={{ padding: "0 16px 16px" }}>
                        <ManualLogForm onSubmit={handleLogSubmit} submitting={submitting} />
                      </div>
                    )}
                  </div>

                  {/* Integration hint */}
                  {data.integrationStreams.length === 0 && (
                    <div style={{ marginTop: 16, padding: "10px 14px", background: "#fafbfd", borderRadius: 8, border: "1px solid #f0f2f6", textAlign: "center" }}>
                      <span style={{ fontSize: 12, color: "#8d95a3" }}>
                        Connect integrations for automatic data.{" "}
                        <Link href="/settings" style={{ color: "#4361ee", fontWeight: 600, textDecoration: "none" }}>
                          Set up Shopify, Stripe, or QuickBooks
                        </Link>
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 16px" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "#f8f9fb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <BarChart3 size={24} style={{ color: "#d1d5db" }} />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#5a6578", margin: "0 0 6px" }}>No data yet</p>
                  <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 20px" }}>Connect an integration or log your first week to get started.</p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/settings" style={{
                      padding: "10px 20px", borderRadius: 8,
                      background: "linear-gradient(135deg, #4361ee, #6366f1)",
                      color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none",
                    }}>
                      Connect Integration
                    </Link>
                    <button
                      onClick={() => setManualOpen(true)}
                      style={{
                        padding: "10px 20px", borderRadius: 8, border: "1px solid #e6e9ef",
                        background: "#fff", color: "#5a6578", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Log Manually
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
