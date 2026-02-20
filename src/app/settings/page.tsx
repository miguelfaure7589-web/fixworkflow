"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserAvatarDropdown from "@/components/UserAvatarDropdown";
import { Zap, Loader2, ChevronDown, Menu, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useIsMobile } from "@/hooks/useMediaQuery";

// ── Types ──

interface NotifPrefs {
  scoreUpdates: boolean;
  playbookReminders: boolean;
  newRecommendations: boolean;
  productUpdates: boolean;
  tipsInsights: boolean;
  marketingEmails: boolean;
}

interface PrivacyPrefs {
  anonymousAnalytics: boolean;
  personalizedRecs: boolean;
}

const DEFAULT_NOTIF: NotifPrefs = {
  scoreUpdates: true,
  playbookReminders: true,
  newRecommendations: true,
  productUpdates: true,
  tipsInsights: true,
  marketingEmails: false,
};

const DEFAULT_PRIVACY: PrivacyPrefs = {
  anonymousAnalytics: true,
  personalizedRecs: true,
};

// ── Sections ──

const SECTIONS = [
  { id: "account", icon: "\u{1F464}", label: "Account" },
  { id: "integrations", icon: "\u{1F517}", label: "Integrations" },
  { id: "billing", icon: "\u{1F4B3}", label: "Subscription & Billing" },
  { id: "notifications", icon: "\u{1F514}", label: "Notifications" },
  { id: "privacy", icon: "\u{1F512}", label: "Privacy & Data" },
  { id: "faq", icon: "\u2753", label: "FAQ & Help" },
  { id: "legal", icon: "\u{1F4C4}", label: "Legal" },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: "service_agency", label: "Service / Agency" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "saas", label: "SaaS" },
  { value: "creator", label: "Creator / Freelancer" },
  { value: "local_business", label: "Local Business" },
];

// ── Styles ──

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  border: "1px solid #e6e9ef",
  padding: 24,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 9,
  border: "1px solid #e6e9ef",
  fontSize: 14,
  color: "#1b2434",
  outline: "none",
  transition: "border 0.2s, box-shadow 0.2s",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#1b2434",
  marginBottom: 4,
};

const gradientBg = "linear-gradient(135deg, #4361ee, #6366f1)";

// ── Integration types ──

interface ConnectedIntegration {
  id: string;
  provider: string;
  status: string;
  storeDomain: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
}

const PILLAR_LABELS_MAP: Record<string, string> = {
  revenue: "Revenue",
  profitability: "Profitability",
  retention: "Retention",
  acquisition: "Acquisition",
  operations: "Operations",
};

const PROVIDER_CATALOG = [
  {
    id: "shopify",
    name: "Shopify",
    icon: "cdn.shopify.com",
    description: "Sync revenue, orders, customers, and conversion data.",
    pillarsAffected: ["revenue", "profitability", "retention", "acquisition"],
    status: "active" as const,
    scopesPlainEnglish: [
      "Read your orders and revenue data",
      "Read customer information (repeat rates, new customers)",
      "Read store analytics (traffic, conversion)",
    ],
    noAccessLabel: "We cannot modify orders, products, or settings",
    needsStoreDomain: true,
    connectEndpoint: "/api/integrations/shopify/connect",
  },
  {
    id: "stripe-data",
    name: "Stripe",
    icon: "stripe.com",
    description: "Sync payment data, MRR, fees, and customer growth.",
    pillarsAffected: ["revenue", "profitability", "retention"],
    status: "active" as const,
    scopesPlainEnglish: [
      "Read your charges and payment data",
      "Read subscription and MRR data",
      "Read customer information",
    ],
    noAccessLabel: "We cannot create charges or modify your account",
    needsStoreDomain: false,
    connectEndpoint: "/api/integrations/stripe-data/connect",
    extraNote: "This connects to the Stripe account where you collect payments from your customers. It is separate from your FixWorkFlow Pro subscription.",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    icon: "quickbooks.intuit.com",
    description: "Sync accounting data, margins, expenses, and invoices.",
    pillarsAffected: ["profitability", "operations"],
    status: "coming_soon" as const,
    scopesPlainEnglish: ["Read income and expense reports", "Read invoice and payment data"],
    noAccessLabel: "",
    needsStoreDomain: false,
    connectEndpoint: "",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    icon: "analytics.google.com",
    description: "Sync traffic, conversion rates, and acquisition channels.",
    pillarsAffected: ["acquisition", "revenue"],
    status: "coming_soon" as const,
    scopesPlainEnglish: ["Read traffic and session data", "Read conversion and goal data"],
    noAccessLabel: "",
    needsStoreDomain: false,
    connectEndpoint: "",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    icon: "mailchimp.com",
    description: "Sync email performance, list growth, and campaign revenue.",
    pillarsAffected: ["acquisition", "retention"],
    status: "coming_soon" as const,
    scopesPlainEnglish: ["Read email campaign performance", "Read subscriber list data"],
    noAccessLabel: "",
    needsStoreDomain: false,
    connectEndpoint: "",
  },
];

// ── Toggle Switch ──

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? "#4361ee" : "#e6e9ef",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          position: "absolute",
          top: 2,
          left: on ? 22 : 2,
          transition: "left 0.2s ease",
        }}
      />
    </button>
  );
}

// ── Accordion Item ──

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e6e9ef", marginBottom: 8, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          cursor: "pointer",
          border: "none",
          background: "transparent",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1b2434" }}>{q}</span>
        <ChevronDown
          style={{
            width: 16,
            height: 16,
            color: "#8d95a3",
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      <div
        ref={contentRef}
        style={{
          maxHeight: open ? (contentRef.current?.scrollHeight ?? 500) + 20 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <div style={{ padding: "0 18px 16px", fontSize: 13, color: "#5a6578", lineHeight: 1.7 }}>{a}</div>
      </div>
    </div>
  );
}

// ── Long-form accordion (for legal) ──

function LegalAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e6e9ef", marginBottom: 8, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          cursor: "pointer",
          border: "none",
          background: "transparent",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1b2434" }}>{title}</span>
        <ChevronDown
          style={{
            width: 16,
            height: 16,
            color: "#8d95a3",
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      <div
        ref={contentRef}
        style={{
          maxHeight: open ? 5000 : 0,
          overflow: "hidden",
          transition: "max-height 0.4s ease",
        }}
      >
        <div style={{ padding: "0 18px 16px", fontSize: 13, color: "#5a6578", lineHeight: 1.75 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ──

function DeleteModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 28,
          maxWidth: 440,
          width: "100%",
          margin: "0 16px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 8px" }}>Are you sure?</h3>
        <p style={{ fontSize: 13, color: "#5a6578", lineHeight: 1.7, margin: "0 0 16px" }}>
          This will permanently delete your account, business profile, diagnosis data, playbook progress, and all
          associated information. This cannot be reversed.
        </p>
        <label style={{ ...labelStyle, marginBottom: 8 }}>
          Type <strong>DELETE</strong> to confirm
        </label>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="DELETE"
          style={{ ...inputStyle, marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 18px",
              borderRadius: 9,
              border: "1px solid #e6e9ef",
              background: "#fff",
              color: "#5a6578",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            disabled={typed !== "DELETE" || deleting}
            onClick={async () => {
              setDeleting(true);
              onConfirm();
            }}
            style={{
              flex: 1,
              padding: "10px 18px",
              borderRadius: 9,
              border: "none",
              background: typed === "DELETE" ? "#ef4444" : "#e6e9ef",
              color: typed === "DELETE" ? "#fff" : "#8d95a3",
              fontSize: 13,
              fontWeight: 600,
              cursor: typed === "DELETE" ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? "Deleting..." : "Yes, Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Subscription Modal ──

function CancelModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  const [cancelling, setCancelling] = useState(false);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 28,
          maxWidth: 420,
          width: "100%",
          margin: "0 16px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 8px" }}>Cancel your Pro subscription?</h3>
        <p style={{ fontSize: 13, color: "#5a6578", lineHeight: 1.7, margin: "0 0 20px" }}>
          You will keep Pro features until the end of your current billing period. After that, your account will revert
          to the Free plan.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={async () => {
              setCancelling(true);
              onConfirm();
            }}
            disabled={cancelling}
            style={{
              flex: 1,
              padding: "10px 18px",
              borderRadius: 9,
              border: "1px solid #e6e9ef",
              background: "#fff",
              color: "#5a6578",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              opacity: cancelling ? 0.6 : 1,
            }}
          >
            {cancelling ? "Cancelling..." : "Cancel Subscription"}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 18px",
              borderRadius: 9,
              border: "none",
              background: gradientBg,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Keep Pro
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Page ──

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [active, setActive] = useState("account");
  const [menuOpen, setMenuOpen] = useState(false);

  // Account form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [origProfile, setOrigProfile] = useState({ name: "", email: "", businessName: "", businessType: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  // Subscription
  const isPremium = !!(session?.user as Record<string, unknown> | undefined)?.isPremium;
  const isAdminAccount = !!(session?.user as Record<string, unknown> | undefined)?.isAdmin;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [cancellationDate, setCancellationDate] = useState<string | null>(null);
  const [hasStripeSub, setHasStripeSub] = useState(false);

  // Billing history
  interface Invoice {
    id: string;
    date: string | null;
    description: string;
    amount: string;
    status: string;
    invoiceUrl: string | null;
  }
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF);

  // Privacy
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPrefs>(DEFAULT_PRIVACY);
  const [exporting, setExporting] = useState(false);

  // Integrations
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);
  const [connectModalProvider, setConnectModalProvider] = useState<string | null>(null);
  const [shopifyStore, setShopifyStore] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/signup");
    }
  }, [session, status, router]);

  // Load user data
  useEffect(() => {
    if (!session?.user) return;
    const u = session.user as Record<string, unknown>;
    const n = (u.name as string) || "";
    const e = (u.email as string) || "";
    setName(n);
    setEmail(e);

    // Fetch full profile data
    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((data) => {
        const bp = data.businessProfile;
        const bn = bp?.businessName || "";
        const bt = bp?.businessType || "";
        const ph = (data.phone as string) || "";
        const prov = data.authProvider || null;
        setBusinessName(bn);
        setBusinessType(bt);
        setPhone(ph);
        setAuthProvider(prov);
        setHasPassword(!!data.hasPassword);
        setOrigProfile({ name: n, email: e, businessName: bn, businessType: bt, phone: ph });

        if (data.notificationPrefs) setNotifPrefs({ ...DEFAULT_NOTIF, ...data.notificationPrefs });
        if (data.privacyPrefs) setPrivacyPrefs({ ...DEFAULT_PRIVACY, ...data.privacyPrefs });
        if (data.cancellationDate) setCancellationDate(data.cancellationDate);
        if (data.hasStripeSubscription) setHasStripeSub(true);

        // Fetch integrations
        fetch("/api/integrations")
          .then((r) => r.json())
          .then((d) => {
            if (d.integrations) setConnectedIntegrations(d.integrations);
          })
          .catch(() => toast("Failed to load integrations. Please try again.", "error"))
          .finally(() => setIntegrationsLoading(false));

        // Fetch billing history if user has a Stripe customer
        if (data.stripeCustomerId) {
          setInvoicesLoading(true);
          fetch("/api/settings/billing-history")
            .then((r) => r.json())
            .then((bh) => {
              if (bh.invoices) setInvoices(bh.invoices);
            })
            .catch(() => toast("Failed to load billing history.", "error"))
            .finally(() => setInvoicesLoading(false));
        }
      })
      .catch(() => toast("Failed to load profile data.", "error"));
  }, [session, toast]);

  const profileChanged =
    name !== origProfile.name ||
    email !== origProfile.email ||
    businessName !== origProfile.businessName ||
    businessType !== origProfile.businessType ||
    phone !== origProfile.phone;

  const saveProfile = useCallback(async () => {
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, businessName, businessType, phone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error || "Failed to save");
      }
      setOrigProfile({ name, email, businessName, businessType, phone });
      setProfileMsg("Saved successfully");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (err) {
      setProfileMsg((err as Error).message);
    } finally {
      setProfileSaving(false);
    }
  }, [name, email, businessName, businessType, phone]);

  const deleteAccount = useCallback(async () => {
    try {
      await fetch("/api/settings/account", { method: "DELETE" });
      await signOut({ callbackUrl: "/" });
    } catch {
      // signOut will redirect regardless
    }
  }, []);

  const updateNotif = useCallback(async (key: keyof NotifPrefs, value: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
    await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }).catch(() => toast("Failed to save notification preferences. Please try again.", "error"));
  }, [toast]);

  const updatePrivacy = useCallback(async (key: keyof PrivacyPrefs, value: boolean) => {
    setPrivacyPrefs((prev) => ({ ...prev, [key]: value }));
    await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, type: "privacy" }),
    }).catch(() => toast("Failed to save privacy preferences. Please try again.", "error"));
  }, [toast]);

  const exportData = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export-data");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fixworkflow-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  }, []);

  const handleUpgrade = useCallback(async () => {
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch {
      setUpgradeLoading(false);
    }
  }, []);

  const openPortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/cancel-subscription", { method: "POST" });
      const data = await res.json();
      if (data.cancellationDate) setCancellationDate(data.cancellationDate);
    } catch {}
    setCancelOpen(false);
  }, []);

  // Integration actions
  const connectIntegration = useCallback(async (providerId: string, storeDomain?: string) => {
    setConnecting(true);
    setConnectError("");
    const catalog = PROVIDER_CATALOG.find((p) => p.id === providerId);
    if (!catalog || catalog.status !== "active") return;

    try {
      const body: Record<string, string> = {};
      if (storeDomain) body.storeDomain = storeDomain;

      const res = await fetch(catalog.connectEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setConnectError(data.error || "Failed to connect");
        setConnecting(false);
        return;
      }
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      setConnectError("Connection failed. Please try again.");
      setConnecting(false);
    }
  }, []);

  const triggerSync = useCallback(async (integrationId: string) => {
    setSyncing(integrationId);
    try {
      await fetch(`/api/integrations/${integrationId}/sync`, { method: "POST" });
      // Refresh integrations list
      const res = await fetch("/api/integrations");
      const data = await res.json();
      if (data.integrations) setConnectedIntegrations(data.integrations);
    } catch {}
    setSyncing(null);
  }, []);

  const disconnectIntegration = useCallback(async (integrationId: string) => {
    try {
      await fetch(`/api/integrations/${integrationId}`, { method: "DELETE" });
      setConnectedIntegrations((prev) => prev.filter((i) => i.id !== integrationId));
    } catch {}
    setDisconnectConfirm(null);
  }, []);

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (status === "loading" || !session?.user) {
    return null; // Next.js loading.tsx skeleton handles this
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f8", fontFamily: "var(--font-outfit, var(--font-geist-sans)), sans-serif" }}>
      {/* NAV — matches dashboard */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e6e9ef", position: "relative", zIndex: 50 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "12px 16px" : "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, background: gradientBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap style={{ width: isMobile ? 16 : 20, height: isMobile ? 16 : 20, color: "#fff" }} />
            </div>
            <span style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: "#1b2434" }}>FixWorkFlow</span>
          </Link>
          {/* Desktop nav */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/dashboard" style={{ fontSize: 13, color: "#5a6578", textDecoration: "none", fontWeight: 500 }}>Dashboard</Link>
              {!isPremium && (
                <Link
                  href="/pricing"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 18px",
                    borderRadius: 8,
                    background: gradientBg,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Upgrade to Pro
                </Link>
              )}
              {!!(session.user as Record<string, unknown>)?.isAdmin && (
                <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>
                  Admin
                  <span style={{ fontSize: 9, fontWeight: 800, background: "#7c3aed", color: "#fff", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>ADMIN</span>
                </Link>
              )}
              <UserAvatarDropdown user={session.user} />
            </div>
          )}
          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: "#1b2434" }} aria-label="Toggle menu">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMobile && menuOpen && (
        <div style={{ position: "fixed", top: 56, left: 0, right: 0, bottom: 0, zIndex: 40, background: "#fff", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "14px 12px", fontSize: 16, color: "#1b2434", textDecoration: "none", borderRadius: 10, fontWeight: 500 }}>Dashboard</Link>
          {!isPremium && (
            <Link href="/pricing" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "14px 12px", fontSize: 16, color: "#1b2434", textDecoration: "none", borderRadius: 10, fontWeight: 500 }}>Upgrade to Pro</Link>
          )}
          {!!(session.user as Record<string, unknown>)?.isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "14px 12px", fontSize: 16, color: "#7c3aed", textDecoration: "none", borderRadius: 10, fontWeight: 600 }}>Admin</Link>
          )}
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid #e6e9ef" }}>
            <UserAvatarDropdown user={session.user} />
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "0 16px 24px" : 24, display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 0 : 32 }}>
        {/* LEFT SIDEBAR / MOBILE HORIZONTAL TABS */}
        {isMobile ? (
          <div style={{
            display: "flex",
            overflowX: "auto",
            gap: 4,
            padding: "12px 0",
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#f4f5f8",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: active === s.id ? 600 : 500,
                  color: active === s.id ? "#4361ee" : "#5a6578",
                  background: active === s.id ? "rgba(67,97,238,0.07)" : "#fff",
                  border: active === s.id ? "1px solid rgba(67,97,238,0.2)" : "1px solid #e6e9ef",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 13 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ width: 220, flexShrink: 0, position: "sticky", top: 80, alignSelf: "flex-start" }}>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active === s.id ? 600 : 500,
                  color: active === s.id ? "#4361ee" : "#5a6578",
                  background: active === s.id ? "rgba(67,97,238,0.07)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => {
                  if (active !== s.id) (e.currentTarget.style.background = "#fafbfd");
                }}
                onMouseLeave={(e) => {
                  if (active !== s.id) (e.currentTarget.style.background = "transparent");
                }}
              >
                <span style={{ fontSize: 15 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* RIGHT CONTENT */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: isMobile ? 32 : 48 }}>

          {/* ── SECTION 1: ACCOUNT ── */}
          <section id="section-account">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 4px" }}>Account Settings</h2>
            <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 20px" }}>Manage your profile and login information.</p>

            {/* Profile */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <span style={{ fontSize: 11, color: "#8d95a3", marginTop: 2, display: "block" }}>
                    Changing your email will require re-verification
                  </span>
                </div>
                <div>
                  <label style={labelStyle}>Business Name</label>
                  <input style={inputStyle} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business name" />
                </div>
                <div>
                  <label style={labelStyle}>Business Type</label>
                  <select
                    style={{ ...inputStyle, appearance: "auto" }}
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  >
                    <option value="">Select type</option>
                    {BUSINESS_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input style={inputStyle} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  disabled={!profileChanged || profileSaving}
                  onClick={saveProfile}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 9,
                    border: "none",
                    background: profileChanged ? gradientBg : "#e6e9ef",
                    color: profileChanged ? "#fff" : "#8d95a3",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: profileChanged ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    opacity: profileSaving ? 0.6 : 1,
                  }}
                >
                  {profileSaving ? "Saving..." : "Save Changes"}
                </button>
                {profileMsg && (
                  <span style={{ fontSize: 12, color: profileMsg === "Saved successfully" ? "#10b981" : "#ef4444" }}>
                    {profileMsg}
                  </span>
                )}
              </div>
            </div>

            {/* Password / Auth Provider */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1b2434", margin: "0 0 8px" }}>Password</h3>
              {authProvider ? (
                <p style={{ fontSize: 13, color: "#5a6578", margin: 0 }}>
                  You signed in with <strong style={{ textTransform: "capitalize" }}>{authProvider}</strong>. Password is
                  managed by {authProvider}.
                </p>
              ) : hasPassword ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setPasswordMsg("");
                    if (newPassword.length < 8) {
                      setPasswordMsg("New password must be at least 8 characters");
                      return;
                    }
                    if (newPassword !== confirmNewPassword) {
                      setPasswordMsg("Passwords do not match");
                      return;
                    }
                    setPasswordSaving(true);
                    try {
                      const res = await fetch("/api/settings/password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ currentPassword, newPassword }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setPasswordMsg(data.error || "Failed to update password");
                      } else {
                        setPasswordMsg("Password updated successfully");
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                      }
                    } catch {
                      setPasswordMsg("Failed to update password");
                    }
                    setPasswordSaving(false);
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#5a6578", display: "block", marginBottom: 4 }}>
                        Current password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#5a6578", display: "block", marginBottom: 4 }}>
                        New password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#5a6578", display: "block", marginBottom: 4 }}>
                        Confirm new password
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        minLength={8}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        style={{
                          padding: "8px 20px",
                          borderRadius: 8,
                          border: "none",
                          background: gradientBg,
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          opacity: passwordSaving ? 0.6 : 1,
                        }}
                      >
                        {passwordSaving ? "Saving..." : "Update Password"}
                      </button>
                      {passwordMsg && (
                        <span style={{ fontSize: 12, color: passwordMsg === "Password updated successfully" ? "#10b981" : "#ef4444" }}>
                          {passwordMsg}
                        </span>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                <p style={{ fontSize: 13, color: "#5a6578", margin: 0 }}>
                  Password management is not available for your auth method.
                </p>
              )}
            </div>

            {/* Delete Account */}
            <div
              style={{
                background: "rgba(239,68,68,0.04)",
                border: "1px solid rgba(239,68,68,0.1)",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>Delete Account</div>
              <p style={{ fontSize: 13, color: "#5a6578", margin: "0 0 12px", lineHeight: 1.6 }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setDeleteOpen(true)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid #ef4444",
                  background: "transparent",
                  color: "#ef4444",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Delete My Account
              </button>
            </div>
          </section>

          {/* ── SECTION: INTEGRATIONS ── */}
          <section id="section-integrations">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 4px" }}>Connected Services</h2>
            <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 20px" }}>Connect your tools to auto-sync your business metrics every week.</p>

            {integrationsLoading ? (
              <div style={{ ...cardStyle, textAlign: "center", padding: 32 }}>
                <Loader2 style={{ width: 20, height: 20, color: "#8d95a3", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                <p style={{ fontSize: 13, color: "#8d95a3", margin: 0 }}>Loading integrations...</p>
              </div>
            ) : (
              <>
                {/* Connected integrations */}
                {connectedIntegrations.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    {connectedIntegrations.map((intg) => {
                      const catalog = PROVIDER_CATALOG.find((p) => p.id === intg.provider);
                      const statusColor = intg.status === "connected" ? "#10b981" : intg.status === "syncing" ? "#f59e0b" : "#ef4444";
                      const statusLabel = intg.status === "connected" ? "Connected" : intg.status === "syncing" ? "Syncing..." : "Error";

                      return (
                        <div key={intg.id} style={{ ...cardStyle, marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            {/* Provider icon */}
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${catalog?.icon || intg.provider}&sz=64`}
                              alt={`${catalog?.name || intg.provider} logo`}
                              style={{ width: 40, height: 40, borderRadius: 10, background: "#f4f5f8" }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 16, fontWeight: 700, color: "#1b2434" }}>{catalog?.name || intg.provider}</span>
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                                  background: statusColor + "14", color: statusColor,
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
                                  {statusLabel}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: "#8d95a3", marginTop: 2 }}>
                                {intg.lastSyncAt
                                  ? `Last synced: ${new Date(intg.lastSyncAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} at ${new Date(intg.lastSyncAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                                  : "Never synced \u2014 first sync pending"
                                }
                                {intg.storeDomain && <span> &middot; {intg.storeDomain}</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button
                                onClick={() => triggerSync(intg.id)}
                                disabled={syncing === intg.id}
                                style={{
                                  padding: "7px 16px", borderRadius: 8,
                                  border: "1px solid #4361ee", background: "transparent",
                                  color: "#4361ee", fontSize: 12, fontWeight: 600,
                                  cursor: syncing === intg.id ? "not-allowed" : "pointer",
                                  fontFamily: "inherit", opacity: syncing === intg.id ? 0.6 : 1,
                                }}
                              >
                                {syncing === intg.id ? "Syncing..." : "Sync Now"}
                              </button>
                              <button
                                onClick={() => setDisconnectConfirm(intg.id)}
                                style={{
                                  background: "none", border: "none",
                                  fontSize: 12, color: "#ef4444",
                                  cursor: "pointer", fontFamily: "inherit",
                                }}
                              >
                                Disconnect
                              </button>
                            </div>
                          </div>
                          {/* Error message */}
                          {intg.status === "error" && intg.lastSyncError && (
                            <div style={{
                              marginTop: 10, padding: "8px 12px", borderRadius: 8,
                              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)",
                              fontSize: 12, color: "#ef4444",
                            }}>
                              {intg.lastSyncError}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Available integrations */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                  {PROVIDER_CATALOG
                    .filter((p) => !connectedIntegrations.some((c) => c.provider === p.id))
                    .map((provider) => {
                      const isComingSoon = provider.status === "coming_soon";
                      return (
                        <div
                          key={provider.id}
                          style={{
                            ...cardStyle,
                            opacity: isComingSoon ? 0.65 : 1,
                            display: "flex", flexDirection: "column",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${provider.icon}&sz=64`}
                              alt={`${provider.name} logo`}
                              style={{ width: 40, height: 40, borderRadius: 10, background: "#f4f5f8" }}
                            />
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#1b2434" }}>{provider.name}</span>
                          </div>
                          <p style={{ fontSize: 13, color: "#5a6578", margin: "0 0 8px", lineHeight: 1.5 }}>
                            {provider.description}
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                            {provider.pillarsAffected.map((p) => (
                              <span key={p} style={{
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                                background: "rgba(67,97,238,0.06)", color: "#4361ee",
                              }}>
                                {PILLAR_LABELS_MAP[p] || p}
                              </span>
                            ))}
                          </div>
                          <div style={{ marginTop: "auto" }}>
                            {isComingSoon ? (
                              <button
                                disabled
                                style={{
                                  width: "100%", padding: "10px 18px", borderRadius: 9,
                                  border: "1px solid #e6e9ef", background: "#f4f5f8",
                                  color: "#8d95a3", fontSize: 13, fontWeight: 600,
                                  cursor: "not-allowed", fontFamily: "inherit",
                                }}
                              >
                                Coming Soon
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setConnectModalProvider(provider.id);
                                  setConnectError("");
                                  setShopifyStore("");
                                }}
                                style={{
                                  width: "100%", padding: "10px 18px", borderRadius: 9,
                                  border: "none", background: gradientBg,
                                  color: "#fff", fontSize: 13, fontWeight: 700,
                                  cursor: "pointer", fontFamily: "inherit",
                                }}
                              >
                                Connect
                              </button>
                            )}
                          </div>
                          {!isComingSoon && (
                            <div style={{ fontSize: 11, color: "#8d95a3", marginTop: 8 }}>
                              Access: {provider.scopesPlainEnglish.join(" \u00b7 ")}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </section>

          {/* ── SECTION 2: SUBSCRIPTION & BILLING ── */}
          <section id="section-billing">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 4px" }}>Subscription & Billing</h2>
            <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 20px" }}>Manage your plan and payment information.</p>

            {/* Current Plan */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1b2434", margin: 0 }}>Current Plan</h3>
                {isPremium ? (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: 6,
                      background: gradientBg,
                      color: "#fff",
                      letterSpacing: 0.5,
                    }}
                  >
                    PRO
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 6,
                      background: "#f0f2f6",
                      color: "#8d95a3",
                    }}
                  >
                    FREE
                  </span>
                )}
              </div>

              {isPremium && isAdminAccount ? (
                <p style={{ fontSize: 13, color: "#5a6578", margin: 0, lineHeight: 1.6 }}>
                  Admin Account &mdash; Pro features enabled. No Stripe subscription required.
                </p>
              ) : isPremium ? (
                <>
                  <p style={{ fontSize: 13, color: "#5a6578", margin: "0 0 16px" }}>
                    You are on the Pro plan.
                    {cancellationDate && (
                      <span style={{ color: "#f59e0b" }}>
                        {" "}Cancels on {new Date(cancellationDate).toLocaleDateString()}.
                      </span>
                    )}
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={openPortal}
                      disabled={portalLoading || !hasStripeSub}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 9,
                        border: "1px solid #4361ee",
                        background: "transparent",
                        color: "#4361ee",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: portalLoading || !hasStripeSub ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                        opacity: portalLoading ? 0.6 : 1,
                      }}
                    >
                      {portalLoading ? "Loading..." : "Manage Subscription"}
                    </button>
                  </div>
                  {!cancellationDate && (
                    <div style={{ marginTop: 16 }}>
                      <button
                        onClick={() => setCancelOpen(true)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 12,
                          color: "#8d95a3",
                          cursor: "pointer",
                          textDecoration: "none",
                          fontFamily: "inherit",
                          padding: 0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        Cancel subscription
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "#5a6578", margin: "0 0 16px", lineHeight: 1.6 }}>
                    You are on the free plan. Upgrade to Pro to unlock AI summaries, full playbooks, score projections,
                    and deep reasoning.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 16 }}>
                    <div style={{ padding: 14, borderRadius: 10, background: "#fafbfd", border: "1px solid #e6e9ef" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#8d95a3", marginBottom: 8 }}>Free</div>
                      {[
                        "Revenue Health Score",
                        "Top 2 pillar insights",
                        "2 playbook steps",
                        "1 tool recommendation",
                      ].map((f) => (
                        <div key={f} style={{ fontSize: 12, color: "#5a6578", marginBottom: 4, display: "flex", gap: 6 }}>
                          <span style={{ color: "#10b981" }}>&#10003;</span> {f}
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: 14, borderRadius: 10, background: "rgba(67,97,238,0.03)", border: "1px solid rgba(67,97,238,0.12)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#4361ee", marginBottom: 8 }}>Pro</div>
                      {[
                        "Everything in Free",
                        "AI Business Summary",
                        "Full 5-step playbooks",
                        "Score projections",
                        "All tool recommendations",
                        "Progress tracking",
                        "Deep reasoning",
                      ].map((f) => (
                        <div key={f} style={{ fontSize: 12, color: "#5a6578", marginBottom: 4, display: "flex", gap: 6 }}>
                          <span style={{ color: "#4361ee" }}>&#10003;</span> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgradeLoading}
                    style={{
                      display: "inline-block",
                      padding: "10px 24px",
                      borderRadius: 9,
                      border: "none",
                      background: gradientBg,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: upgradeLoading ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      opacity: upgradeLoading ? 0.6 : 1,
                    }}
                  >
                    {upgradeLoading ? "Redirecting..." : "Upgrade to Pro \u2192"}
                  </button>
                </>
              )}
            </div>

            {/* Billing History */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1b2434", margin: "0 0 12px" }}>Billing History</h3>
              {invoicesLoading ? (
                <p style={{ fontSize: 13, color: "#8d95a3", margin: 0 }}>Loading billing history...</p>
              ) : invoices.length === 0 ? (
                <p style={{ fontSize: 13, color: "#8d95a3", margin: 0 }}>
                  Billing history will appear here once you subscribe to Pro.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e6e9ef" }}>
                        <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600, color: "#8d95a3", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Date</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600, color: "#8d95a3", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</th>
                        <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 600, color: "#8d95a3", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Amount</th>
                        <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 600, color: "#8d95a3", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                        <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 600, color: "#8d95a3", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                          <td style={{ padding: "10px 10px", color: "#5a6578" }}>
                            {inv.date ? new Date(inv.date).toLocaleDateString() : "—"}
                          </td>
                          <td style={{ padding: "10px 10px", color: "#1b2434" }}>
                            {inv.description}
                          </td>
                          <td style={{ padding: "10px 10px", color: "#1b2434", textAlign: "right", fontWeight: 600 }}>
                            ${inv.amount}
                          </td>
                          <td style={{ padding: "10px 10px", textAlign: "center" }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: inv.status === "paid" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                              color: inv.status === "paid" ? "#10b981" : "#ef4444",
                              textTransform: "capitalize",
                            }}>
                              {inv.status}
                            </span>
                          </td>
                          <td style={{ padding: "10px 10px", textAlign: "right" }}>
                            {inv.invoiceUrl && (
                              <a
                                href={inv.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: 12, color: "#4361ee", textDecoration: "none", fontWeight: 600 }}
                              >
                                View
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* ── SECTION 3: NOTIFICATIONS ── */}
          <section id="section-notifications">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 4px" }}>Notifications</h2>
            <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 20px" }}>Choose what updates you want to receive.</p>

            <div style={cardStyle}>
              {([
                { key: "scoreUpdates" as const, label: "Score updates", desc: "Get notified when your Revenue Health Score changes." },
                { key: "playbookReminders" as const, label: "Playbook reminders", desc: "Weekly nudge to complete your next playbook step." },
                { key: "newRecommendations" as const, label: "New recommendations", desc: "When new tools or resources match your profile." },
                { key: "productUpdates" as const, label: "Product updates", desc: "New features and improvements to FixWorkFlow." },
                { key: "tipsInsights" as const, label: "Tips & insights", desc: "Personalized business tips based on your metrics." },
                { key: "marketingEmails" as const, label: "Marketing emails", desc: "Promotions, case studies, and partner offers." },
              ] as const).map((item, i, arr) => (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "14px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid #f0f2f6" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1b2434" }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#8d95a3", marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <Toggle on={notifPrefs[item.key]} onChange={(v) => updateNotif(item.key, v)} />
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 4: PRIVACY & DATA ── */}
          <section id="section-privacy">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 4px" }}>Privacy & Data</h2>
            <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 20px" }}>Control your data and privacy settings.</p>

            {/* Data Usage */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              {([
                {
                  key: "anonymousAnalytics" as const,
                  label: "Allow anonymous usage analytics",
                  desc: "Help us improve FixWorkFlow by sharing anonymous usage data. No personal information is shared.",
                },
                {
                  key: "personalizedRecs" as const,
                  label: "Personalized recommendations",
                  desc: "Use your business metrics to personalize tool and resource recommendations.",
                },
              ] as const).map((item, i, arr) => (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "14px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid #f0f2f6" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1b2434" }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#8d95a3", marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <Toggle on={privacyPrefs[item.key]} onChange={(v) => updatePrivacy(item.key, v)} />
                </div>
              ))}
            </div>

            {/* Export Data */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1b2434", margin: "0 0 8px" }}>Export Your Data</h3>
              <p style={{ fontSize: 13, color: "#5a6578", margin: "0 0 14px", lineHeight: 1.6 }}>
                Download a copy of all your FixWorkFlow data including your profile, diagnosis answers, metrics, scores,
                and playbook progress.
              </p>
              <button
                onClick={exportData}
                disabled={exporting}
                style={{
                  padding: "10px 20px",
                  borderRadius: 9,
                  border: "1px solid #4361ee",
                  background: "transparent",
                  color: "#4361ee",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: exporting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: exporting ? 0.6 : 1,
                }}
              >
                {exporting ? "Exporting..." : "Export My Data"}
              </button>
            </div>

            {/* Data Retention */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1b2434", margin: "0 0 8px" }}>Data Retention</h3>
              <p style={{ fontSize: 13, color: "#5a6578", lineHeight: 1.7, margin: 0 }}>
                We retain your data for as long as your account is active. If you delete your account, all data is
                permanently removed within 30 days. We do not sell your personal information to third parties. Your
                business metrics are used solely to generate your Revenue Health Score and personalized recommendations.
              </p>
            </div>
          </section>

          {/* ── SECTION 5: FAQ & HELP ── */}
          <section id="section-faq">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 4px" }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 20px" }}>Quick answers to common questions.</p>

            <AccordionItem
              q="What is the Revenue Health Score?"
              a="Your Revenue Health Score is a 0-100 rating based on 5 key business pillars: Revenue, Profitability, Retention, Acquisition, and Operations. It identifies where your business is strongest and where you are losing money, then gives you a personalized playbook to improve."
            />
            <AccordionItem
              q="How is my score calculated?"
              a='We analyze the metrics you provide during onboarding — things like monthly revenue, margins, conversion rate, churn, and customer acquisition cost. Each metric feeds into one of the 5 pillars, which are weighted based on your business type. If you have not provided a metric, we use conservative estimates (marked as "Estimated" on your dashboard).'
            />
            <AccordionItem
              q="What is the difference between Free and Pro?"
              a="Free gives you your Revenue Health Score, your top 2 pillar insights, 2 playbook steps, and 1 tool recommendation. Pro unlocks your AI Business Summary, all 5 pillar insights with deep reasoning, full 5-step playbooks, score projections, all tool recommendations, and progress tracking over time."
            />
            <AccordionItem
              q="How do I improve my score?"
              a="Follow your personalized playbook. Each step targets your weakest pillar with specific, actionable tasks. As you complete steps and update your metrics, your score recalculates to reflect real progress. Most users see improvement within 2-4 weeks."
            />
            <AccordionItem
              q="Can I change my business type?"
              a="Yes — go to Account Settings above and update your Business Type. Your score will recalculate based on the new pillar weights for that business type."
            />
            <AccordionItem
              q="What happens to my data if I cancel Pro?"
              a="Your data is never deleted when you cancel Pro. You keep your score and basic dashboard access. You just lose access to Pro-only features like AI summaries, full playbooks, and deep reasoning. You can re-subscribe at any time and pick up where you left off."
            />
            <AccordionItem
              q="How do tool recommendations work?"
              a="We match tools to your specific situation — your pillar scores, business type, revenue stage, and the friction areas you identified in your diagnosis. Each recommendation explains why it was chosen and how it can impact your score. Some recommendations include affiliate links, which help support FixWorkFlow at no extra cost to you."
            />
            <AccordionItem
              q="What is the credit assessment offer?"
              a="If you indicated that you use personal credit for business expenses, we may recommend a free credit assessment with our partner. This is entirely optional and is shown because personal credit health directly impacts business financing options, interest rates, and profitability."
            />

            <p style={{ fontSize: 13, color: "#5a6578", marginTop: 16 }}>
              Still have questions?{" "}
              <a href="mailto:support@fixworkflow.com" style={{ color: "#4361ee", textDecoration: "none", fontWeight: 600 }}>
                Contact us at support@fixworkflow.com
              </a>
            </p>
          </section>

          {/* ── SECTION 6: LEGAL ── */}
          <section id="section-legal">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 4px" }}>Legal</h2>
            <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 20px" }}>Terms, policies, and disclosures.</p>

            <LegalAccordion title="Terms of Service">
              <p><strong>1. Account Creation</strong></p>
              <p>By creating an account on FixWorkFlow, you agree to provide accurate information and maintain the security of your login credentials. You are responsible for all activity under your account. You must be at least 18 years old to create an account.</p>

              <p><strong>2. Acceptable Use</strong></p>
              <p>You agree to use FixWorkFlow for lawful business purposes only. You may not attempt to reverse-engineer the scoring algorithm, scrape data, or use automated tools to access the service. You may not share your account credentials with others or create multiple accounts.</p>

              <p><strong>3. Intellectual Property</strong></p>
              <p>All content, scoring algorithms, playbook templates, and recommendations are the intellectual property of FixWorkFlow. Your business data remains your property. You grant FixWorkFlow a limited license to process your data for the purpose of providing the service.</p>

              <p><strong>4. Limitation of Liability</strong></p>
              <p>FixWorkFlow provides business insights and recommendations for informational purposes. We do not guarantee specific revenue outcomes. The Revenue Health Score and playbooks are advisory tools and should not be considered financial, legal, or professional advice. FixWorkFlow is not liable for business decisions made based on our recommendations.</p>

              <p><strong>5. Termination</strong></p>
              <p>You may delete your account at any time through Settings. FixWorkFlow reserves the right to suspend or terminate accounts that violate these terms. Upon termination, your data will be permanently deleted within 30 days.</p>

              <p><strong>6. Changes to Terms</strong></p>
              <p>We may update these terms from time to time. Material changes will be communicated via email or in-app notification. Continued use of the service after changes constitutes acceptance of the updated terms.</p>

              <p style={{ marginTop: 12, fontStyle: "italic" }}>Last updated: February 2026</p>
            </LegalAccordion>

            <LegalAccordion title="Privacy Policy">
              <p><strong>Data We Collect</strong></p>
              <p>We collect the information you provide during account creation and onboarding: name, email address, business type, revenue range, and optional metrics such as margins, conversion rate, and traffic. We also collect usage data including page views, feature interactions, and session duration.</p>

              <p><strong>How We Use Your Data</strong></p>
              <p>Your business metrics are used to calculate your Revenue Health Score, generate personalized playbooks, and match tool recommendations. Usage data helps us improve the product and identify common pain points. We may use aggregated, anonymized data for benchmarking.</p>

              <p><strong>Third-Party Sharing</strong></p>
              <p>We do not sell your personal information. Affiliate partners receive click data only (which tool was clicked, from which page) — never your personal information or business metrics without your explicit consent. If you opt into the credit assessment, your contact information is shared with Optimum Credit Solutions solely for that purpose.</p>

              <p><strong>Data Retention &amp; Deletion</strong></p>
              <p>Your data is retained for as long as your account is active. When you delete your account, all personal data and business metrics are permanently removed within 30 days. Anonymized aggregate data may be retained for analytics.</p>

              <p><strong>Cookies</strong></p>
              <p>We use essential cookies for authentication and session management. We use analytics cookies to understand usage patterns. You can control cookie settings in your browser.</p>

              <p><strong>Contact</strong></p>
              <p>For privacy concerns or data requests, contact us at privacy@fixworkflow.com.</p>

              <p style={{ marginTop: 12, fontStyle: "italic" }}>Last updated: February 2026</p>
            </LegalAccordion>

            <LegalAccordion title="Affiliate Disclosure">
              <p>FixWorkFlow participates in affiliate programs. Some tool and resource recommendations on the dashboard include affiliate links. When you click these links and make a purchase or sign up, FixWorkFlow may earn a commission at no additional cost to you.</p>

              <p>All recommendations are selected based on relevance to your business profile — we only recommend products we believe will genuinely help your business. Affiliate relationships do not influence your Revenue Health Score or pillar calculations.</p>

              <p><strong>Credit Partner Disclosure</strong></p>
              <p>The credit assessment recommendation is provided through our partner Optimum Credit Solutions. If you request an assessment, your contact information (name, email, phone) is shared with Optimum Credit Solutions solely for the purpose of providing you with a credit consultation. This is entirely optional and opt-in.</p>

              <p style={{ marginTop: 12, fontStyle: "italic" }}>Last updated: February 2026</p>
            </LegalAccordion>
          </section>
        </div>
      </div>

      {/* Modals */}
      <DeleteModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={deleteAccount} />
      <CancelModal open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={cancelSubscription} />

      {/* Connect Integration Modal */}
      {connectModalProvider && (() => {
        const provider = PROVIDER_CATALOG.find((p) => p.id === connectModalProvider);
        if (!provider) return null;
        return (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            }}
            onClick={() => { setConnectModalProvider(null); setConnecting(false); }}
          >
            <div
              style={{
                background: "#fff", borderRadius: 18, padding: 28,
                maxWidth: 480, width: "100%", margin: "0 16px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${provider.icon}&sz=64`}
                  alt={`${provider.name} logo`}
                  style={{ width: 40, height: 40, borderRadius: 10, background: "#f4f5f8" }}
                />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: 0 }}>
                  Connect {provider.id === "stripe-data" ? "your Stripe account" : `your ${provider.name} store`}
                </h3>
              </div>

              {provider.extraNote && (
                <p style={{ fontSize: 13, color: "#5a6578", margin: "0 0 16px", lineHeight: 1.6, padding: "8px 12px", background: "#fafbfd", borderRadius: 8, border: "1px solid #e6e9ef" }}>
                  {provider.extraNote}
                </p>
              )}

              {provider.needsStoreDomain && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Your Shopify store URL</label>
                  <input
                    style={inputStyle}
                    value={shopifyStore}
                    onChange={(e) => setShopifyStore(e.target.value)}
                    placeholder="mystore.myshopify.com"
                  />
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1b2434", marginBottom: 8 }}>What we access:</div>
                {provider.scopesPlainEnglish.map((scope) => (
                  <div key={scope} style={{ fontSize: 13, color: "#10b981", marginBottom: 4, display: "flex", gap: 6 }}>
                    <span>&#10003;</span> {scope}
                  </div>
                ))}
                {provider.noAccessLabel && (
                  <div style={{ fontSize: 13, color: "#ef4444", marginTop: 4, display: "flex", gap: 6 }}>
                    <span>&#10007;</span> {provider.noAccessLabel}
                  </div>
                )}
              </div>

              <p style={{ fontSize: 12, color: "#8d95a3", margin: "0 0 16px" }}>
                We request read-only access. We never modify your data.
              </p>

              {connectError && (
                <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.06)", borderRadius: 8 }}>
                  {connectError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setConnectModalProvider(null); setConnecting(false); }}
                  style={{
                    flex: 1, padding: "10px 18px", borderRadius: 9,
                    border: "1px solid #e6e9ef", background: "#fff",
                    color: "#5a6578", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={connecting || (provider.needsStoreDomain && !shopifyStore.trim())}
                  onClick={() => connectIntegration(provider.id, provider.needsStoreDomain ? shopifyStore : undefined)}
                  style={{
                    flex: 1, padding: "10px 18px", borderRadius: 9,
                    border: "none", background: gradientBg,
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: connecting ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: connecting || (provider.needsStoreDomain && !shopifyStore.trim()) ? 0.6 : 1,
                  }}
                >
                  {connecting ? "Connecting..." : `Connect to ${provider.name} \u2192`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Disconnect Confirmation Modal */}
      {disconnectConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          }}
          onClick={() => setDisconnectConfirm(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 18, padding: 28,
              maxWidth: 400, width: "100%", margin: "0 16px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434", margin: "0 0 8px" }}>Disconnect integration?</h3>
            <p style={{ fontSize: 13, color: "#5a6578", lineHeight: 1.7, margin: "0 0 16px" }}>
              This will stop auto-syncing data from this service. Your existing data and scores will remain, but will no longer be updated automatically.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDisconnectConfirm(null)}
                style={{
                  flex: 1, padding: "10px 18px", borderRadius: 9,
                  border: "1px solid #e6e9ef", background: "#fff",
                  color: "#5a6578", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Keep Connected
              </button>
              <button
                onClick={() => disconnectIntegration(disconnectConfirm)}
                style={{
                  flex: 1, padding: "10px 18px", borderRadius: 9,
                  border: "none", background: "#ef4444",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
