/*
 * VERIFICATION CHECKLIST:
 * - [ ] Free user sees "Ask AI" but only FREE prompts; PREMIUM prompts return 402.
 * - [ ] Premium user sees all prompts.
 * - [ ] Clicking Ask AI opens chat with prefilled prompt.
 * - [ ] Prompt contains filled values and includes "Reasoning", "Assumptions",
 *       "3 options", "7-day plan", "Metrics used" sections.
 * - [ ] "Why this?" rationale shows deterministic bullets based on metrics.
 */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import UserAvatarDropdown from "@/components/UserAvatarDropdown";
import {
  Zap,
  AlertTriangle,
  TrendingUp,
  Target,
  ArrowRight,
  Activity,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Lock,
  Wrench,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  Info,
  HelpCircle,
  X,
  Menu,
  Copy,
  Check,
  Lightbulb,
  BookOpen,
  Play,
  Plug,
  RefreshCw,
  Star,
} from "lucide-react";
import { dispatchChatPrefill } from "@/lib/prompts/chatContext";
import { CATEGORY_PROMPT_MAP } from "@/lib/prompts/rationale";
import { WhyToggle } from "@/components/WhyToggle";
import { ProBadge } from "@/components/ProBadge";
import { LockedOverlay } from "@/components/LockedOverlay";
import {
  generateRiskReasoning,
  generateLeverReasoning,
  generatePillarAssumptions,
  generatePlaybookTriggerReasoning,
  generateStepReasoning,
  generateToolReasoning,
  generateNextPlaybookReasoning,
  generateEstimatedPillarDetails,
  PILLAR_FIELDS,
} from "@/lib/reasoning";
import RecommendedTools from "@/components/dashboard/RecommendedTools";
import ResourceShelf from "@/components/dashboard/ResourceShelf";
import CreditRepairCard from "@/components/dashboard/CreditRepairCard";
import { CreditReferralProvider } from "@/components/dashboard/CreditReferralContext";
import CommandCenter from "@/components/dashboard/CommandCenter";
import LogoImg, { faviconUrl } from "@/components/ui/LogoImg";
import {
  getToolRecommendations,
  getResourceRecommendations,
  getPlaybookStepRecommendation,
  type UserProfile as RecUserProfile,
  type ScoredProduct,
} from "@/lib/recommendations";
import { useToast } from "@/components/Toast";
import FeedbackModal from "@/components/FeedbackModal";

// ── Revenue Health Score Types ──

interface PillarData {
  score: number;
  reasons: string[];
  levers: string[];
}

interface NextStepData {
  title: string;
  why: string;
  howToStart: string;
  effort: "low" | "medium" | "high";
}

interface RevenueHealthData {
  score: number;
  pillars: Record<string, PillarData>;
  primaryRisk: string;
  fastestLever: string;
  recommendedNextSteps: NextStepData[];
  missingData: string[];
}

// ── Tool Types ──

interface RecToolData {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  affiliateUrl: string;
  hasFreeTier: boolean;
  pricing: string | null;
  rating: number | null;
  whyItFits: string;
  promoLabel: string | null;
  pickLabel?: string;
  pillar: string;
}

interface ToolsByPillarData {
  pillar: string;
  pillarLabel: string;
  pillarScore: number;
  tools: RecToolData[];
}

// ── Existing Dashboard Types ──

interface DashboardData {
  score: {
    total: number;
    components: Record<string, number>;
    band: string;
    calculatedAt: string;
  };
  bottleneck: {
    primary: string;
    secondary: string[];
    severity: number;
  } | null;
  revenueGap: number;
  insight: {
    summary: string;
    weeklyExecutionPlan: string[];
    recommendedTools: string[];
    riskWarnings: string[];
    opportunitySignals: string[];
    createdAt: string;
  } | null;
  businessProfile: {
    businessType: string;
    revenueStage: string;
    currentRevenue: number;
  } | null;
}

const BAND_COLORS: Record<string, string> = {
  "Highly Efficient": "text-emerald-600",
  "Stable but Optimizable": "text-blue-600",
  "Revenue Constrained": "text-amber-600",
  "Structural Revenue Risk": "text-red-600",
};

const BAND_GAUGE_COLORS: Record<string, string> = {
  "Highly Efficient": "stroke-emerald-500",
  "Stable but Optimizable": "stroke-blue-500",
  "Revenue Constrained": "stroke-amber-500",
  "Structural Revenue Risk": "stroke-red-500",
};

function ScoreGauge({ score, band }: { score: number; band: string }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const colorClass = BAND_GAUGE_COLORS[band] || "stroke-gray-400";

  return (
    <div className="relative w-36 h-36">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          className={colorClass}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{score}</span>
        <span className="text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function ComponentBar({ label, value }: { label: string; value: number }) {
  const width = Math.max(2, value);
  let barColor = "bg-red-500";
  if (value >= 85) barColor = "bg-emerald-500";
  else if (value >= 70) barColor = "bg-blue-500";
  else if (value >= 50) barColor = "bg-amber-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 sm:w-28 text-right capitalize truncate">
        {label.replace(/([A-Z])/g, " $1").trim()}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${barColor}`}
          style={{ width: `${width}%`, transition: "width 0.8s ease" }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8">{value}</span>
    </div>
  );
}

// ── Revenue Health Pillar Bar ──

const PILLAR_LABELS: Record<string, string> = {
  revenue: "Revenue",
  profitability: "Profitability",
  retention: "Retention",
  acquisition: "Acquisition",
  ops: "Operations",
};

function PillarBar({ name, pillar, index = 0, businessType, missingData, isPro = true, isTopOrBottom = true, onEditProfile, delta }: { name: string; pillar: PillarData; index?: number; businessType?: string; missingData?: string[]; isPro?: boolean; isTopOrBottom?: boolean; onEditProfile?: () => void; delta?: number }) {
  const [estimatedOpen, setEstimatedOpen] = useState(false);
  const pillarFieldList = PILLAR_FIELDS[name] ?? [];
  const missingForPillar = missingData ? pillarFieldList.filter((f) => missingData.includes(f)) : [];
  const hasEstimated = missingForPillar.length > 0;
  const estimatedDetails = hasEstimated && businessType ? generateEstimatedPillarDetails(name, pillar.score, businessType, missingData!) : null;
  const width = Math.max(2, pillar.score);
  let barColor = "bg-red-500";
  if (pillar.score >= 80) barColor = "bg-emerald-500";
  else if (pillar.score >= 60) barColor = "bg-blue-500";
  else if (pillar.score >= 40) barColor = "bg-amber-500";
  const needsFocus = pillar.score < 50;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-gray-600 w-20 sm:w-28 text-right truncate">
          {PILLAR_LABELS[name] || name}
        </span>
        <div className="flex-1 bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${barColor}`}
            style={{
              width: `${width}%`,
              transition: "width 0.8s ease",
              transitionDelay: `${index * 120}ms`,
            }}
          />
        </div>
        <span className="text-sm font-bold text-gray-800 w-10 tabular-nums">{pillar.score}</span>
        {delta !== undefined && delta !== 0 && (
          <span className={`text-[10px] font-semibold ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
        {needsFocus && (
          <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[10px] font-semibold text-amber-600 whitespace-nowrap">
            Needs focus
          </span>
        )}
        {!isPro && pillar.score < 70 && (
          <span className="inline-flex items-center gap-1 ml-1">
            <ProBadge small />
            <span style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600 }}>What if?</span>
          </span>
        )}
        {hasEstimated && (
          isPro ? (
            <button
              onClick={(e) => { e.stopPropagation(); setEstimatedOpen(!estimatedOpen); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 8px", borderRadius: 4,
                background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)",
                fontSize: 10, fontWeight: 700, color: "#d97706",
                cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,158,11,0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(245,158,11,0.10)")}
            >
              Estimated
              <ChevronDown style={{ width: 10, height: 10, transition: "transform 0.15s", transform: estimatedOpen ? "rotate(180deg)" : "rotate(0)" }} />
            </button>
          ) : (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 4,
              background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)",
              fontSize: 10, fontWeight: 700, color: "#d97706",
            }}>
              Estimated
            </span>
          )
        )}
      </div>
      {pillar.reasons.length > 0 && (
        <div className="ml-0 sm:ml-32 space-y-0.5 pl-2 sm:pl-0">
          {isPro || isTopOrBottom ? (
            pillar.reasons.map((r, i) => (
              <p key={i} className="text-xs text-gray-400">{r}</p>
            ))
          ) : (
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: "#8d95a3", filter: "blur(4px)", userSelect: "none" }}>
                {pillar.reasons[0] || "Insight details locked for this pillar"}
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <ProBadge small />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#5a6578" }}>Unlock insights</span>
              </div>
            </div>
          )}
          {(isPro || isTopOrBottom) && businessType && missingData && (() => {
            const assumptions = generatePillarAssumptions(name, pillar.score, businessType, missingData);
            if (!assumptions) return null;
            return <WhyToggle text={assumptions.text} />;
          })()}
        </div>
      )}
      {/* Estimated pillar detail expansion (Pro only) */}
      {estimatedOpen && isPro && estimatedDetails && (
        <div className="ml-0 sm:ml-32" style={{ animation: "fadeSlide 0.2s ease" }}>
          <div style={{
            marginTop: 6, padding: "12px 14px", borderRadius: 8,
            background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 8 }}>
              Assumed values for this pillar
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {estimatedDetails.fields.map((f) => (
                <div key={f.field} style={{
                  display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8,
                  padding: "6px 8px", borderRadius: 6, background: "white",
                  border: "1px solid #f0f2f6",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#1b2434", minWidth: 100 }}>{f.label}</span>
                  <span style={{ fontSize: 11, color: "#d97706", fontWeight: 600 }}>{f.assumedValue}</span>
                  <span style={{ fontSize: 10, color: "#8d95a3", flex: 1, minWidth: 120 }}>{f.reason}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#92400e", marginTop: 10, lineHeight: 1.5 }}>
              {estimatedDetails.impact}
            </p>
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                style={{
                  marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 16px", borderRadius: 7,
                  background: "#f59e0b", color: "white",
                  fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#d97706")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f59e0b")}
              >
                Add Real Data <ArrowRight style={{ width: 12, height: 12, display: "inline" }} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Collapsible Section Wrapper ──

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  badge,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white border border-gray-100 rounded-[14px] shadow-sm overflow-hidden ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h2>
          {badge}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

const EFFORT_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

// ── Business Type Options ──

const BUSINESS_TYPE_OPTIONS = [
  { value: "", label: "Select your business type..." },
  { value: "ecommerce", label: "E-commerce" },
  { value: "saas", label: "SaaS" },
  { value: "service_agency", label: "Service / Agency" },
  { value: "creator", label: "Creator / Content" },
  { value: "local_business", label: "Local Business" },
];

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  saas: "SaaS",
  service_agency: "Service / Agency",
  creator: "Creator / Content",
  local_business: "Local Business",
};

// ── Category Guesser (for next steps) ──

function guessCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("revenue") || t.includes("offer") || t.includes("promo") || t.includes("price")) return "revenue";
  if (t.includes("margin") || t.includes("profit") || t.includes("ltv") || t.includes("cac") || t.includes("cost")) return "profitability";
  if (t.includes("churn") || t.includes("retention") || t.includes("repeat")) return "retention";
  if (t.includes("conversion") || t.includes("traffic") || t.includes("funnel") || t.includes("acquisition") || t.includes("seo")) return "acquisition";
  if (t.includes("automat") || t.includes("ops") || t.includes("sop") || t.includes("process") || t.includes("support")) return "ops";
  return "planning";
}

// ── Profile Form Fields ──

const PROFILE_FIELDS = [
  { key: "revenueMonthly", label: "Monthly Revenue ($)", placeholder: "e.g. 12000" },
  { key: "grossMarginPct", label: "Gross Margin (%)", placeholder: "0-100" },
  { key: "netProfitMonthly", label: "Net Profit Monthly ($)", placeholder: "e.g. 3000" },
  { key: "runwayMonths", label: "Runway (months)", placeholder: "e.g. 12" },
  { key: "churnMonthlyPct", label: "Monthly Churn (%)", placeholder: "0-100" },
  { key: "conversionRatePct", label: "Conversion Rate (%)", placeholder: "0-100" },
  { key: "trafficMonthly", label: "Monthly Traffic", placeholder: "e.g. 10000" },
  { key: "avgOrderValue", label: "Avg Order Value ($)", placeholder: "e.g. 75" },
  { key: "cac", label: "CAC ($)", placeholder: "e.g. 45" },
  { key: "ltv", label: "LTV ($)", placeholder: "e.g. 300" },
  { key: "opsHoursPerWeek", label: "Ops Hours / Week", placeholder: "e.g. 20" },
  { key: "fulfillmentDays", label: "Fulfillment Days", placeholder: "e.g. 3" },
  { key: "supportTicketsPerWeek", label: "Support Tickets / Week", placeholder: "e.g. 10" },
];

// ── Revenue Health Section ──

function RevenueHealthSection({ isPremium, onScoreChange, onMissingData }: { isPremium: boolean; onScoreChange: (has: boolean) => void; onMissingData?: (keys: string[]) => void }) {
  const { toast } = useToast();
  const [healthData, setHealthData] = useState<RevenueHealthData | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [businessType, setBusinessType] = useState<string>("");
  const [dismissedMissing, setDismissedMissing] = useState(false);
  const [savedBusinessType, setSavedBusinessType] = useState<string>("");
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [scoreChangeReason, setScoreChangeReason] = useState<string | null>(null);
  const [previousPillarScores, setPreviousPillarScores] = useState<Record<string, number> | null>(null);

  // Load existing profile values for pre-filling the form
  const loadProfileValues = useCallback(() => {
    fetch("/api/revenue-health/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data) {
          const vals: Record<string, string> = {};
          for (const f of PROFILE_FIELDS) {
            const v = json.data[f.key];
            if (v !== null && v !== undefined) vals[f.key] = String(v);
          }
          setFormValues(vals);
          if (json.data.businessType) {
            setBusinessType(json.data.businessType);
            setSavedBusinessType(json.data.businessType);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchScore = useCallback(() => {
    setLoading(true);
    fetch("/api/revenue-health")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((json: { ok: boolean; result: RevenueHealthData | null; updatedAt?: string; previousScore?: number | null; scoreChangeReason?: string | null; previousPillarScores?: Record<string, number> | null }) => {
        if (json.result) {
          setHealthData(json.result);
          setUpdatedAt(json.updatedAt ?? null);
          setPreviousScore(json.previousScore ?? null);
          setScoreChangeReason(json.scoreChangeReason ?? null);
          setPreviousPillarScores(json.previousPillarScores ?? null);
          setHasProfile(true);
          onScoreChange(true);
          onMissingData?.(json.result?.missingData ?? []);
        } else {
          setHasProfile(false);
          onScoreChange(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setHasProfile(false);
        onScoreChange(false);
        setLoading(false);
      });
  }, [onScoreChange]);

  useEffect(() => {
    fetchScore();
    // Also load profile to get businessType for display
    loadProfileValues();
  }, [fetchScore, loadProfileValues]);

  const handleEditProfile = () => {
    loadProfileValues();
    setShowForm(true);
    setSaveError(null);
  };

  const handleRecalculate = useCallback(() => {
    setRecalculating(true);
    fetch("/api/score/recalculate", { method: "POST" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((json: { ok: boolean; result: RevenueHealthData; updatedAt: string }) => {
        setHealthData(json.result);
        setUpdatedAt(json.updatedAt);
        onMissingData?.(json.result?.missingData ?? []);
        toast("Score updated!", "success");
      })
      .catch(() => {
        toast("Failed to recalculate score.", "error");
      })
      .finally(() => setRecalculating(false));
  }, [onMissingData, toast]);

  const handleSaveProfile = () => {
    setSaving(true);
    setSaveError(null);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(formValues)) {
      if (v !== "" && !Number.isNaN(Number(v))) {
        payload[k] = Number(v);
      }
    }
    if (businessType) {
      payload.businessType = businessType;
    }
    fetch("/api/revenue-health/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Save failed");
        return r.json();
      })
      .then((json: { ok: boolean; result: RevenueHealthData; updatedAt: string }) => {
        setSaving(false);
        setShowForm(false);
        // Set score immediately from POST response — no second fetch needed
        setHealthData(json.result);
        setUpdatedAt(json.updatedAt);
        setHasProfile(true);
        setSavedBusinessType(businessType);
        onScoreChange(true);
        onMissingData?.(json.result?.missingData ?? []);
      })
      .catch(() => {
        setSaving(false);
        setSaveError("Failed to save. Please try again.");
      });
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-[14px] p-8 shadow-sm text-center">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
        <p className="text-xs text-gray-400 mt-2">Loading Revenue Health Score...</p>
      </div>
    );
  }

  // No profile — show CTA
  if (!hasProfile && !showForm) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 rounded-[14px] p-8 shadow-sm text-center">
        <Activity className="w-8 h-8 text-blue-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Your Revenue Health Score</h3>
        <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
          Complete your business profile to receive a personalized score across 5 pillars:
          Revenue, Profitability, Retention, Acquisition, and Operations.
        </p>
        <button
          onClick={() => { setShowForm(true); setSaveError(null); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Complete Business Profile
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Profile form
  if (showForm) {
    return (
      <div className="bg-white border border-gray-100 rounded-[14px] p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Business Profile</h3>
        <p className="text-xs text-gray-400 mb-5">Fill in what you know — missing fields are handled gracefully.</p>
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 mb-1">Business Type</label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {BUSINESS_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Scoring weights adapt to your business type.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROFILE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
              <input
                type="number"
                step="any"
                placeholder={f.placeholder}
                value={formValues[f.key] ?? ""}
                onChange={(e) => setFormValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
        {saveError && (
          <p className="text-xs text-red-500 mt-3">{saveError}</p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Calculating..." : "Save & Calculate Score"}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Score display
  if (!healthData) return null;

  const scoreColor = healthData.score >= 70 ? "text-emerald-600"
    : healthData.score >= 50 ? "text-blue-600"
    : healthData.score >= 35 ? "text-amber-600"
    : "text-red-600";

  const gaugeColor = healthData.score >= 70 ? "stroke-emerald-500"
    : healthData.score >= 50 ? "stroke-blue-500"
    : healthData.score >= 35 ? "stroke-amber-500"
    : "stroke-red-500";

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (healthData.score / 100) * circumference;

  return (
    <div className="space-y-6" data-health-section>
      {/* Score + Risk + Lever */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Score Ring */}
        <div className="bg-white border border-gray-100 rounded-[14px] p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Revenue Health Score
          </h2>
          <div className="relative w-36 h-36">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                className={gaugeColor}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-extrabold tabular-nums ${scoreColor}`}>{healthData.score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
            {previousScore !== null && healthData.score - previousScore !== 0 && (
              <span className={`absolute -top-2 -right-2 text-xs font-bold rounded-full px-2 py-0.5 ${
                healthData.score - previousScore > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {healthData.score - previousScore > 0 ? `▲ +${healthData.score - previousScore}` : `▼ ${healthData.score - previousScore}`}
              </span>
            )}
          </div>
          {savedBusinessType ? (
            <p className="text-xs text-gray-500 mt-2 font-medium">
              {BUSINESS_TYPE_LABELS[savedBusinessType] || savedBusinessType}
            </p>
          ) : (
            <p className="text-xs text-amber-500 mt-2">
              Using Service/Agency defaults
            </p>
          )}
          {scoreChangeReason && (
            <p className="text-xs text-gray-400 mt-1 text-center max-w-[200px]">{scoreChangeReason}</p>
          )}
          {updatedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Updated {new Date(updatedAt).toLocaleDateString()} {new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap justify-center">
            <button
              onClick={handleEditProfile}
              className="text-[11px] sm:text-xs text-blue-500 hover:text-blue-700"
            >
              Update Profile
            </button>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="text-[11px] sm:text-xs text-gray-400 hover:text-blue-500 disabled:opacity-50 flex items-center gap-1"
            >
              {recalculating && (
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {recalculating ? "Recalculating..." : "Recalculate"}
            </button>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <Link
              href="/diagnosis?edit=true"
              className="text-[11px] sm:text-xs text-gray-400 hover:text-blue-500"
            >
              Edit Diagnosis
            </Link>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <Link
              href="/diagnosis?edit=true"
              className="text-[11px] sm:text-xs text-gray-400 hover:text-blue-500"
            >
              Edit Metrics
            </Link>
          </div>
          {/* Missing data nudge — compact, dismissible */}
          {healthData.missingData.length > 0 && !dismissedMissing && (
            <div className="mt-3 w-full">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50/80 border border-amber-100 rounded-lg">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <button
                  onClick={handleEditProfile}
                  className="text-[11px] text-amber-700 hover:text-amber-900 text-left leading-tight"
                >
                  <span className="font-semibold">{healthData.missingData.length} fields missing</span>
                  {" — "}add them for a sharper score
                </button>
                <button
                  onClick={() => setDismissedMissing(true)}
                  className="ml-auto flex-shrink-0 text-amber-400 hover:text-amber-600"
                  aria-label="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Risk */}
        <div className="bg-white border border-gray-100 rounded-[14px] p-6 shadow-sm hover:shadow-md transition-shadow duration-150">
          <h2 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Primary Risk
          </h2>
          <p className="text-sm font-semibold text-gray-800 leading-relaxed">{healthData.primaryRisk}</p>
          <WhyToggle text={generateRiskReasoning(healthData.pillars as Record<string, { score: number; reasons: string[]; levers: string[] }>, savedBusinessType || "service_agency")} />
          {(() => {
            const weakest = Object.entries(healthData.pillars)
              .sort(([, a], [, b]) => (a as PillarData).score - (b as PillarData).score)[0];
            if (!weakest) return null;
            const [wName, wPillar] = weakest;
            return (
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {PILLAR_LABELS[wName] || wName} is your weakest pillar at <span className="font-semibold text-gray-500 tabular-nums">{(wPillar as PillarData).score}/100</span>
                {healthData.missingData.length > 0 && (
                  <> — {healthData.missingData.length} missing field{healthData.missingData.length > 1 ? "s" : ""} may be hiding a clearer picture</>
                )}
              </p>
            );
          })()}
        </div>

        {/* Fastest Lever */}
        <div className="bg-white border border-gray-100 rounded-[14px] p-6 shadow-sm hover:shadow-md transition-shadow duration-150">
          <h2 className="text-xs font-medium text-emerald-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Fastest Lever
          </h2>
          <p className="text-sm font-semibold text-gray-800 leading-relaxed">{healthData.fastestLever}</p>
          {(() => {
            const lr = generateLeverReasoning(healthData.pillars as Record<string, { score: number; reasons: string[]; levers: string[] }>, savedBusinessType || "service_agency");
            return <WhyToggle text={lr.text} potential={lr.potential} />;
          })()}
          {(() => {
            const pillars = healthData.pillars;
            // Try to compute a concrete impact number from acquisition pillar
            const acqPillar = pillars.acquisition as PillarData | undefined;
            const revPillar = pillars.revenue as PillarData | undefined;
            if (acqPillar && acqPillar.score < 70) {
              const potentialLift = Math.round((70 - acqPillar.score) * 0.3);
              return (
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  A <span className="font-semibold text-emerald-600">+{potentialLift} pt</span> improvement in Acquisition could compound across your revenue funnel
                </p>
              );
            }
            if (revPillar && revPillar.score < 70) {
              const potentialLift = Math.round((70 - revPillar.score) * 0.3);
              return (
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Boosting Revenue pillar by <span className="font-semibold text-emerald-600">+{potentialLift} pts</span> is your fastest path to a higher overall score
                </p>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* 5 Pillar Breakdown */}
      <CollapsibleSection title="5-Pillar Breakdown" defaultOpen>
        <div className="space-y-4">
          {(() => {
            const entries = Object.entries(healthData.pillars);
            const sorted = [...entries].sort(([, a], [, b]) => (a as PillarData).score - (b as PillarData).score);
            const weakest1 = sorted[0]?.[0];
            const weakest2 = sorted[1]?.[0];
            return entries.map(([name, pillar], idx) => (
              <PillarBar
                key={name}
                name={name}
                pillar={pillar as PillarData}
                index={idx}
                businessType={savedBusinessType || "service_agency"}
                missingData={healthData.missingData}
                isPro={isPremium}
                isTopOrBottom={name === weakest1 || name === weakest2}
                onEditProfile={handleEditProfile}
                delta={previousPillarScores && previousPillarScores[name] !== undefined
                  ? (pillar as PillarData).score - previousPillarScores[name]
                  : undefined}
              />
            ));
          })()}
        </div>
      </CollapsibleSection>

      {/* Missing Data — inline nudge under score card */}
    </div>
  );
}

// ── Ask AI Button ──

function AskAiButton({
  category,
  selectedItem,
  isPremium,
}: {
  category: string;
  selectedItem: { title: string; category: string; description?: string };
  isPremium: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [rationale, setRationale] = useState<string[] | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  const prompts = CATEGORY_PROMPT_MAP[category] ?? CATEGORY_PROMPT_MAP["planning"] ?? [];

  const handleAskAi = async (slug: string) => {
    setLoadingSlug(slug);
    try {
      const res = await fetch("/api/prompts/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, selectedItem }),
      });
      if (res.status === 402) {
        alert("This prompt requires Premium. Upgrade to unlock all AI prompts.");
        setLoadingSlug(null);
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRationale(data.rationale);
      dispatchChatPrefill({
        prompt: data.prompt,
        rationale: data.rationale,
        templateTitle: data.templateMeta.title,
      });
      setShowMenu(false);
    } catch {
      // silent fail
    }
    setLoadingSlug(null);
  };

  return (
    <div className="relative inline-flex items-center gap-1">
      {rationale && rationale.length > 0 && (
        <button
          onClick={() => setShowRationale(!showRationale)}
          className="inline-flex items-center gap-0.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          title="Why this?"
        >
          <Info className="w-3 h-3" />
          Why?
        </button>
      )}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-violet-50 border border-violet-100 text-violet-600 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Ask AI
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
            {prompts.map((p) => (
              <button
                key={p.slug}
                onClick={() => handleAskAi(p.slug)}
                disabled={loadingSlug === p.slug}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between gap-2 disabled:opacity-50"
              >
                <span className="truncate">{p.label}</span>
                {p.visibility === "PREMIUM" && !isPremium ? (
                  <Lock className="w-3 h-3 text-gray-300 flex-shrink-0" />
                ) : p.visibility === "PREMIUM" ? (
                  <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
                ) : null}
              </button>
            ))}
            <button
              onClick={() => setShowMenu(false)}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50 border-t border-gray-100 mt-1"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {showRationale && rationale && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-3">
          <p className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Why this recommendation?
          </p>
          <ul className="space-y-1">
            {rationale.map((r, i) => (
              <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
          <button onClick={() => setShowRationale(false)} className="text-xs text-gray-400 mt-2 hover:text-gray-600">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ── AI Explain: Why? Drawer ──

interface WhyItem {
  itemType: "focus" | "tool";
  itemKey: string;
  pillar: string;
  title: string;
  description: string;
}

interface PreviewData {
  why: string;
  firstStep: string;
  upgradeHint: string;
}

interface FullData {
  whyDeep: string;
  steps: string[];
  successMetrics: string[];
  pitfalls: string[];
  suggestedTools: string[];
  promptToExecute: string;
}

interface WhyData {
  preview: PreviewData | null;
  full: FullData | null;
}

function WhyDrawer({
  open,
  selected,
  data,
  loading,
  error,
  onClose,
  isPremium,
}: {
  open: boolean;
  selected: WhyItem | null;
  data: WhyData | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  isPremium: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = () => {
    if (data?.full?.promptToExecute) {
      navigator.clipboard.writeText(data.full.promptToExecute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open || !selected) return null;

  const preview = data?.preview ?? null;
  const full = data?.full ?? null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Why this matters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Item title */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              {selected.itemType === "focus" ? "Focus Area" : "Tool"}
            </p>
            <p className="text-base font-medium text-gray-900">{selected.title}</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-400 ml-2">Analyzing...</span>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && !preview && (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No insight returned.</p>
            </div>
          )}

          {/* Preview Section */}
          {preview && !loading && !error && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-2">Why</p>
                <p className="text-sm text-gray-700 leading-relaxed">{preview.why}</p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">
                  First Step
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{preview.firstStep}</p>
              </div>
            </div>
          )}

          {/* Full Plan — Premium */}
          {isPremium && full && !loading && !error && (
            <div className="space-y-4 border-t border-gray-100 pt-5">
              <p className="text-xs font-medium text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Full Action Plan
              </p>

              {/* Deep Why */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{full.whyDeep}</p>
              </div>

              {/* Steps */}
              {full.steps.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Action Steps</p>
                  <ol className="space-y-2">
                    {full.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 w-5 h-5 bg-violet-100 rounded text-xs font-medium text-violet-600 flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Success Metrics */}
              {full.successMetrics.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Success Metrics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {full.successMetrics.map((m, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pitfalls */}
              {full.pitfalls.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Common Pitfalls</p>
                  <ul className="space-y-1.5">
                    {full.pitfalls.map((p, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Tools */}
              {full.suggestedTools.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Suggested Tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {full.suggestedTools.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt to Execute */}
              {full.promptToExecute && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500">AI Prompt</p>
                    <button
                      onClick={handleCopyPrompt}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      {copied ? (
                        <><Check className="w-3 h-3 text-emerald-500" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-xs text-gray-300 leading-relaxed font-mono">
                      {full.promptToExecute}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Blurred Upgrade CTA for Free Users */}
          {!isPremium && preview && !loading && !error && (
            <div className="relative">
              <div className="blur-[6px] pointer-events-none select-none space-y-4 border-t border-gray-100 pt-5">
                <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">
                  Full Action Plan
                </p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-400">
                    A detailed analysis of why this matters for your specific business context
                    with tailored action steps and metrics...
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">Action Steps</p>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-6 bg-gray-100 rounded" />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">Success Metrics</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-6 w-28 bg-gray-100 rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 shadow-lg text-center max-w-xs">
                  <Lock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Full Plan — Premium Only
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    {preview.upgradeHint}
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-medium hover:bg-gray-800 transition-colors"
                  >
                    Upgrade to Premium
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function WhyButton({
  itemType,
  itemKey,
  pillar,
  title,
  description,
  onOpen,
}: {
  itemType: "focus" | "tool";
  itemKey: string;
  pillar: string;
  title: string;
  description: string;
  onOpen: (item: WhyItem) => void;
}) {
  return (
    <button
      onClick={() => onOpen({ itemType, itemKey, pillar, title, description })}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
      title="Why this matters"
    >
      <HelpCircle className="w-3.5 h-3.5" />
      Why?
    </button>
  );
}


// ── Playbook Types ──

interface PlaybookStepData {
  step: number;
  title: string;
  action: string;
}

interface TriggeredPlaybookData {
  id: string;
  slug: string;
  title: string;
  category: string;
  baseSteps: PlaybookStepData[];
  baseImpact: string;
  effortLevel: string;
  triggerReason: string;
  relevanceScore: number;
}

interface ExpandedPlaybookData {
  personalizedSteps: { day: number; title: string; action: string; whyNow: string }[];
  kpiTargets: string[];
  risks: string[];
  suggestedTools: string[];
  copyPrompt: string;
}

const PLAYBOOK_EFFORT_COLORS: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-600 border-emerald-100",
  medium: "bg-amber-50 text-amber-600 border-amber-100",
  high: "bg-red-50 text-red-600 border-red-100",
};

const CATEGORY_COLORS: Record<string, string> = {
  revenue: "bg-blue-50 text-blue-600 border-blue-100",
  profitability: "bg-violet-50 text-violet-600 border-violet-100",
  retention: "bg-emerald-50 text-emerald-600 border-emerald-100",
  acquisition: "bg-amber-50 text-amber-600 border-amber-100",
  ops: "bg-gray-50 text-gray-600 border-gray-100",
};

const EFFORT_ESTIMATE: Record<string, string> = {
  low: "~20 min",
  medium: "~45 min",
  high: "~1-2 hrs",
};

const PILLAR_METRICS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  revenue: [
    { key: "revenueMonthly", label: "Monthly Revenue ($)", placeholder: "e.g. 12000" },
    { key: "conversionRatePct", label: "Conversion Rate (%)", placeholder: "0-100" },
    { key: "avgOrderValue", label: "Avg Order Value ($)", placeholder: "e.g. 75" },
  ],
  profitability: [
    { key: "grossMarginPct", label: "Gross Margin (%)", placeholder: "0-100" },
    { key: "netProfitMonthly", label: "Net Profit Monthly ($)", placeholder: "e.g. 3000" },
    { key: "cac", label: "CAC ($)", placeholder: "e.g. 45" },
  ],
  retention: [
    { key: "churnMonthlyPct", label: "Monthly Churn (%)", placeholder: "0-100" },
    { key: "ltv", label: "LTV ($)", placeholder: "e.g. 300" },
    { key: "conversionRatePct", label: "Conversion Rate (%)", placeholder: "0-100" },
  ],
  acquisition: [
    { key: "conversionRatePct", label: "Conversion Rate (%)", placeholder: "0-100" },
    { key: "trafficMonthly", label: "Monthly Traffic", placeholder: "e.g. 10000" },
    { key: "cac", label: "CAC ($)", placeholder: "e.g. 45" },
  ],
  ops: [
    { key: "opsHoursPerWeek", label: "Ops Hours / Week", placeholder: "e.g. 20" },
    { key: "fulfillmentDays", label: "Fulfillment Days", placeholder: "e.g. 3" },
    { key: "supportTicketsPerWeek", label: "Support Tickets / Week", placeholder: "e.g. 10" },
  ],
};

// ── Playbooks Section (3-Phase Progress Tracker) ──

function PlaybooksSection({ isPremium, hasScore, onScoreRefresh, integrations = [] }: { isPremium: boolean; hasScore: boolean; onScoreRefresh: () => void; integrations?: { id: string; provider: string; status: string }[] }) {
  const [playbooks, setPlaybooks] = useState<TriggeredPlaybookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
  // Step progress: { [slug]: boolean[] }
  const [stepProgress, setStepProgress] = useState<Record<string, boolean[]>>({});
  // (pillarTools state removed — now using matching engine)
  // AI expansion
  const [expandedData, setExpandedData] = useState<Record<string, ExpandedPlaybookData>>({});
  const [expandingSlug, setExpandingSlug] = useState<string | null>(null);
  const [expandError, setExpandError] = useState<string | null>(null);
  // Phase 2 state
  const [metricForm, setMetricForm] = useState<Record<string, string>>({});
  const [prevValues, setPrevValues] = useState<Record<string, number | null>>({});
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [metricsUpdated, setMetricsUpdated] = useState(false);
  // Phase 3 state
  const [beforeScore, setBeforeScore] = useState<{ score: number; pillars: Record<string, PillarData> } | null>(null);
  const [afterScore, setAfterScore] = useState<{ score: number; pillars: Record<string, PillarData> } | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  // Reasoning data
  const [healthPillars, setHealthPillars] = useState<Record<string, PillarData> | null>(null);
  const [profileBusinessType, setProfileBusinessType] = useState<string>("service_agency");
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [expandedToolStep, setExpandedToolStep] = useState<number | null>(null);

  // Load triggered playbooks
  useEffect(() => {
    if (!hasScore) { setLoading(false); return; }
    fetch("/api/playbooks/triggered")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((json) => { setPlaybooks(json.triggered ?? []); setLoading(false); })
      .catch(() => setLoading(false));
    // Fetch health data + profile for reasoning
    fetch("/api/revenue-health")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json?.result?.pillars) setHealthPillars(json.result.pillars); })
      .catch(() => {});
    fetch("/api/revenue-health/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data?.businessType) setProfileBusinessType(json.data.businessType);
        if (json?.data) setProfileData(json.data);
      })
      .catch(() => {});
  }, [hasScore]);

  // Load progress when a playbook is expanded
  useEffect(() => {
    if (!activeSlug) return;
    fetch(`/api/playbook-progress?slug=${activeSlug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (!json?.progress) return;
        const pb = playbooks.find((p) => p.slug === activeSlug);
        if (!pb) return;
        const arr = new Array(pb.baseSteps.length).fill(false);
        for (const p of json.progress as { stepIndex: number; completed: boolean }[]) {
          if (p.stepIndex >= 0 && p.stepIndex < arr.length) arr[p.stepIndex] = p.completed;
        }
        setStepProgress((prev) => ({ ...prev, [activeSlug]: arr }));
      })
      .catch(() => {});
  }, [activeSlug, playbooks]);

  // Load tools and profile values when playbook is opened
  useEffect(() => {
    if (!activeSlug) return;
    const pb = playbooks.find((p) => p.slug === activeSlug);
    if (!pb) return;
    // Fetch profile for Phase 2 previous values
    fetch("/api/revenue-health/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (!json?.data) return;
        const vals: Record<string, number | null> = {};
        const metrics = PILLAR_METRICS[pb.category] ?? PILLAR_METRICS.ops;
        for (const m of metrics) {
          vals[m.key] = json.data[m.key] ?? null;
        }
        setPrevValues(vals);
      })
      .catch(() => {});
    // Fetch current score as "before" baseline
    fetch("/api/revenue-health")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.result) {
          setBeforeScore({ score: json.result.score, pillars: json.result.pillars });
        }
      })
      .catch(() => {});
  }, [activeSlug, playbooks]);

  const toggleStep = useCallback(async (slug: string, idx: number) => {
    const current = stepProgress[slug] ?? [];
    const newVal = !current[idx];
    // Optimistic update
    const updated = [...current];
    updated[idx] = newVal;
    setStepProgress((prev) => ({ ...prev, [slug]: updated }));
    // Persist
    fetch("/api/playbook-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playbookSlug: slug, stepIndex: idx, completed: newVal }),
    }).catch(() => {
      // Revert on failure
      setStepProgress((prev) => ({ ...prev, [slug]: current }));
    });
  }, [stepProgress]);

  const handleExpand = useCallback(async (slug: string) => {
    if (expandedData[slug]) return;
    setExpandingSlug(slug);
    setExpandError(null);
    try {
      const res = await fetch("/api/playbooks/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playbookSlug: slug }),
      });
      const text = await res.text();
      let json: Record<string, unknown> | null = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) throw new Error((json?.error as string) || `Failed (${res.status})`);
      if (json?.expanded) {
        setExpandedData((prev) => ({ ...prev, [slug]: json!.expanded as ExpandedPlaybookData }));
      }
    } catch (e: unknown) {
      setExpandError(e instanceof Error ? e.message : "Failed to generate plan.");
    } finally {
      setExpandingSlug(null);
    }
  }, [expandedData]);

  const handleSaveMetrics = useCallback(async (pb: TriggeredPlaybookData) => {
    setSavingMetrics(true);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(metricForm)) {
      if (v !== "" && !Number.isNaN(Number(v))) payload[k] = Number(v);
    }
    try {
      const res = await fetch("/api/revenue-health/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = await res.json();
      if (json.result) {
        setAfterScore({ score: json.result.score, pillars: json.result.pillars });
        setMetricsUpdated(true);
        onScoreRefresh();
      }
    } catch {
      // fail silently
    } finally {
      setSavingMetrics(false);
    }
  }, [metricForm, onScoreRefresh]);

  const handleToolClick = useCallback((tool: RecToolData) => {
    fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId: tool.id, slug: tool.slug, source: "playbook", context: { pillar: tool.pillar } }),
    }).catch(() => {});
    window.open(tool.affiliateUrl, "_blank", "noopener");
  }, []);

  const handleCopyPrompt = useCallback((prompt: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    });
  }, []);

  const handleAffClick = useCallback((product: ScoredProduct) => {
    fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: product.id, source: "playbook_inline" }),
    }).catch(() => {});
    window.open(product.affiliateUrl, "_blank", "noopener");
  }, []);

  const userProfile: RecUserProfile | null = useMemo(() => {
    if (!healthPillars || !profileData) return null;
    const pillarScores: Record<string, number> = {};
    for (const [key, val] of Object.entries(healthPillars)) {
      pillarScores[key] = val.score;
    }
    return {
      businessType: profileBusinessType,
      revenueMonthly: (profileData.revenueMonthly as number) || 0,
      grossMarginPct: (profileData.grossMarginPct as number) || undefined,
      conversionRatePct: (profileData.conversionRatePct as number) || undefined,
      trafficMonthly: (profileData.trafficMonthly as number) || undefined,
      frictionAreas: (profileData.frictionAreas as string[]) || undefined,
      pillarScores,
    };
  }, [healthPillars, profileData, profileBusinessType]);

  if (!hasScore) return null;

  if (!loading && playbooks.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-[14px] p-8 shadow-sm text-center">
        <p className="text-sm text-gray-500">Start your first step to see progress here.</p>
        <p className="text-xs text-gray-400 mt-1">Playbooks will appear once your Revenue Health Score identifies areas to improve.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-[14px] p-8 shadow-sm text-center">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
        <p className="text-xs text-gray-400 mt-2">Finding playbooks for you...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {playbooks.map((pb) => {
        const isActive = activeSlug === pb.slug;
        const progress = stepProgress[pb.slug] ?? new Array(pb.baseSteps.length).fill(false);
        const completedCount = progress.filter(Boolean).length;
        const totalSteps = pb.baseSteps.length;
        const allDone = completedCount === totalSteps;
        const expanded = expandedData[pb.slug];
        const isExpanding = expandingSlug === pb.slug;
        const metrics = PILLAR_METRICS[pb.category] ?? PILLAR_METRICS.ops;
        const phase = isActive ? activePhase : 1;

        return (
          <div key={pb.slug} className="bg-white border border-gray-100 rounded-[14px] shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-150">
            {/* Collapsed header */}
            <button
              onClick={() => {
                if (isActive) { setActiveSlug(null); }
                else { setActiveSlug(pb.slug); setActivePhase(1); setMetricsUpdated(false); setAfterScore(null); setMetricForm({}); }
              }}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors duration-150"
            >
              <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${CATEGORY_COLORS[pb.category] || CATEGORY_COLORS.ops}`}>
                    {PILLAR_LABELS[pb.category] || pb.category}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${PLAYBOOK_EFFORT_COLORS[pb.effortLevel] || PLAYBOOK_EFFORT_COLORS.medium}`}>
                    {pb.effortLevel} effort
                  </span>
                  {completedCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[10px] font-medium text-emerald-600">
                      {completedCount}/{totalSteps} done
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900">{pb.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{pb.triggerReason}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isActive ? "rotate-180" : ""}`} />
            </button>

            {/* Expanded 3-phase view */}
            {isActive && (
              <div className="border-t border-gray-100">
                {/* Phase tabs */}
                <div className="flex border-b border-gray-100">
                  {([1, 2, 3] as const).map((p) => {
                    const labels = ["Take Action", "Update Metrics", "See Results"];
                    const isActiveTab = phase === p;
                    const phase1Done = allDone;
                    const phase2Done = metricsUpdated;
                    const isDone = (p === 1 && phase1Done) || (p === 2 && phase2Done);
                    const isLocked = !isPremium && p > 1;
                    return (
                      <button
                        key={p}
                        onClick={() => { if (!isLocked) setActivePhase(p); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium transition-all duration-150 ${
                          isLocked
                            ? "text-gray-400 opacity-50 cursor-default"
                            : isActiveTab
                              ? "text-violet-700 border-b-2 border-violet-500 bg-violet-50/40"
                              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/80"
                        }`}
                      >
                        {isDone && !isLocked ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </span>
                        ) : (
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold tabular-nums ${
                            isActiveTab && !isLocked
                              ? "bg-violet-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}>
                            {p}
                          </span>
                        )}
                        <span className="hidden sm:inline">{labels[p - 1]}</span>
                        {isLocked && <ProBadge small />}
                      </button>
                    );
                  })}
                </div>
                {!isPremium && (
                  <p style={{ fontSize: 11, color: "#b4bac5", textAlign: "center", padding: "6px 0 0" }}>
                    Pro users track metric changes and see score improvements over time.
                  </p>
                )}

                <div className="p-5">
                  {/* Trigger reasoning */}
                  {healthPillars && (
                    <div className="mb-4">
                      {isPremium ? (
                        <WhyToggle text={generatePlaybookTriggerReasoning(pb, healthPillars as Record<string, { score: number; reasons: string[]; levers: string[] }>, profileBusinessType)} />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 opacity-60">
                          <ProBadge small />
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed" }}>Why this playbook?</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Phase 1: Take Action ── */}
                  {phase === 1 && (
                    <div className="space-y-5">
                      {/* Header info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Expected impact</p>
                          <p className="text-sm text-gray-700 font-medium">{pb.baseImpact}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-gray-500 tabular-nums">
                            {isPremium
                              ? `${completedCount}/${totalSteps} steps completed`
                              : `${completedCount}/2 free steps \u00B7 ${Math.max(0, totalSteps - 2)} more with Pro`}
                          </span>
                          <span className="text-xs font-bold text-gray-700 tabular-nums">{Math.round((completedCount / (isPremium ? totalSteps : 2)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${(completedCount / totalSteps) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Interactive steps */}
                      <div className="space-y-2">
                        {pb.baseSteps.map((s, i) => {
                          const done = progress[i];
                          const isLockedStep = !isPremium && i >= 2;
                          const stepReason = !done && !isLockedStep && isPremium && healthPillars
                            ? generateStepReasoning(s, profileBusinessType, healthPillars as Record<string, { score: number; reasons: string[]; levers: string[] }>, pb.category)
                            : null;

                          if (isLockedStep) {
                            return (
                              <div
                                key={s.step}
                                style={{
                                  padding: "12px 14px",
                                  borderRadius: 10,
                                  background: "rgba(124,58,237,0.04)",
                                  border: "1px dashed rgba(124,58,237,0.10)",
                                  opacity: 0.7,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div style={{
                                  width: 20, height: 20, borderRadius: 5,
                                  border: "2px solid rgba(124,58,237,0.10)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  flexShrink: 0,
                                }}>
                                  <Lock style={{ width: 10, height: 10, color: "#7c3aed" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: "#5a6578", filter: "blur(2px)", userSelect: "none" }}>{s.title}</p>
                                  <span style={{ fontSize: 10, color: "#b4bac5" }}>
                                    {EFFORT_ESTIMATE[pb.effortLevel] || "~45 min"}
                                  </span>
                                </div>
                                <ProBadge small />
                              </div>
                            );
                          }

                          return (
                            <div key={s.step}>
                              <button
                                onClick={() => toggleStep(pb.slug, i)}
                                className={`w-full flex items-start gap-3 p-3 rounded-[10px] text-left transition-all duration-150 hover:-translate-y-px ${
                                  done ? "bg-emerald-50/50 border border-emerald-100" : "bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                }`}
                              >
                                <div className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-colors duration-150 ${
                                  done ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
                                }`}>
                                  {done && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold ${done ? "text-gray-400 line-through" : "text-gray-800"}`}>{s.title}</p>
                                  {!done && (
                                    <p className="text-xs mt-0.5 text-gray-500">{s.action}</p>
                                  )}
                                  {!done && (
                                    <span className="inline-block mt-1 text-[10px] text-gray-400">
                                      {EFFORT_ESTIMATE[pb.effortLevel] || "~45 min"}
                                    </span>
                                  )}
                                </div>
                              </button>
                              {stepReason && (
                                <div className="ml-8 mt-0.5">
                                  <WhyToggle text={stepReason.text} potential={stepReason.potential} />
                                </div>
                              )}
                              {/* Inline tool recommendation */}
                              {userProfile && !done && i >= 1 && i <= 3 && (() => {
                                const rec = getPlaybookStepRecommendation(pb.category, i + 1, userProfile);
                                if (!rec) return null;
                                const isToolOpen = expandedToolStep === i;
                                return (
                                  <div style={{ marginTop: 4, marginLeft: 32 }}>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setExpandedToolStep(isToolOpen ? null : i); }}
                                      style={{
                                        display: "inline-flex", alignItems: "center", gap: 6,
                                        padding: "4px 10px", borderRadius: 6,
                                        background: "rgba(67,97,238,0.06)", border: "1px solid rgba(67,97,238,0.12)",
                                        fontSize: 11, fontWeight: 600, color: "#4361ee",
                                        cursor: "pointer", transition: "background 0.15s",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(67,97,238,0.12)")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(67,97,238,0.06)")}
                                    >
                                      <Wrench style={{ width: 12, height: 12 }} />
                                      Recommended: {rec.name}
                                      <ChevronDown style={{ width: 10, height: 10, transform: isToolOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                                    </button>
                                    {isToolOpen && (
                                      <div style={{
                                        marginTop: 6, padding: "10px 12px", borderRadius: 8,
                                        background: "#fff", border: "1px solid #e6e9ef",
                                        animation: "fadeSlide 0.2s ease",
                                      }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                          <LogoImg src={faviconUrl(rec.domain || "", 64)} fallbackEmoji={rec.logo} size={28} radius={7} />
                                          <div>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1b2434" }}>{rec.name}</span>
                                            {rec.matchLabel && (
                                              <span style={{ fontSize: 9, fontWeight: 700, marginLeft: 6, padding: "2px 6px", borderRadius: 4, background: `${rec.matchColor}14`, color: rec.matchColor }}>{rec.matchLabel}</span>
                                            )}
                                          </div>
                                        </div>
                                        <p style={{ fontSize: 12, color: "#5a6578", lineHeight: 1.5, marginBottom: 8 }}>{rec.filledReasoning}</p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                          <span style={{ fontSize: 11, color: "#8d95a3" }}>{rec.price}</span>
                                          {rec.hasFreeTier && <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: "rgba(16,185,129,0.08)", color: "#10b981" }}>Free tier</span>}
                                        </div>
                                        <button
                                          onClick={() => handleAffClick(rec)}
                                          style={{ padding: "6px 12px", borderRadius: 7, background: "#4361ee", color: "#fff", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}
                                        >
                                          Try {rec.name} <ExternalLink style={{ width: 11, height: 11, display: "inline", marginLeft: 3 }} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>

                      {/* Unlock full playbook CTA — free users */}
                      {!isPremium && (
                        <div style={{
                          marginTop: 16, padding: "18px 20px", borderRadius: 11, textAlign: "center",
                          background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(67,97,238,0.06))",
                          border: "1px solid rgba(67,97,238,0.15)",
                        }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#1b2434", marginBottom: 4 }}>
                            Unlock {Math.max(0, totalSteps - 2)} more steps + AI personalized plan
                          </p>
                          <p style={{ fontSize: 12, color: "#5a6578", marginBottom: 12 }}>
                            Complete playbook with reasoning, templates, and guidance tailored to your business.
                          </p>
                          <Link
                            href="/pricing"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "10px 24px", borderRadius: 8,
                              background: "linear-gradient(135deg, #6366f1, #4361ee)",
                              color: "white", fontSize: 12, fontWeight: 700, textDecoration: "none",
                              boxShadow: "0 2px 10px rgba(99,102,241,0.2)",
                            }}
                          >
                            <ProBadge small /> Upgrade to Unlock Full Playbook
                          </Link>
                        </div>
                      )}

                      {/* Recommended tools for this playbook — powered by matching engine */}
                      {userProfile && (() => {
                        const pillarLabel = PILLAR_LABELS[pb.category] || pb.category;
                        const recTools = getToolRecommendations(userProfile)
                          .filter(t => t.targetPillars.includes(pillarLabel));
                        if (recTools.length === 0) return null;
                        return <RecommendedTools tools={recTools} isPremium={isPremium} integrations={integrations} />;
                      })()}

                      {/* AI Expansion CTA (premium) */}
                      {isPremium && (
                        <div className="border-t border-gray-100 pt-4">
                          {!expanded && !isExpanding && (
                            <button
                              onClick={() => handleExpand(pb.slug)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-[10px] text-sm font-semibold hover:from-violet-600 hover:to-blue-600 hover:-translate-y-px hover:shadow-md transition-all duration-150"
                            >
                              <Play className="w-4 h-4" />
                              Generate My Personalized Plan
                            </button>
                          )}
                          {isExpanding && (
                            <div className="flex items-center justify-center gap-2 py-4">
                              <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                              <span className="text-sm text-gray-500">Generating your personalized plan...</span>
                            </div>
                          )}
                          {expandError && !isExpanding && (
                            <div className="text-center py-3">
                              <p className="text-sm text-red-500 mb-2">{expandError}</p>
                              <button onClick={() => handleExpand(pb.slug)} className="text-xs text-violet-600 hover:underline">Try again</button>
                            </div>
                          )}
                          {expanded && (
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Your 7-Day Plan</p>
                              {expanded.personalizedSteps.map((s) => (
                                <div key={s.day} className="flex items-start gap-2.5 p-2.5 bg-violet-50/30 rounded-lg">
                                  <span className="flex-shrink-0 w-7 h-7 bg-violet-100 rounded-lg text-xs font-bold text-violet-600 flex items-center justify-center mt-0.5">D{s.day}</span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-800">{s.title}</p>
                                    <p className="text-xs text-gray-600 mt-0.5">{s.action}</p>
                                    <p className="text-xs text-violet-500 mt-0.5 italic">{s.whyNow}</p>
                                  </div>
                                </div>
                              ))}
                              {expanded.copyPrompt && (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-semibold text-gray-600">AI Execution Prompt</p>
                                    <button onClick={() => handleCopyPrompt(expanded.copyPrompt)} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors">
                                      {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                      {copiedPrompt ? "Copied!" : "Copy"}
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-500 leading-relaxed">{expanded.copyPrompt}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}


                      {/* Bottom note */}
                      <p className="text-[11px] text-gray-400 text-center pt-2">
                        Completing steps tracks execution but won&apos;t change your health score. Move to Step 2 when you&apos;re ready to update your numbers.
                      </p>
                    </div>
                  )}

                  {/* ── Phase 2: Update Metrics ── */}
                  {phase === 2 && (
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Time to measure results</p>
                        <p className="text-xs text-gray-500">Update your current numbers so we can recalculate your health score with real data.</p>
                      </div>

                      <div className="space-y-3">
                        {metrics.map((m) => {
                          const isDollar = m.label.includes("($)") || m.key.includes("Monthly") || m.key === "cac" || m.key === "ltv" || m.key === "avgOrderValue" || m.key === "netProfitMonthly";
                          const isPct = m.label.includes("(%)");
                          return (
                            <div key={m.key}>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-gray-600">{m.label}</label>
                                {prevValues[m.key] !== null && prevValues[m.key] !== undefined && (
                                  <span className="text-[10px] text-gray-400 tabular-nums">Previous: {isDollar ? "$" : ""}{prevValues[m.key]}{isPct ? "%" : ""}</span>
                                )}
                              </div>
                              <div className="relative">
                                {isDollar && (
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">$</span>
                                )}
                                <input
                                  type="number"
                                  step="any"
                                  placeholder={m.placeholder}
                                  value={metricForm[m.key] ?? ""}
                                  onChange={(e) => setMetricForm((prev) => ({ ...prev, [m.key]: e.target.value }))}
                                  className={`w-full py-2.5 border border-gray-200 rounded-[10px] text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent tabular-nums ${isDollar ? "pl-7 pr-3" : isPct ? "pl-3 pr-8" : "px-3"}`}
                                />
                                {isPct && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">%</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleSaveMetrics(pb)}
                        disabled={savingMetrics}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-[10px] text-sm font-semibold hover:from-violet-600 hover:to-blue-600 hover:-translate-y-px hover:shadow-md transition-all duration-150 disabled:opacity-50"
                      >
                        {savingMetrics ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                        {savingMetrics ? "Recalculating..." : "Recalculate My Score"}
                      </button>

                      {metricsUpdated && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <p className="text-xs text-emerald-700">Score recalculated! Switch to &quot;See Results&quot; to view the comparison.</p>
                        </div>
                      )}

                      <p className="text-[11px] text-gray-400 text-center">Your execution progress is saved separately.</p>
                    </div>
                  )}

                  {/* ── Phase 3: See Results ── */}
                  {phase === 3 && (
                    <div className="space-y-5">
                      {!afterScore ? (
                        <div className="text-center py-8">
                          <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-700 mb-1">No results yet</p>
                          <p className="text-xs text-gray-400 mb-4">Update your metrics in Phase 2 to see before/after comparison.</p>
                          <button
                            onClick={() => setActivePhase(2)}
                            className="text-xs text-violet-600 font-medium hover:underline"
                          >
                            Go to Update Metrics
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Before / After scores */}
                          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center items-center">
                            <div className="p-3 sm:p-5 bg-gray-50 rounded-[12px]">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Before</p>
                              <p className="text-2xl sm:text-4xl font-extrabold text-gray-400 tabular-nums">{beforeScore?.score ?? "—"}</p>
                            </div>
                            <div className="flex items-center justify-center">
                              <div className={`px-4 py-2 rounded-full text-sm font-bold tabular-nums ${
                                (afterScore.score - (beforeScore?.score ?? 0)) > 0
                                  ? "bg-emerald-100 text-emerald-700"
                                  : (afterScore.score - (beforeScore?.score ?? 0)) < 0
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {(afterScore.score - (beforeScore?.score ?? 0)) > 0 ? "+" : ""}
                                {afterScore.score - (beforeScore?.score ?? 0)} pts
                              </div>
                            </div>
                            <div className="p-3 sm:p-5 bg-violet-50 rounded-[12px]">
                              <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider mb-1">After</p>
                              <p className="text-2xl sm:text-4xl font-extrabold text-violet-600 tabular-nums">{afterScore.score}</p>
                            </div>
                          </div>

                          {/* Pillar changes */}
                          {beforeScore && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pillar Changes</p>
                              <div className="space-y-2">
                                {Object.entries(afterScore.pillars).map(([name, after]) => {
                                  const before = beforeScore.pillars[name];
                                  const diff = (after as PillarData).score - (before?.score ?? 0);
                                  if (diff === 0) return null;
                                  return (
                                    <div key={name} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-2.5 bg-gray-50 rounded-[10px]">
                                      <span className="text-xs font-semibold text-gray-600 w-20 sm:w-24">{PILLAR_LABELS[name] || name}</span>
                                      <span className="text-xs text-gray-400 w-8 sm:w-10 text-right tabular-nums">{before?.score ?? 0}</span>
                                      <ArrowRight className="w-3 h-3 text-gray-300" />
                                      <span className="text-xs font-bold text-gray-800 w-8 sm:w-10 tabular-nums">{(after as PillarData).score}</span>
                                      <span className={`text-xs font-bold tabular-nums ${diff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                        {diff > 0 ? "+" : ""}{diff}
                                      </span>
                                      <span className="text-[10px] text-gray-400 flex-1 hidden sm:inline">
                                        {diff > 0
                                          ? `${PILLAR_LABELS[name]} improved from metric updates`
                                          : `${PILLAR_LABELS[name]} decreased — review inputs`}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Attribution */}
                          <div className="px-3 py-2 bg-violet-50/50 rounded-lg border border-violet-100">
                            <p className="text-xs text-violet-700">
                              <span className="font-semibold">{pb.title}</span>
                              {" "}<ArrowRight className="w-3 h-3 inline" />{" "}
                              {Math.abs(afterScore.score - (beforeScore?.score ?? 0))} of {Math.abs(afterScore.score - (beforeScore?.score ?? 0))} points explained
                            </p>
                          </div>

                          {/* What's Next */}
                          <div className="border-t border-gray-100 pt-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">What&apos;s Next</p>
                            {(() => {
                              // Find weakest pillar that isn't this playbook's category
                              const sortedPillars = Object.entries(afterScore.pillars)
                                .filter(([name]) => name !== pb.category)
                                .sort(([, a], [, b]) => (a as PillarData).score - (b as PillarData).score);
                              const weakest = sortedPillars[0];
                              const nextPb = weakest
                                ? playbooks.find((p) => p.category === weakest[0] && p.slug !== pb.slug)
                                : null;
                              return (
                                <div className="p-3 bg-gray-50 rounded-[10px]">
                                  {weakest && (
                                    <p className="text-xs text-gray-600 mb-2">
                                      Your weakest pillar is now <span className="font-semibold">{PILLAR_LABELS[weakest[0]] || weakest[0]}</span> at <span className="tabular-nums">{(weakest[1] as PillarData).score}/100</span>.
                                    </p>
                                  )}
                                  <WhyToggle text={generateNextPlaybookReasoning(afterScore.pillars as Record<string, { score: number; reasons: string[]; levers: string[] }>, profileBusinessType, nextPb ?? null, pb.category)} />
                                  {nextPb ? (
                                    <button
                                      onClick={() => {
                                        setActiveSlug(nextPb.slug);
                                        setActivePhase(1);
                                        setMetricsUpdated(false);
                                        setAfterScore(null);
                                        setMetricForm({});
                                      }}
                                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-[7px] text-xs font-semibold hover:bg-violet-700 hover:-translate-y-px hover:shadow-md transition-all duration-150"
                                    >
                                      View Next Playbook: {nextPb.title}
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <p className="text-xs text-gray-500">Keep improving your metrics and check back for new triggered playbooks.</p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── AI Business Summary ──

function AiBusinessSummary({ isPremium }: { isPremium: boolean }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!isPremium) return;
    setLoading(true);
    fetch("/api/ai-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json?.summary) setSummary(json.summary); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isPremium]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const json = await res.json();
      if (json?.summary) setSummary(json.summary);
    } catch {}
    setRegenerating(false);
  };

  const cardContent = (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: "linear-gradient(135deg, #6366f1, #4361ee)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white",
        }}>
          <Sparkles style={{ width: 16, height: 16 }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1b2434" }}>Your Business at a Glance</span>
        {isPremium && summary && !loading && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            style={{ marginLeft: "auto", fontSize: 10, color: "#8d95a3", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>
        )}
      </div>
      <div style={{ fontSize: 14, color: "#5a6578", lineHeight: 1.7 }}>
        {isPremium && loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            <span className="text-sm text-gray-400">Generating your AI summary...</span>
          </div>
        ) : isPremium && summary ? (
          summary
        ) : (
          "Based on your diagnosis and metrics, your business is generating revenue with room for optimization. Your Revenue Health Score highlights key areas where targeted improvements could unlock significant additional monthly revenue. The scoring engine has identified your weakest pillar and calculated the estimated impact of addressing it first. Your playbook is designed around the highest-impact actions for your specific business type and current metrics. Focus on completing the recommended steps to see measurable improvements in your next score update."
        )}
      </div>
    </div>
  );

  if (!isPremium) {
    return (
      <div className="bg-white border border-gray-100 rounded-[14px] shadow-sm overflow-hidden">
        <LockedOverlay label="AI-Powered Business Summary">
          {cardContent}
        </LockedOverlay>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-[14px] shadow-sm overflow-hidden">
      {cardContent}
    </div>
  );
}

// ── Leave a Review Section ──

function LeaveReviewSection() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState<{ rating: number; comment: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch existing review on mount
  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        if (data.review) {
          setExistingReview(data.review);
          setRating(data.review.rating);
          setComment(data.review.comment || "");
          setSubmitted(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (res.ok) {
        const data = await res.json();
        setExistingReview(data.review);
        setSubmitted(true);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setSubmitted(false);
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-[#e6e9ef] rounded-[14px] shadow-sm" style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(67,97,238,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Star size={18} color="#4361ee" />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1b2434", margin: 0 }}>
            {submitted ? "Thanks for your review!" : "How is FixWorkFlow working for you?"}
          </h3>
          <p style={{ fontSize: 12, color: "#8d95a3", margin: 0 }}>
            {submitted ? "Your feedback helps us improve." : "Leave a rating and optional comment."}
          </p>
        </div>
      </div>

      {submitted ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={22}
                  fill={s <= (existingReview?.rating || rating) ? "#facc15" : "none"}
                  color={s <= (existingReview?.rating || rating) ? "#facc15" : "#d1d5db"}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1b2434" }}>
              {existingReview?.rating || rating}/5
            </span>
          </div>
          {existingReview?.comment && (
            <p style={{ fontSize: 13, color: "#5a6578", lineHeight: 1.6, margin: "0 0 12px", fontStyle: "italic" }}>
              &ldquo;{existingReview.comment}&rdquo;
            </p>
          )}
          <button
            onClick={handleEdit}
            style={{
              fontSize: 12, fontWeight: 600, color: "#4361ee",
              background: "none", border: "none", cursor: "pointer",
              padding: 0, textDecoration: "underline",
            }}
          >
            Update your review
          </button>
        </div>
      ) : (
        <div>
          {/* Star Rating */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 2,
                  transition: "transform 0.1s",
                  transform: (hover === s) ? "scale(1.15)" : "scale(1)",
                }}
              >
                <Star
                  size={28}
                  fill={s <= (hover || rating) ? "#facc15" : "none"}
                  color={s <= (hover || rating) ? "#facc15" : "#d1d5db"}
                  strokeWidth={1.5}
                />
              </button>
            ))}
            {rating > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1b2434", alignSelf: "center", marginLeft: 4 }}>
                {rating}/5
              </span>
            )}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional: Tell us what you think..."
            rows={3}
            style={{
              width: "100%", fontSize: 13, color: "#1b2434",
              border: "1px solid #e6e9ef", borderRadius: 10, padding: "12px 14px",
              resize: "vertical", outline: "none", fontFamily: "inherit",
              background: "#fafbfd",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#4361ee"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#e6e9ef"; }}
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={rating < 1 || submitting}
            style={{
              marginTop: 12, padding: "10px 24px", fontSize: 13, fontWeight: 700,
              color: "#fff", background: rating < 1 ? "#d1d5db" : "#4361ee",
              border: "none", borderRadius: 10, cursor: rating < 1 ? "default" : "pointer",
              opacity: submitting ? 0.7 : 1,
              transition: "background 0.15s",
            }}
          >
            {submitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Bottom Upgrade Banner (free users only) ──

function BottomUpgradeBanner() {
  const benefits = [
    "AI-powered business summary updated daily",
    "Deep risk analysis with weighted pillar impact",
    "Full playbooks with all steps + personalized 7-day plans",
    "Metric tracking with before/after score comparisons",
    "Premium tools ranked by impact for your business type",
  ];

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(67,97,238,0.06))",
      border: "1px solid rgba(67,97,238,0.15)",
      borderRadius: 14, padding: "32px 36px", textAlign: "center",
    }}>
      <p style={{ fontSize: 20, fontWeight: 800, color: "#1b2434", marginBottom: 4 }}>
        Get the full picture
      </p>
      <p style={{ fontSize: 14, color: "#5a6578", marginBottom: 20 }}>
        Unlock every insight, playbook, and AI feature to grow faster.
      </p>
      <div style={{
        display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start",
        maxWidth: 420, margin: "0 auto 24px",
      }}>
        {benefits.map((b) => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 20, height: 20, borderRadius: 6,
              background: "rgba(16,185,129,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: "#10b981" }} />
            </span>
            <span style={{ fontSize: 13, color: "#1b2434", fontWeight: 500, textAlign: "left" }}>{b}</span>
          </div>
        ))}
      </div>
      <Link
        href="/pricing"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "14px 36px", borderRadius: 12,
          background: "linear-gradient(135deg, #6366f1, #4361ee)",
          color: "white", fontSize: 15, fontWeight: 700, textDecoration: "none",
          boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
      >
        Upgrade to Pro
      </Link>
      <p style={{ fontSize: 12, color: "#8d95a3", marginTop: 14 }}>
        Join 850+ business owners who upgraded their workflow
      </p>
    </div>
  );
}

// ── Recommendations Section (Tool Stack + Resource Shelf) ──

function RecommendationsSection({ isPremium, hasScore, integrations = [] }: { isPremium: boolean; hasScore: boolean; integrations?: { id: string; provider: string; status: string }[] }) {
  const [tools, setTools] = useState<ScoredProduct[]>([]);
  const [books, setBooks] = useState<ScoredProduct[]>([]);
  const [courses, setCourses] = useState<ScoredProduct[]>([]);
  const [templates, setTemplates] = useState<ScoredProduct[]>([]);
  const [businessType, setBusinessType] = useState("");
  const [revenueRange, setRevenueRange] = useState("");
  const [usesPersonalCredit, setUsesPersonalCredit] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { data: recSession } = useSession();

  useEffect(() => {
    if (!hasScore) return;
    Promise.all([
      fetch("/api/revenue-health").then(r => r.ok ? r.json() : null),
      fetch("/api/revenue-health/profile").then(r => r.ok ? r.json() : null),
    ]).then(([healthJson, profileJson]) => {
      if (!healthJson?.result?.pillars || !profileJson?.data) return;
      const pillars = healthJson.result.pillars;
      const profile = profileJson.data;
      const bt = profile.businessType || "service_agency";
      const rev = profile.revenueMonthly || 0;
      setBusinessType(bt);
      const revLabel = rev >= 50000 ? "$50k+" : rev >= 15000 ? "$15k\u2013$50k" : rev >= 5000 ? "$5k\u2013$15k" : rev >= 1000 ? "$1k\u2013$5k" : rev > 0 ? "$0\u2013$1k" : "Pre-revenue";
      setRevenueRange(revLabel);
      setUsesPersonalCredit(profile.usesPersonalCredit ?? null);
      const pillarScores: Record<string, number> = {};
      for (const [key, val] of Object.entries(pillars)) {
        pillarScores[key] = (val as PillarData).score;
      }
      const up: RecUserProfile = {
        businessType: bt,
        revenueMonthly: rev,
        grossMarginPct: profile.grossMarginPct ?? undefined,
        conversionRatePct: profile.conversionRatePct ?? undefined,
        trafficMonthly: profile.trafficMonthly ?? undefined,
        frictionAreas: profile.frictionAreas ?? undefined,
        pillarScores,
      };
      setTools(getToolRecommendations(up));
      setBooks(getResourceRecommendations(up, "book"));
      setCourses(getResourceRecommendations(up, "course"));
      setTemplates(getResourceRecommendations(up, "template"));
      setLoaded(true);
    }).catch(() => {});
  }, [hasScore]);

  if (!hasScore || !loaded) return null;

  return (
    <CreditReferralProvider
      userName={recSession?.user?.name || ""}
      userEmail={recSession?.user?.email || ""}
      userPhone={(recSession?.user as Record<string, unknown> | undefined)?.phone as string || ""}
    >
      {/* Credit repair card — featured placement above tool stack */}
      <CreditRepairCard usesPersonalCredit={usesPersonalCredit} />
      {tools.length > 0 && <RecommendedTools tools={tools} isPremium={isPremium} integrations={integrations} />}
      {(books.length > 0 || courses.length > 0 || templates.length > 0) && (
        <ResourceShelf
          books={books}
          courses={courses}
          templates={templates}
          isPremium={isPremium}
          businessType={businessType}
          revenueRange={revenueRange}
          usesPersonalCredit={usesPersonalCredit}
        />
      )}
    </CreditReferralProvider>
  );
}

// ── Main Dashboard ──

export default function RevenueDashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasScore, setHasScore] = useState(false);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [scoreRefreshKey, setScoreRefreshKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [phoneBannerDismissed, setPhoneBannerDismissed] = useState(false);
  const [integrations, setIntegrations] = useState<{ id: string; provider: string; status: string; lastSyncAt: string | null; lastSyncStatus: string | null; lastSyncError: string | null }[]>([]);
  const [metricSources, setMetricSources] = useState<Record<string, string>>({});
  const [pillarHistory, setPillarHistory] = useState<Record<string, { prev: number; current: number }>>({});
  const [whyOpen, setWhyOpen] = useState(false);
  const [whySelected, setWhySelected] = useState<WhyItem | null>(null);
  const [whyData, setWhyData] = useState<WhyData | null>(null);
  const [whyLoading, setWhyLoading] = useState(false);
  const [whyError, setWhyError] = useState<string | null>(null);
  const [trackerReminderDismissed, setTrackerReminderDismissed] = useState(false);
  const [showTrackerReminder, setShowTrackerReminder] = useState(false);
  const [adminSyncing, setAdminSyncing] = useState(false);
  const [adminLastSync, setAdminLastSync] = useState<string | null>(null);

  // Handle post-Stripe-checkout upgrade: refresh JWT so isPremium updates
  useEffect(() => {
    if (searchParams.get("upgraded") !== "1") return;
    // Strip the query param from the URL
    window.history.replaceState({}, "", "/dashboard");

    // Poll for up to 8 seconds — webhook may not have fired yet
    let attempts = 0;
    const poll = async () => {
      await update(); // Force JWT refresh from DB
      attempts++;
      const user = session?.user as Record<string, unknown> | undefined;
      if (user?.isPremium) {
        toast("Welcome to FixWorkFlow Pro!", "success");
        return;
      }
      if (attempts < 8) {
        setTimeout(poll, 1000);
      } else {
        toast("Payment received! Your Pro access may take a moment to activate. Refresh the page if needed.", "success");
      }
    };
    poll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openWhy = useCallback(async (item: WhyItem) => {
    setWhySelected(item);
    setWhyOpen(true);
    setWhyLoading(true);
    setWhyError(null);
    setWhyData(null);

    try {
      const res = await fetch("/api/ai/why", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      const text = await res.text();
      let json: WhyData | null = null;

      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // not JSON
      }

      if (!res.ok) {
        throw new Error(
          (json as Record<string, unknown> | null)?.error as string
            || text
            || `Request failed (${res.status})`,
        );
      }

      if (!json) {
        throw new Error("API returned an empty response.");
      }

      setWhyData(json);
    } catch (e: unknown) {
      setWhyError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setWhyLoading(false);
    }
  }, []);

  // @ts-ignore
  const isPremium = session?.user?.isPremium;

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const user = session.user as Record<string, unknown>;

    // Admin users skip funnel redirects
    if (!user.isAdmin) {
      // Redirect through the funnel if not completed
      if (!user.diagnosisCompleted) {
        router.push("/diagnosis");
        return;
      }
    }

    // Fetch integration data for all authenticated users
    fetch("/api/integrations").then((r) => r.json()).then((d) => {
      if (d.integrations) setIntegrations(d.integrations);
    }).catch(() => {});

    if (!isPremium) {
      setLoading(false);
      return;
    }

    fetch("/api/revenue/dashboard")
      .then((r) => {
        if (r.status === 402) throw new Error("upgrade");
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((json) => {
        setDashData(json.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Fetch metric sources and pillar history
    fetch("/api/dashboard/integration-status").then((r) => r.json()).then((d) => {
      if (d.metricSources) setMetricSources(d.metricSources);
      if (d.pillarHistory) setPillarHistory(d.pillarHistory);
    }).catch(() => toast("Failed to load integration status.", "error"));
  }, [session, status, isPremium, router, toast]);

  // Weekly tracker reminder: show if Pro user hasn't logged this week by Thursday
  useEffect(() => {
    if (!isPremium) return;
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 4=Thu
    if (dayOfWeek < 4 && dayOfWeek !== 0) return; // Only show Thu-Sun
    fetch("/api/tracker/history")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (!json?.logs?.length) { setShowTrackerReminder(true); return; }
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        const day = d.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setUTCDate(d.getUTCDate() + diff);
        const mondayStr = d.toISOString().slice(0, 10);
        const hasThisWeek = json.logs.some((l: { weekOf: string }) => l.weekOf.slice(0, 10) === mondayStr);
        if (!hasThisWeek) setShowTrackerReminder(true);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  // Admin auto-sync: update score from real platform data (throttled to 1hr)
  useEffect(() => {
    const user = session?.user as Record<string, unknown> | undefined;
    if (!user?.isAdmin) return;
    const lastSync = localStorage.getItem("adminLastSync");
    if (lastSync && Date.now() - Number(lastSync) < 60 * 60 * 1000) {
      setAdminLastSync(new Date(Number(lastSync)).toISOString());
      return;
    }
    fetch("/api/admin/auto-sync-score", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && !d.throttled) {
          localStorage.setItem("adminLastSync", String(Date.now()));
          setAdminLastSync(d.lastSync);
          setScoreRefreshKey((k) => k + 1);
        } else if (d.ok && d.throttled) {
          setAdminLastSync(d.lastSync);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (status === "loading" || loading) {
    return null; // Next.js loading.tsx skeleton handles this
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Sign in to access your revenue dashboard.</p>
          <Link href="/signup" className="text-blue-600 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (error && error !== "upgrade") {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-red-500 text-sm">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 relative z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">FixWorkFlow</span>
          </Link>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            {!isPremium && (
              <Link
                href="/pricing"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 8,
                  background: "linear-gradient(135deg, #6366f1, #4361ee)",
                  color: "white", fontSize: 12, fontWeight: 700, textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.18)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
              >
                Upgrade to Pro
              </Link>
            )}
            <Link href="/settings?tab=integrations" style={{ fontSize: 13, color: "#5a6578", textDecoration: "none", fontWeight: 500 }}>
              Integrations
            </Link>
            <button
              onClick={() => setFeedbackOpen(true)}
              style={{ fontSize: 13, color: "#5a6578", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}
            >
              Feedback
            </button>
            {!!(session?.user as Record<string, unknown> | undefined)?.isAdmin && (
              <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>
                Admin
                <span style={{ fontSize: 9, fontWeight: 800, background: "#7c3aed", color: "#fff", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>ADMIN</span>
              </Link>
            )}
            {session?.user && <UserAvatarDropdown user={session.user} />}
          </div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-1.5 text-gray-700"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0 top-[52px] z-40 bg-white overflow-y-auto">
          <div className="flex flex-col p-4 gap-1">
            <Link href="/settings" onClick={() => setMenuOpen(false)} className="block px-3 py-3.5 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50">
              Settings
            </Link>
            <Link href="/settings?tab=integrations" onClick={() => setMenuOpen(false)} className="block px-3 py-3.5 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50">
              Integrations
            </Link>
            <button onClick={() => { setFeedbackOpen(true); setMenuOpen(false); }} className="block w-full text-left px-3 py-3.5 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50" style={{ fontFamily: "inherit", background: "none", border: "none", cursor: "pointer" }}>
              Feedback
            </button>
            {!isPremium && (
              <Link href="/pricing" onClick={() => setMenuOpen(false)} className="block px-3 py-3.5 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50">
                Upgrade to Pro
              </Link>
            )}
            {!!(session?.user as Record<string, unknown> | undefined)?.isAdmin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-3.5 text-base font-semibold text-violet-600 rounded-lg hover:bg-violet-50">
                Admin
              </Link>
            )}
            <div className="mt-2 pt-3 border-t border-gray-100">
              {session?.user && <UserAvatarDropdown user={session.user} />}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSuccess={() => toast("Thanks! We read every submission.", "success")}
      />

      {/* Why Drawer */}
      <WhyDrawer
        open={whyOpen}
        selected={whySelected}
        data={whyData}
        loading={whyLoading}
        error={whyError}
        onClose={() => setWhyOpen(false)}
        isPremium={isPremium}
      />

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* AI Business Summary — top of dashboard */}
        <AiBusinessSummary isPremium={isPremium} />

        {/* Missing phone number prompt */}
        {!phoneBannerDismissed && session?.user && !(session.user as Record<string, unknown>).phone && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-amber-800 flex-1">
              Add your phone number so our partners can reach you.{" "}
              <Link href="/settings" className="text-indigo-600 font-medium hover:underline">
                Update in Settings
              </Link>
            </span>
            <button
              onClick={() => setPhoneBannerDismissed(true)}
              className="text-amber-400 hover:text-amber-600 p-0.5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Weekly tracker reminder */}
        {showTrackerReminder && !trackerReminderDismissed && isPremium && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
            <Activity className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-blue-800 flex-1">
              You haven&apos;t logged this week&apos;s numbers yet.{" "}
              <a href="#revenue-tracker" className="text-indigo-600 font-medium hover:underline">
                Log Now
              </a>
            </span>
            <button
              onClick={() => setTrackerReminderDismissed(true)}
              className="text-blue-400 hover:text-blue-600 p-0.5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Connected Integrations CTA Card */}
        {(() => {
          const INTEGRATION_ICON_DOMAINS: Record<string, string> = {
            shopify: "cdn.shopify.com",
            "stripe-data": "stripe.com",
            quickbooks: "quickbooks.intuit.com",
            "google-analytics": "analytics.google.com",
          };
          const connectedCount = integrations.length;
          const pct = Math.round((connectedCount / 15) * 100);
          return (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e6e9ef", padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: "rgba(67,97,238,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plug size={20} color="#4361ee" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1b2434" }}>Connected Integrations</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8d95a3" }}>{connectedCount} of 15 tools connected</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "#f0f0f0", marginBottom: 6 }}>
                  <div style={{ height: 4, borderRadius: 2, background: "#4361ee", width: `${pct}%`, transition: "width 0.3s ease" }} />
                </div>
                {connectedCount > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {integrations.map((intg) => {
                      const domain = INTEGRATION_ICON_DOMAINS[intg.provider] || intg.provider;
                      return (
                        <img
                          key={intg.id}
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                          alt={intg.provider}
                          style={{ width: 20, height: 20, borderRadius: 4, objectFit: "contain", background: "#fff", border: "1px solid #f0f2f6" }}
                        />
                      );
                    })}
                    <span style={{ fontSize: 12, color: "#8d95a3", marginLeft: 4 }}>connected</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: "#8d95a3" }}>Connect your business tools for a more accurate Revenue Health Score</span>
                )}
              </div>
              <Link href="/settings?tab=integrations" style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #4361ee, #6366f1)", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                Browse Integrations &rarr;
              </Link>
            </div>
          );
        })()}

        {/* Admin: Sync My Score card */}
        {!!(session?.user as Record<string, unknown> | undefined)?.isAdmin && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e6e9ef", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, minWidth: 36, borderRadius: 8, background: "rgba(16,185,129,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={18} color="#10b981" style={adminSyncing ? { animation: "spin 1s linear infinite" } : undefined} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1b2434" }}>Admin Score Auto-Sync</span>
              <span style={{ fontSize: 11, color: "#8d95a3", marginLeft: 8 }}>
                {adminLastSync ? `Last synced ${new Date(adminLastSync).toLocaleTimeString()}` : "Not synced yet"}
              </span>
            </div>
            <button
              onClick={() => {
                setAdminSyncing(true);
                fetch("/api/admin/auto-sync-score?force=true", { method: "POST" })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.ok) {
                      localStorage.setItem("adminLastSync", String(Date.now()));
                      setAdminLastSync(d.lastSync);
                      setScoreRefreshKey((k) => k + 1);
                    }
                  })
                  .catch(() => {})
                  .finally(() => setAdminSyncing(false));
              }}
              disabled={adminSyncing}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "1px solid #10b981",
                background: "transparent", color: "#10b981", fontSize: 12, fontWeight: 600,
                cursor: adminSyncing ? "not-allowed" : "pointer", fontFamily: "inherit",
                opacity: adminSyncing ? 0.6 : 1, whiteSpace: "nowrap",
              }}
            >
              {adminSyncing ? "Syncing..." : "Sync My Score"}
            </button>
          </div>
        )}

        {/* Revenue Health Score Section */}
        <RevenueHealthSection isPremium={isPremium} onScoreChange={setHasScore} onMissingData={setMissingKeys} key={scoreRefreshKey} />

        {/* Revenue Command Center (Pro) */}
        <div id="revenue-command-center">
          <CommandCenter isPremium={isPremium} onScoreRefresh={() => setScoreRefreshKey((k) => k + 1)} />
        </div>

        {/* Execution Playbooks (3-Phase Tracker) */}
        <PlaybooksSection isPremium={isPremium} hasScore={hasScore} onScoreRefresh={() => setScoreRefreshKey((k) => k + 1)} integrations={integrations} />

        {/* Recommended Tools & Resources */}
        <RecommendationsSection isPremium={isPremium} hasScore={hasScore} integrations={integrations} />

        {/* Leave a Review */}
        <LeaveReviewSection />

        {/* Bottom Upgrade Banner — free users only */}
        {!isPremium && <BottomUpgradeBanner />}

        {/* Existing Revenue Intelligence Dashboard */}
        {dashData && (
          <div className="space-y-6">
            {/* Top Row: Score + Revenue Opportunity */}
            <CollapsibleSection title="Revenue Intelligence" icon={<Activity className="w-3.5 h-3.5 text-gray-400" />}>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="flex flex-col items-center">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                    Score
                  </p>
                  <ScoreGauge score={dashData.score.total} band={dashData.score.band} />
                  <p className={`text-sm font-semibold mt-3 ${BAND_COLORS[dashData.score.band] || "text-gray-600"}`}>
                    {dashData.score.band}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(dashData.score.calculatedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Revenue Opportunity */}
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                    Revenue Opportunity
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${dashData.revenueGap.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-400">/mo</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Estimated gap vs benchmark for your business type and stage.
                  </p>
                  {dashData.businessProfile && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-xs text-gray-400">
                        {dashData.businessProfile.businessType} &middot; {dashData.businessProfile.revenueStage} &middot; ${dashData.businessProfile.currentRevenue.toLocaleString()}/mo
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Bottleneck */}
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                    Primary Bottleneck
                  </p>
                  {dashData.bottleneck ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <span className="text-lg font-semibold text-gray-900">
                          {dashData.bottleneck.primary}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-400">Severity</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-amber-500"
                            style={{ width: `${dashData.bottleneck.severity}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {dashData.bottleneck.severity}
                        </span>
                      </div>
                      {dashData.bottleneck.secondary.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {dashData.bottleneck.secondary.map((b) => (
                            <span
                              key={b}
                              className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-xs text-gray-500"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">None detected</p>
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* Component Breakdown */}
            <CollapsibleSection title="Score Breakdown">
              <div className="space-y-3">
                {Object.entries(dashData.score.components).map(([key, val]) => (
                  <ComponentBar key={key} label={key} value={val as number} />
                ))}
              </div>
            </CollapsibleSection>

            {/* Insight Section */}
            {dashData.insight && (
              <>
                {/* Summary */}
                <CollapsibleSection title="Revenue Analysis">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {dashData.insight.summary}
                  </p>
                </CollapsibleSection>

                {/* Weekly Directive + Risks/Opportunities */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Weekly Execution Plan */}
                  <CollapsibleSection
                    title="This Week's Directive"
                    icon={<Target className="w-3.5 h-3.5 text-gray-400" />}
                  >
                    <ol className="space-y-2.5">
                      {dashData.insight.weeklyExecutionPlan.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded text-xs font-medium text-gray-500 flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CollapsibleSection>

                  {/* Risks & Opportunities */}
                  <div className="space-y-6">
                    {dashData.insight.riskWarnings.length > 0 && (
                      <CollapsibleSection
                        title="Risk Warnings"
                        icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                      >
                        <ul className="space-y-2">
                          {dashData.insight.riskWarnings.map((w, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}

                    {dashData.insight.opportunitySignals.length > 0 && (
                      <CollapsibleSection
                        title="Opportunity Signals"
                        icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                      >
                        <ul className="space-y-2">
                          {dashData.insight.opportunitySignals.map((s, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}
                  </div>
                </div>

                {/* Recommended Stack */}
                {dashData.insight.recommendedTools.length > 0 && (
                  <CollapsibleSection title="Recommended Stack">
                    <div className="space-y-2">
                      {dashData.insight.recommendedTools.map((tool, i) => {
                        const [slug, ...reasonParts] = tool.split(":");
                        const reason = reasonParts.join(":").trim();
                        return (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {slug}
                            </span>
                            {reason && (
                              <span className="text-xs text-gray-500">{reason}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleSection>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 pt-4 pb-8">
          Score recalculated when you update your business profile or complete a metric check-in.
        </p>
      </div>
    </div>
  );
}
