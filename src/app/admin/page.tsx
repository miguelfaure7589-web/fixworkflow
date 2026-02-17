"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Metrics {
  totalUsers: number;
  completedOnboarding: number;
  proSubscribers: number;
  creditReferrals: { total: number; pending: number; contacted: number; converted: number; declined: number };
  affiliateClicks: { total: number; last7Days: number };
  funnel: { signedUp: number; startedDiagnosis: number; completedOnboarding: number; activeDashboard: number };
}

interface IntegrationHealth {
  totalConnected: number;
  providerBreakdown: Record<string, number>;
  lastSync: { date: string; status: string } | null;
  failedSyncsCount: number;
  failedSyncs: { id: string; provider: string; userEmail: string | null; userName: string | null; error: string | null; createdAt: string }[];
}

interface Referral {
  id: string;
  name: string;
  email: string;
  phone: string;
  bestTimeToCall: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  userScore: number | null;
}

interface AffiliateData {
  topProducts: { name: string; totalClicks: number; placements: Record<string, number> }[];
  byPlacement: Record<string, number>;
  recentClicks: { timestamp: string; userEmail: string; productName: string; placement: string }[];
}

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  businessType: string | null;
  score: number | null;
  funnelStage: string;
  usesPersonalCredit: string | null;
  isPremium: boolean;
}

const STATUSES = ["pending", "contacted", "converted", "declined"];

const STATUS_BG: Record<string, string> = { pending: "#fef3c7", contacted: "rgba(67,97,238,0.07)", converted: "rgba(16,185,129,0.07)", declined: "#f4f5f8" };
const STATUS_FG: Record<string, string> = { pending: "#92400e", contacted: "#4361ee", converted: "#10b981", declined: "#8d95a3" };
const STATUS_BD: Record<string, string> = { pending: "#fcd34d", contacted: "rgba(67,97,238,0.15)", converted: "rgba(16,185,129,0.15)", declined: "#e6e9ef" };

const FUNNEL_LABELS: Record<string, string> = { signed_up: "Signed up", diagnosis_done: "Diagnosis done", onboarded: "Onboarded", active: "Active", pro: "Pro" };
const FUNNEL_BG: Record<string, string> = { signed_up: "#f4f5f8", diagnosis_done: "rgba(245,158,11,0.1)", onboarded: "rgba(67,97,238,0.1)", active: "rgba(16,185,129,0.1)", pro: "#6366f1" };
const FUNNEL_FG: Record<string, string> = { signed_up: "#8d95a3", diagnosis_done: "#d97706", onboarded: "#4361ee", active: "#10b981", pro: "#fff" };

const PL_COLOR: Record<string, string> = { playbook_inline: "#f97316", tool_stack: "#4361ee", resource_shelf: "#8b5cf6" };

function relTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const dy = Math.floor(h / 24);
  if (dy === 1) return "yesterday";
  if (dy < 7) return dy + "d ago";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function pct(n: number, t: number): string {
  return t === 0 ? "0%" : Math.round((n / t) * 100) + "%";
}

const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e6e9ef", padding: 20 };
const th: React.CSSProperties = { padding: "12px 16px", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase" as const, letterSpacing: 0.5 };
const td: React.CSSProperties = { padding: "14px 16px", fontSize: 13, color: "#5a6578" };

function PlacementBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(e => e[1]), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {entries.map(([pl, cnt]) => (
        <div key={pl}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#5a6578", textTransform: "capitalize" as const }}>{pl.replace(/_/g, " ")}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1b2434" }}>{cnt} clicks</span>
          </div>
          <div style={{ height: 8, background: "#f4f5f8", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 4, width: (cnt / max * 100) + "%", background: PL_COLOR[pl] || "#8d95a3" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [refFilter, setRefFilter] = useState("all");
  const [affData, setAffData] = useState<AffiliateData | null>(null);
  const [affRange, setAffRange] = useState("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [integrationHealth, setIntegrationHealth] = useState<IntegrationHealth | null>(null);
  const [syncRunning, setSyncRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = (session?.user as Record<string, unknown> | undefined)?.isAdmin;

  const fetchAll = useCallback(async (rf: string, ar: string) => {
    try {
      const [m, r, a, u, ih] = await Promise.all([
        fetch("/api/admin/metrics").then(x => x.ok ? x.json() : null),
        fetch("/api/admin/referrals" + (rf !== "all" ? "?status=" + rf : "")).then(x => x.ok ? x.json() : null),
        fetch("/api/admin/affiliate-analytics?range=" + ar).then(x => x.ok ? x.json() : null),
        fetch("/api/admin/users?limit=20").then(x => x.ok ? x.json() : null),
        fetch("/api/admin/integrations").then(x => x.ok ? x.json() : null),
      ]);
      if (m) setMetrics(m);
      if (r) setReferrals(r.referrals || []);
      if (a) setAffData(a);
      if (u) setUsers(u.users || []);
      if (ih) setIntegrationHealth(ih);
    } catch { /* silent */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { router.push("/signup"); return; }
    if (!isAdmin) { router.push("/dashboard"); return; }
    fetchAll(refFilter, affRange);
  }, [status, session, isAdmin, router, fetchAll, refFilter, affRange]);

  const handleRefresh = useCallback(() => { setRefreshing(true); fetchAll(refFilter, affRange); }, [fetchAll, refFilter, affRange]);

  const handleStatusChange = useCallback(async (id: string, ns: string) => {
    const res = await fetch("/api/admin/referrals/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: ns }) });
    if (res.ok) setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: ns } : r));
  }, []);

  if (status === "loading" || loading) {
    return <div style={{ minHeight: "100vh", background: "#f4f5f8", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 14, color: "#8d95a3" }}>Loading admin dashboard...</span></div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f8" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e6e9ef" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #4361ee, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap style={{ width: 20, height: 20, color: "#fff" }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#1b2434" }}>FixWorkFlow</span>
          </Link>
          <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#6366f1", color: "#fff", letterSpacing: 0.5 }}>ADMIN</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1b2434", margin: 0 }}>Admin Dashboard</h1>
            <p style={{ fontSize: 13, color: "#8d95a3", marginTop: 4 }}>FixWorkFlow business metrics and management</p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #e6e9ef", background: "#fff", fontSize: 13, fontWeight: 600, color: "#5a6578", cursor: "pointer", opacity: refreshing ? 0.6 : 1 }}>
            <RefreshCw style={{ width: 14, height: 14 }} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* METRICS */}
        {metrics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <MCard icon="U" accent="#4361ee" value={metrics.totalUsers} label="Total Users" sub="All time signups" />
            <MCard icon="O" accent="#10b981" value={metrics.completedOnboarding} label="Completed Onboarding" sub="Finished full setup" badge={pct(metrics.completedOnboarding, metrics.totalUsers)} />
            <MCard icon="P" accent="#8b5cf6" value={metrics.proSubscribers} label="Pro Subscribers" sub="Paying customers" badge={pct(metrics.proSubscribers, metrics.totalUsers)} />
            <MCard icon="C" accent="#f59e0b" value={metrics.creditReferrals.total} label="Credit Referrals" sub={metrics.creditReferrals.pending + " pending / " + metrics.creditReferrals.contacted + " contacted / " + metrics.creditReferrals.converted + " converted"} />
            <MCard icon="A" accent="#4361ee" value={metrics.affiliateClicks.total} label="Affiliate Clicks" sub={"Last 7 days: " + metrics.affiliateClicks.last7Days} />
            <div style={card}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#ef4444", flexShrink: 0 }}>F</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1b2434", marginBottom: 8 }}>Funnel Drop-off</div>
                  <FunnelRow label="Signed up" val={metrics.funnel.signedUp} total={metrics.funnel.signedUp} />
                  <FunnelRow label="Started diagnosis" val={metrics.funnel.startedDiagnosis} total={metrics.funnel.signedUp} />
                  <FunnelRow label="Completed onboarding" val={metrics.funnel.completedOnboarding} total={metrics.funnel.signedUp} />
                  <FunnelRow label="Active on dashboard" val={metrics.funnel.activeDashboard} total={metrics.funnel.signedUp} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INTEGRATION HEALTH */}
        {integrationHealth && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1b2434" }}>Integration Health</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
                {integrationHealth.totalConnected} connected
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#1b2434", lineHeight: 1 }}>{integrationHealth.totalConnected}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#5a6578", marginTop: 4 }}>Connected Integrations</div>
                <div style={{ fontSize: 12, color: "#8d95a3", marginTop: 4 }}>
                  {Object.entries(integrationHealth.providerBreakdown).map(([p, c]) => (
                    <span key={p} style={{ marginRight: 8 }}>
                      {p === "shopify" ? "Shopify" : p === "stripe-data" ? "Stripe" : p}: <strong>{c}</strong>
                    </span>
                  ))}
                  {Object.keys(integrationHealth.providerBreakdown).length === 0 && "No integrations yet"}
                </div>
              </div>
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1b2434", marginBottom: 8 }}>Last Sync</div>
                {integrationHealth.lastSync ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 600, color: integrationHealth.lastSync.status === "success" ? "#10b981" : "#ef4444" }}>
                      {integrationHealth.lastSync.status === "success" ? "Success" : "Failed"}
                    </div>
                    <div style={{ fontSize: 12, color: "#8d95a3", marginTop: 2 }}>
                      {new Date(integrationHealth.lastSync.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" "}at{" "}
                      {new Date(integrationHealth.lastSync.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#8d95a3" }}>No syncs yet</div>
                )}
              </div>
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: integrationHealth.failedSyncsCount > 0 ? "#ef4444" : "#10b981", lineHeight: 1 }}>
                      {integrationHealth.failedSyncsCount}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#5a6578", marginTop: 4 }}>Failed Syncs (7d)</div>
                  </div>
                  <button
                    onClick={async () => {
                      setSyncRunning(true);
                      try {
                        await fetch("/api/cron/weekly-sync", { method: "POST" });
                        // Refresh data
                        const ih = await fetch("/api/admin/integrations").then(x => x.ok ? x.json() : null);
                        if (ih) setIntegrationHealth(ih);
                      } catch {}
                      setSyncRunning(false);
                    }}
                    disabled={syncRunning}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 8,
                      border: "1px solid #4361ee", background: syncRunning ? "#f4f5f8" : "transparent",
                      fontSize: 12, fontWeight: 600, color: "#4361ee",
                      cursor: syncRunning ? "not-allowed" : "pointer",
                      opacity: syncRunning ? 0.6 : 1,
                    }}
                  >
                    <RefreshCw style={{ width: 12, height: 12 }} />
                    {syncRunning ? "Running..." : "Run Weekly Sync"}
                  </button>
                </div>
              </div>
            </div>
            {integrationHealth.failedSyncs.length > 0 && (
              <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #e6e9ef", fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Failed Syncs</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                    {["Date", "Provider", "User", "Error"].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {integrationHealth.failedSyncs.map(f => (
                      <tr key={f.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                        <td style={{ ...td, whiteSpace: "nowrap", fontSize: 12 }}>{new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td style={{ ...td, fontWeight: 600, color: "#1b2434", textTransform: "capitalize" as const }}>{f.provider === "stripe-data" ? "Stripe" : f.provider}</td>
                        <td style={td}>{f.userEmail || f.userName || "—"}</td>
                        <td style={{ ...td, color: "#ef4444", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.error || ""}>{f.error || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* REFERRALS */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1b2434" }}>Credit Referrals</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(67,97,238,0.08)", color: "#4361ee" }}>{referrals.length}</span>
            <select value={refFilter} onChange={e => setRefFilter(e.target.value)} style={{ marginLeft: "auto", padding: "6px 10px", borderRadius: 7, border: "1px solid #e6e9ef", fontSize: 12, color: "#5a6578", cursor: "pointer", background: "#fff" }}>
              <option value="all">All</option>
              {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                {["Date", "Name", "Email", "Phone", "Best Time", "Notes", "Score", "Status"].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                    <td style={{ ...td, whiteSpace: "nowrap", fontSize: 12 }}>{fmtDate(r.createdAt)}</td>
                    <td style={{ ...td, fontWeight: 600, color: "#1b2434" }}>{r.name}</td>
                    <td style={td}><a href={"mailto:" + r.email} style={{ color: "#4361ee", textDecoration: "none" }}>{r.email}</a></td>
                    <td style={td}><a href={"tel:" + r.phone} style={{ color: "#4361ee", textDecoration: "none" }}>{r.phone}</a></td>
                    <td style={{ ...td, color: "#8d95a3" }}>{r.bestTimeToCall || "\u2014"}</td>
                    <td style={{ ...td, color: "#8d95a3", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.notes || ""}>{r.notes ? (r.notes.length > 60 ? r.notes.slice(0, 60) + "\u2026" : r.notes) : "\u2014"}</td>
                    <td style={{ ...td, fontWeight: 600, color: r.userScore ? "#1b2434" : "#8d95a3" }}>{r.userScore ?? "\u2014"}</td>
                    <td style={td}>
                      <select value={r.status} onChange={e => handleStatusChange(r.id, e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid " + (STATUS_BD[r.status] || "#e6e9ef"), fontSize: 12, fontWeight: 600, cursor: "pointer", background: STATUS_BG[r.status] || "#f4f5f8", color: STATUS_FG[r.status] || "#8d95a3" }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {referrals.length === 0 && <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", color: "#8d95a3", fontSize: 13 }}>No referrals yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* AFFILIATE */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1b2434" }}>Affiliate Performance</span>
            <select value={affRange} onChange={e => setAffRange(e.target.value)} style={{ marginLeft: "auto", padding: "6px 10px", borderRadius: 7, border: "1px solid #e6e9ef", fontSize: 12, color: "#5a6578", cursor: "pointer", background: "#fff" }}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          {affData && (affData.topProducts.length > 0 || affData.recentClicks.length > 0) ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #e6e9ef", fontSize: 13, fontWeight: 700, color: "#1b2434" }}>Top Products</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                      <th style={{ ...th, width: 36 }}>#</th><th style={th}>Product</th><th style={{ ...th, textAlign: "right" as const }}>Clicks</th><th style={th}>Placements</th>
                    </tr></thead>
                    <tbody>
                      {affData.topProducts.map((p, i) => (
                        <tr key={p.name} style={{ borderBottom: "1px solid #f0f2f6" }}>
                          <td style={{ ...td, fontWeight: 600, color: "#8d95a3" }}>{i + 1}</td>
                          <td style={{ ...td, fontWeight: 600, color: "#1b2434" }}>{p.name}</td>
                          <td style={{ ...td, textAlign: "right" as const, fontWeight: 700 }}>{p.totalClicks}</td>
                          <td style={td}>
                            {Object.entries(p.placements).map(([pl, cnt]) => (
                              <span key={pl} style={{ fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 3, marginRight: 4, background: (PL_COLOR[pl] || "#8d95a3") + "14", color: PL_COLOR[pl] || "#8d95a3" }}>
                                {pl.replace(/_/g, " ")} ({cnt})
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1b2434", marginBottom: 16 }}>Clicks by Placement</div>
                  {Object.keys(affData.byPlacement).length > 0 ? <PlacementBars data={affData.byPlacement} /> : <div style={{ fontSize: 13, color: "#8d95a3", textAlign: "center", padding: 20 }}>No placement data yet.</div>}
                </div>
              </div>
              {affData.recentClicks.length > 0 && (
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #e6e9ef", fontSize: 13, fontWeight: 700, color: "#1b2434" }}>Recent Clicks</div>
                  <div style={{ maxHeight: 320, overflowY: "auto" as const }}>
                    {affData.recentClicks.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #f0f2f6", fontSize: 12 }}>
                        <span style={{ color: "#8d95a3", minWidth: 80 }}>{relTime(c.timestamp)}</span>
                        <span style={{ color: "#5a6578" }}>{c.userEmail}</span>
                        <span style={{ fontWeight: 600, color: "#1b2434" }}>{c.productName}</span>
                        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: (PL_COLOR[c.placement] || "#8d95a3") + "14", color: PL_COLOR[c.placement] || "#8d95a3" }}>{c.placement.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ ...card, textAlign: "center", padding: "32px 20px" }}>
              <div style={{ fontSize: 13, color: "#8d95a3" }}>Affiliate click tracking will appear here once users start clicking recommendations.</div>
            </div>
          )}
        </div>

        {/* USERS */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1b2434" }}>Recent Users</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(67,97,238,0.08)", color: "#4361ee" }}>{metrics?.totalUsers ?? users.length}</span>
          </div>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                {["Name", "Email", "Business Type", "Score", "Stage", "Personal Credit"].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {users.map(u => {
                  const fl = FUNNEL_LABELS[u.funnelStage] || "Signed up";
                  const fbg = FUNNEL_BG[u.funnelStage] || "#f4f5f8";
                  const ffg = FUNNEL_FG[u.funnelStage] || "#8d95a3";
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                      <td style={{ ...td, fontWeight: 600, color: "#1b2434" }}>{u.name || "\u2014"}</td>
                      <td style={td}>{u.email || "\u2014"}</td>
                      <td style={{ ...td, textTransform: "capitalize" as const }}>{u.businessType?.replace(/_/g, " ") || "\u2014"}</td>
                      <td style={{ ...td, fontWeight: 600, color: u.score ? "#1b2434" : "#8d95a3" }}>{u.score ?? "\u2014"}</td>
                      <td style={td}><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: fbg, color: ffg }}>{fl}</span></td>
                      <td style={{ ...td, textTransform: "capitalize" as const, color: u.usesPersonalCredit ? "#1b2434" : "#8d95a3" }}>{u.usesPersonalCredit || "\u2014"}</td>
                    </tr>
                  );
                })}
                {users.length === 0 && <tr><td colSpan={6} style={{ padding: "32px 16px", textAlign: "center", color: "#8d95a3", fontSize: 13 }}>No users yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MCard({ icon, accent, value, label, sub, badge }: { icon: string; accent: string; value: number; label: string; sub: string; badge?: string }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: accent + "14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: accent, flexShrink: 0 }}>{icon}</div>
        {badge && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: accent + "14", color: accent }}>{badge}</span>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: "#1b2434", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#5a6578", marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#8d95a3", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function FunnelRow({ label, val, total }: { label: string; val: number; total: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
      <span style={{ color: "#5a6578" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#1b2434" }}>{val} <span style={{ color: "#8d95a3", fontWeight: 400 }}>({pct(val, total)})</span></span>
    </div>
  );
}
