"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap, RefreshCw, Menu, X, Pencil, Trash2, Search, Save, Star } from "lucide-react";
import Link from "next/link";
import UserAvatarDropdown from "@/components/UserAvatarDropdown";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

interface HistoryEntry {
  date: string;
  totalUsers: number;
  completedOnboarding: number;
  proSubscribers: number;
  creditReferrals: number;
  affiliateClicks: number;
  funnelSignedUp: number;
  funnelStartedDiagnosis: number;
  funnelCompletedOnboarding: number;
  funnelActiveDashboard: number;
}

const STATUSES = ["pending", "contacted", "converted", "declined"];

const STATUS_BG: Record<string, string> = { pending: "#fef3c7", contacted: "rgba(67,97,238,0.07)", converted: "rgba(16,185,129,0.07)", declined: "#f4f5f8" };
const STATUS_FG: Record<string, string> = { pending: "#92400e", contacted: "#4361ee", converted: "#10b981", declined: "#8d95a3" };
const STATUS_BD: Record<string, string> = { pending: "#fcd34d", contacted: "rgba(67,97,238,0.15)", converted: "rgba(16,185,129,0.15)", declined: "#e6e9ef" };

const FUNNEL_LABELS: Record<string, string> = { signed_up: "Signed up", diagnosis_done: "Diagnosis done", onboarded: "Onboarded", active: "Active", pro: "Pro" };
const FUNNEL_BG: Record<string, string> = { signed_up: "#f4f5f8", diagnosis_done: "rgba(245,158,11,0.1)", onboarded: "rgba(67,97,238,0.1)", active: "rgba(16,185,129,0.1)", pro: "#6366f1" };
const FUNNEL_FG: Record<string, string> = { signed_up: "#8d95a3", diagnosis_done: "#d97706", onboarded: "#4361ee", active: "#10b981", pro: "#fff" };

const PL_COLOR: Record<string, string> = { playbook_inline: "#f97316", tool_stack: "#4361ee", resource_shelf: "#8b5cf6" };

type MetricKey = "totalUsers" | "completedOnboarding" | "proSubscribers" | "creditReferrals" | "affiliateClicks";

const METRIC_LABELS: Record<MetricKey, string> = {
  totalUsers: "Total Users",
  completedOnboarding: "Completed Onboarding",
  proSubscribers: "Pro Subscribers",
  creditReferrals: "Credit Referrals",
  affiliateClicks: "Affiliate Clicks",
};

const METRIC_COLORS: Record<MetricKey, string> = {
  totalUsers: "#4361ee",
  completedOnboarding: "#10b981",
  proSubscribers: "#8b5cf6",
  creditReferrals: "#f59e0b",
  affiliateClicks: "#4361ee",
};

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
const thStyle: React.CSSProperties = { padding: "12px 16px", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase" as const, letterSpacing: 0.5 };
const tdStyle: React.CSSProperties = { padding: "14px 16px", fontSize: 13, color: "#5a6578" };

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

/* ─── Metric Chart Modal ─── */

function MetricChartModal({ metricKey, label, color, currentValue, history, onClose }: {
  metricKey: MetricKey;
  label: string;
  color: string;
  currentValue: number;
  history: HistoryEntry[];
  onClose: () => void;
}) {
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const filtered = useMemo(() => {
    const since = Date.now() - range * 24 * 60 * 60 * 1000;
    return history.filter(h => new Date(h.date).getTime() >= since);
  }, [history, range]);

  const prevPeriod = useMemo(() => {
    const since = Date.now() - range * 2 * 24 * 60 * 60 * 1000;
    const until = Date.now() - range * 24 * 60 * 60 * 1000;
    return history.filter(h => {
      const t = new Date(h.date).getTime();
      return t >= since && t < until;
    });
  }, [history, range]);

  const prevAvg = prevPeriod.length > 0
    ? prevPeriod.reduce((s, h) => s + (h[metricKey] as number), 0) / prevPeriod.length
    : null;

  const changeStr = prevAvg !== null && prevAvg > 0
    ? ((currentValue - prevAvg) / prevAvg * 100).toFixed(1) + "%"
    : null;

  const changePositive = prevAvg !== null ? currentValue >= prevAvg : true;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 640, width: "100%", margin: "0 16px", boxShadow: "0 16px 48px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: 0 }}>{label}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#1b2434" }}>{currentValue}</span>
              {changeStr && (
                <span style={{ fontSize: 13, fontWeight: 700, color: changePositive ? "#10b981" : "#ef4444" }}>
                  {changePositive ? "+" : ""}{changeStr} vs prev period
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#8d95a3" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {([7, 30, 90] as const).map(d => (
            <button key={d} onClick={() => setRange(d)} style={{
              padding: "6px 14px", borderRadius: 7, border: "1px solid " + (range === d ? color : "#e6e9ef"),
              background: range === d ? color + "14" : "#fff", color: range === d ? color : "#8d95a3",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>{d}d</button>
          ))}
        </div>

        <div style={{ height: 280 }}>
          {filtered.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8d95a3" }} tickFormatter={v => { const d = new Date(v); return (d.getMonth() + 1) + "/" + d.getDate(); }} />
                <YAxis tick={{ fontSize: 11, fill: "#8d95a3" }} width={40} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e6e9ef", fontSize: 13 }}
                  labelFormatter={v => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                />
                <Line type="monotone" dataKey={metricKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8d95a3", fontSize: 13 }}>
              No historical data yet. Click "Save Snapshot" to start tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Edit User Modal ─── */

function EditUserModal({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (data: Record<string, unknown>) => void }) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [businessType, setBusinessType] = useState(user.businessType || "");
  const [score, setScore] = useState(user.score?.toString() || "");
  const [stage, setStage] = useState(user.funnelStage);
  const [credit, setCredit] = useState(user.usesPersonalCredit || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    onSave({ id: user.id, name, email, businessType: businessType || null, score: score ? Number(score) : null, funnelStage: stage, usesPersonalCredit: credit || null });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 480, width: "100%", margin: "0 16px", boxShadow: "0 16px 48px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: 0 }}>Edit User</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#8d95a3" }}><X size={20} /></button>
        </div>
        {[
          { label: "Name", value: name, set: setName },
          { label: "Email", value: email, set: setEmail },
          { label: "Business Type", value: businessType, set: setBusinessType },
          { label: "Score", value: score, set: setScore, type: "number" },
          { label: "Personal Credit", value: credit, set: setCredit },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5a6578", marginBottom: 4 }}>{f.label}</label>
            <input value={f.value} onChange={e => f.set(e.target.value)} type={f.type || "text"}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e6e9ef", fontSize: 13, color: "#1b2434", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5a6578", marginBottom: 4 }}>Stage</label>
          <select value={stage} onChange={e => setStage(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e6e9ef", fontSize: 13, color: "#1b2434", background: "#fff", cursor: "pointer" }}>
            {Object.entries(FUNNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ width: "100%", padding: "10px 20px", borderRadius: 10, border: "none", background: saving ? "#e6e9ef" : "#4361ee", color: saving ? "#8d95a3" : "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer" }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ─── Delete Confirmation Modal ─── */

function DeleteConfirmModal({ userName, onClose, onConfirm }: { userName: string; onClose: () => void; onConfirm: () => void }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 420, width: "100%", margin: "0 16px", boxShadow: "0 16px 48px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 12px" }}>Delete User</h2>
        <p style={{ fontSize: 14, color: "#5a6578", lineHeight: 1.6, margin: "0 0 20px" }}>
          Are you sure you want to delete <strong>{userName}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 20px", borderRadius: 10, border: "1px solid #e6e9ef", background: "#fff", color: "#5a6578", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { setDeleting(true); onConfirm(); }} disabled={deleting}
            style={{ flex: 1, padding: "10px 20px", borderRadius: 10, border: "none", background: deleting ? "#e6e9ef" : "#ef4444", color: deleting ? "#8d95a3" : "#fff", fontSize: 14, fontWeight: 700, cursor: deleting ? "default" : "pointer" }}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Dashboard ─── */

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [refFilter, setRefFilter] = useState("all");
  const [affData, setAffData] = useState<AffiliateData | null>(null);
  const [affRange, setAffRange] = useState("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [integrationHealth, setIntegrationHealth] = useState<IntegrationHealth | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<{ id: string; userEmail: string | null; userName: string | null; type: string; message: string; pageUrl: string | null; status: string; createdAt: string }[]>([]);
  const [reviewItems, setReviewItems] = useState<{ id: string; rating: number; comment: string | null; createdAt: string; userName: string | null; userEmail: string | null }[]>([]);
  const [reviewAvg, setReviewAvg] = useState(0);
  const [syncRunning, setSyncRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Chart modal state
  const [chartMetric, setChartMetric] = useState<MetricKey | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // User table state
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  // Snapshot state
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);

  const isAdmin = (session?.user as Record<string, unknown> | undefined)?.isAdmin;

  const fetchAll = useCallback(async (rf: string, ar: string) => {
    try {
      const [m, r, a, u, ih, fb, rv] = await Promise.all([
        fetch("/api/admin/metrics").then(x => x.ok ? x.json() : null),
        fetch("/api/admin/referrals" + (rf !== "all" ? "?status=" + rf : "")).then(x => x.ok ? x.json() : null),
        fetch("/api/admin/affiliate-analytics?range=" + ar).then(x => x.ok ? x.json() : null),
        fetch("/api/admin/users?limit=50").then(x => x.ok ? x.json() : null),
        fetch("/api/admin/integrations").then(x => x.ok ? x.json() : null),
        fetch("/api/admin/feedback").then(x => x.ok ? x.json() : null),
        fetch("/api/admin/reviews").then(x => x.ok ? x.json() : null),
      ]);
      if (m) setMetrics(m);
      if (r) setReferrals(r.referrals || []);
      if (a) setAffData(a);
      if (u) setUsers(u.users || []);
      if (ih) setIntegrationHealth(ih);
      if (fb) setFeedbackItems(fb.feedback || []);
      if (rv) { setReviewItems(rv.reviews || []); setReviewAvg(rv.avgRating || 0); }
    } catch { /* silent */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/metrics-history?days=90");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { router.push("/signup"); return; }
    if (!isAdmin) { router.push("/dashboard"); return; }
    fetchAll(refFilter, affRange);
    fetchHistory();
  }, [status, session, isAdmin, router, fetchAll, fetchHistory, refFilter, affRange]);

  const handleRefresh = useCallback(() => { setRefreshing(true); fetchAll(refFilter, affRange); fetchHistory(); }, [fetchAll, fetchHistory, refFilter, affRange]);

  const handleStatusChange = useCallback(async (id: string, ns: string) => {
    const res = await fetch("/api/admin/referrals/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: ns }) });
    if (res.ok) setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: ns } : r));
  }, []);

  const handleFeedbackStatus = useCallback(async (id: string, ns: string) => {
    const res = await fetch("/api/admin/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: ns }) });
    if (res.ok) setFeedbackItems(prev => prev.map(f => f.id === id ? { ...f, status: ns } : f));
  }, []);

  const handleSaveSnapshot = useCallback(async () => {
    setSnapshotSaving(true);
    try {
      await fetch("/api/admin/metrics-snapshot", { method: "POST" });
      setSnapshotSaved(true);
      setTimeout(() => setSnapshotSaved(false), 3000);
      fetchHistory();
    } catch { /* silent */ }
    setSnapshotSaving(false);
  }, [fetchHistory]);

  const handleEditSave = useCallback(async (data: Record<string, unknown>) => {
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) {
      setEditingUser(null);
      // Refresh users
      const u = await fetch("/api/admin/users?limit=50").then(x => x.ok ? x.json() : null);
      if (u) setUsers(u.users || []);
      // Refresh metrics
      const m = await fetch("/api/admin/metrics").then(x => x.ok ? x.json() : null);
      if (m) setMetrics(m);
    }
  }, []);

  const handleDelete = useCallback(async (userId: string) => {
    const res = await fetch("/api/admin/users?id=" + userId, { method: "DELETE" });
    if (res.ok) {
      setDeletingUser(null);
      setUsers(prev => prev.filter(u => u.id !== userId));
      // Refresh metrics
      const m = await fetch("/api/admin/metrics").then(x => x.ok ? x.json() : null);
      if (m) setMetrics(m);
    }
  }, []);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  }, [users, userSearch]);

  if (status === "loading" || loading) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f8" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e6e9ef", position: "relative", zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "12px 16px" : "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <div style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, background: "linear-gradient(135deg, #4361ee, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap style={{ width: isMobile ? 16 : 20, height: isMobile ? 16 : 20, color: "#fff" }} />
              </div>
              {!isMobile && <span style={{ fontSize: 20, fontWeight: 700, color: "#1b2434" }}>FixWorkFlow</span>}
            </Link>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#6366f1", color: "#fff", letterSpacing: 0.5 }}>ADMIN</span>
          </div>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/dashboard" style={{ fontSize: 13, color: "#5a6578", textDecoration: "none", fontWeight: 500 }}>Dashboard</Link>
              <Link href="/settings" style={{ fontSize: 13, color: "#5a6578", textDecoration: "none", fontWeight: 500 }}>Settings</Link>
              {session?.user && <UserAvatarDropdown user={session.user} />}
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: "#1b2434" }} aria-label="Toggle menu">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div style={{ position: "fixed", top: 56, left: 0, right: 0, bottom: 0, zIndex: 40, background: "#fff", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "14px 12px", fontSize: 16, color: "#1b2434", textDecoration: "none", borderRadius: 10, fontWeight: 500 }}>Dashboard</Link>
          <Link href="/settings" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "14px 12px", fontSize: 16, color: "#1b2434", textDecoration: "none", borderRadius: 10, fontWeight: 500 }}>Settings</Link>
          <Link href="/admin/referrals" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "14px 12px", fontSize: 16, color: "#1b2434", textDecoration: "none", borderRadius: 10, fontWeight: 500 }}>Credit Referrals</Link>
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid #e6e9ef" }}>
            {session?.user && <UserAvatarDropdown user={session.user} />}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px" : 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 16 : 24, gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#1b2434", margin: 0 }}>Admin Dashboard</h1>
            <p style={{ fontSize: isMobile ? 12 : 13, color: "#8d95a3", marginTop: 4 }}>FixWorkFlow business metrics</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSaveSnapshot} disabled={snapshotSaving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid " + (snapshotSaved ? "#10b981" : "#4361ee"), background: snapshotSaved ? "rgba(16,185,129,0.06)" : "rgba(67,97,238,0.06)", fontSize: 13, fontWeight: 600, color: snapshotSaved ? "#10b981" : "#4361ee", cursor: snapshotSaving ? "default" : "pointer", opacity: snapshotSaving ? 0.6 : 1 }}>
              <Save style={{ width: 14, height: 14 }} />
              {snapshotSaved ? "Saved!" : snapshotSaving ? "Saving..." : "Save Snapshot"}
            </button>
            <button onClick={handleRefresh} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #e6e9ef", background: "#fff", fontSize: 13, fontWeight: 600, color: "#5a6578", cursor: "pointer", opacity: refreshing ? 0.6 : 1 }}>
              <RefreshCw style={{ width: 14, height: 14 }} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* METRICS */}
        {metrics && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 16 : 24 }}>
            <MCard icon="U" accent="#4361ee" value={metrics.totalUsers} label="Total Users" sub="All time signups" onClick={() => setChartMetric("totalUsers")} />
            <MCard icon="O" accent="#10b981" value={metrics.completedOnboarding} label="Completed Onboarding" sub="Finished full setup" badge={pct(metrics.completedOnboarding, metrics.totalUsers)} onClick={() => setChartMetric("completedOnboarding")} />
            <MCard icon="P" accent="#8b5cf6" value={metrics.proSubscribers} label="Pro Subscribers" sub="Paying customers" badge={pct(metrics.proSubscribers, metrics.totalUsers)} onClick={() => setChartMetric("proSubscribers")} />
            <MCard icon="C" accent="#f59e0b" value={metrics.creditReferrals.total} label="Credit Referrals" sub={metrics.creditReferrals.pending + " pending / " + metrics.creditReferrals.contacted + " contacted / " + metrics.creditReferrals.converted + " converted"} onClick={() => setChartMetric("creditReferrals")} />
            <MCard icon="A" accent="#4361ee" value={metrics.affiliateClicks.total} label="Affiliate Clicks" sub={"Last 7 days: " + metrics.affiliateClicks.last7Days} onClick={() => setChartMetric("affiliateClicks")} />
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

        {/* Chart Modal */}
        {chartMetric && metrics && (
          <MetricChartModal
            metricKey={chartMetric}
            label={METRIC_LABELS[chartMetric]}
            color={METRIC_COLORS[chartMetric]}
            currentValue={chartMetric === "creditReferrals" ? metrics.creditReferrals.total : chartMetric === "affiliateClicks" ? metrics.affiliateClicks.total : metrics[chartMetric]}
            history={history}
            onClose={() => setChartMetric(null)}
          />
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
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 12 : 16, marginBottom: 16 }}>
              <div style={card}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#1b2434", lineHeight: 1 }}>{integrationHealth.totalConnected}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#5a6578", marginTop: 4 }}>Connected Integrations</div>
                <div style={{ fontSize: 12, color: "#8d95a3", marginTop: 4 }}>
                  {Object.entries(integrationHealth.providerBreakdown).map(([p, c]) => (
                    <span key={p} style={{ marginRight: 8 }}>{p === "shopify" ? "Shopify" : p === "stripe-data" ? "Stripe" : p}: <strong>{c}</strong></span>
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
                        const ih = await fetch("/api/admin/integrations").then(x => x.ok ? x.json() : null);
                        if (ih) setIntegrationHealth(ih);
                      } catch {}
                      setSyncRunning(false);
                    }}
                    disabled={syncRunning}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #4361ee", background: syncRunning ? "#f4f5f8" : "transparent", fontSize: 12, fontWeight: 600, color: "#4361ee", cursor: syncRunning ? "not-allowed" : "pointer", opacity: syncRunning ? 0.6 : 1 }}
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
                <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                  <thead><tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                    {["Date", "Provider", "User", "Error"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {integrationHealth.failedSyncs.map(f => (
                      <tr key={f.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 12 }}>{new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: "#1b2434", textTransform: "capitalize" as const }}>{f.provider === "stripe-data" ? "Stripe" : f.provider}</td>
                        <td style={tdStyle}>{f.userEmail || f.userName || "\u2014"}</td>
                        <td style={{ ...tdStyle, color: "#ef4444", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.error || ""}>{f.error || "\u2014"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
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
            <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead><tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                {["Date", "Name", "Email", "Phone", "Best Time", "Notes", "Score", "Status"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 12 }}>{fmtDate(r.createdAt)}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "#1b2434" }}>{r.name}</td>
                    <td style={tdStyle}><a href={"mailto:" + r.email} style={{ color: "#4361ee", textDecoration: "none" }}>{r.email}</a></td>
                    <td style={tdStyle}><a href={"tel:" + r.phone} style={{ color: "#4361ee", textDecoration: "none" }}>{r.phone}</a></td>
                    <td style={{ ...tdStyle, color: "#8d95a3" }}>{r.bestTimeToCall || "\u2014"}</td>
                    <td style={{ ...tdStyle, color: "#8d95a3", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.notes || ""}>{r.notes ? (r.notes.length > 60 ? r.notes.slice(0, 60) + "\u2026" : r.notes) : "\u2014"}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: r.userScore ? "#1b2434" : "#8d95a3" }}>{r.userScore ?? "\u2014"}</td>
                    <td style={tdStyle}>
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
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 16, marginBottom: 16 }}>
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #e6e9ef", fontSize: 13, fontWeight: 700, color: "#1b2434" }}>Top Products</div>
                  <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
                    <thead><tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                      <th style={{ ...thStyle, width: 36 }}>#</th><th style={thStyle}>Product</th><th style={{ ...thStyle, textAlign: "right" as const }}>Clicks</th><th style={thStyle}>Placements</th>
                    </tr></thead>
                    <tbody>
                      {affData.topProducts.map((p, i) => (
                        <tr key={p.name} style={{ borderBottom: "1px solid #f0f2f6" }}>
                          <td style={{ ...tdStyle, fontWeight: 600, color: "#8d95a3" }}>{i + 1}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: "#1b2434" }}>{p.name}</td>
                          <td style={{ ...tdStyle, textAlign: "right" as const, fontWeight: 700 }}>{p.totalClicks}</td>
                          <td style={tdStyle}>
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
                      <div key={i} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: isMobile ? 6 : 12, padding: isMobile ? "8px 12px" : "10px 16px", borderBottom: "1px solid #f0f2f6", fontSize: 12 }}>
                        <span style={{ color: "#8d95a3", minWidth: isMobile ? 60 : 80 }}>{relTime(c.timestamp)}</span>
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

        {/* FEEDBACK */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1b2434" }}>Feedback</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(67,97,238,0.08)", color: "#4361ee" }}>{feedbackItems.length}</span>
          </div>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead><tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                  {["Date", "User", "Type", "Message", "Status"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {feedbackItems.map(f => (
                    <tr key={f.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 12 }}>{fmtDate(f.createdAt)}</td>
                      <td style={tdStyle}><a href={"mailto:" + (f.userEmail || "")} style={{ color: "#4361ee", textDecoration: "none" }}>{f.userEmail || "\u2014"}</a></td>
                      <td style={tdStyle}><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: f.type === "bug" ? "rgba(239,68,68,0.08)" : f.type === "feature" ? "rgba(67,97,238,0.08)" : "#f4f5f8", color: f.type === "bug" ? "#ef4444" : f.type === "feature" ? "#4361ee" : "#8d95a3" }}>{f.type}</span></td>
                      <td style={{ ...tdStyle, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.message}>{f.message.length > 80 ? f.message.slice(0, 80) + "\u2026" : f.message}</td>
                      <td style={tdStyle}>
                        <select value={f.status} onChange={e => handleFeedbackStatus(f.id, e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid " + (f.status === "new" ? "#fcd34d" : f.status === "reviewed" ? "rgba(67,97,238,0.15)" : "rgba(16,185,129,0.15)"), fontSize: 12, fontWeight: 600, cursor: "pointer", background: f.status === "new" ? "#fef3c7" : f.status === "reviewed" ? "rgba(67,97,238,0.07)" : "rgba(16,185,129,0.07)", color: f.status === "new" ? "#92400e" : f.status === "reviewed" ? "#4361ee" : "#10b981" }}>
                          <option value="new">New</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {feedbackItems.length === 0 && <tr><td colSpan={5} style={{ padding: "32px 16px", textAlign: "center", color: "#8d95a3", fontSize: 13 }}>No feedback yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* REVIEWS */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1b2434" }}>Reviews</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(67,97,238,0.08)", color: "#4361ee" }}>{reviewItems.length}</span>
            {reviewAvg > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#facc15", display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={14} fill="#facc15" color="#facc15" /> {reviewAvg}/5 avg
              </span>
            )}
          </div>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead><tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                  {["Date", "User", "Rating", "Comment"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {reviewItems.map(rv => (
                    <tr key={rv.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 12 }}>{fmtDate(rv.createdAt)}</td>
                      <td style={tdStyle}>
                        <div>
                          <span style={{ fontWeight: 600, color: "#1b2434" }}>{rv.userName || "\u2014"}</span>
                          {rv.userEmail && <span style={{ fontSize: 11, color: "#8d95a3", marginLeft: 6 }}>{rv.userEmail}</span>}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={14} fill={s <= rv.rating ? "#facc15" : "none"} color={s <= rv.rating ? "#facc15" : "#d1d5db"} strokeWidth={1.5} />
                          ))}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rv.comment || ""}>
                        {rv.comment || <span style={{ color: "#8d95a3" }}>No comment</span>}
                      </td>
                    </tr>
                  ))}
                  {reviewItems.length === 0 && <tr><td colSpan={4} style={{ padding: "32px 16px", textAlign: "center", color: "#8d95a3", fontSize: 13 }}>No reviews yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* USERS */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1b2434" }}>Users</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(67,97,238,0.08)", color: "#4361ee" }}>{metrics?.totalUsers ?? users.length}</span>
            <div style={{ marginLeft: "auto", position: "relative" }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#8d95a3" }} />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search name or email..."
                style={{ padding: "8px 12px 8px 32px", borderRadius: 8, border: "1px solid #e6e9ef", fontSize: 13, color: "#1b2434", width: isMobile ? 200 : 260, background: "#fff" }}
              />
            </div>
          </div>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead><tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                {["Name", "Email", "Business Type", "Score", "Stage", "Personal Credit", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredUsers.map(u => {
                  const fl = FUNNEL_LABELS[u.funnelStage] || "Signed up";
                  const fbg = FUNNEL_BG[u.funnelStage] || "#f4f5f8";
                  const ffg = FUNNEL_FG[u.funnelStage] || "#8d95a3";
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: "#1b2434" }}>{u.name || "\u2014"}</td>
                      <td style={tdStyle}>{u.email || "\u2014"}</td>
                      <td style={{ ...tdStyle, textTransform: "capitalize" as const }}>{u.businessType?.replace(/_/g, " ") || "\u2014"}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: u.score ? "#1b2434" : "#8d95a3" }}>{u.score ?? "\u2014"}</td>
                      <td style={tdStyle}><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: fbg, color: ffg }}>{fl}</span></td>
                      <td style={{ ...tdStyle, textTransform: "capitalize" as const, color: u.usesPersonalCredit ? "#1b2434" : "#8d95a3" }}>{u.usesPersonalCredit || "\u2014"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setEditingUser(u)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "1px solid #e6e9ef", background: "#fff", cursor: "pointer", color: "#4361ee" }} title="Edit user">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeletingUser(u)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "1px solid #e6e9ef", background: "#fff", cursor: "pointer", color: "#ef4444" }} title="Delete user">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && <tr><td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", color: "#8d95a3", fontSize: 13 }}>{userSearch ? "No users match your search." : "No users yet."}</td></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleEditSave} />}

        {/* Delete Confirmation Modal */}
        {deletingUser && <DeleteConfirmModal userName={deletingUser.name || deletingUser.email || "this user"} onClose={() => setDeletingUser(null)} onConfirm={() => handleDelete(deletingUser.id)} />}
      </div>
    </div>
  );
}

function MCard({ icon, accent, value, label, sub, badge, onClick }: { icon: string; accent: string; value: number; label: string; sub: string; badge?: string; onClick?: () => void }) {
  return (
    <div style={{ ...card, cursor: onClick ? "pointer" : "default", transition: "box-shadow 0.15s, border-color 0.15s" }} onClick={onClick}
      onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = accent + "40"; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "#e6e9ef"; }}>
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
