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

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  Copy,
  Check,
  Lightbulb,
} from "lucide-react";
import { dispatchChatPrefill } from "@/lib/prompts/chatContext";
import { CATEGORY_PROMPT_MAP } from "@/lib/prompts/rationale";

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

// ── Sprint B Types ──

interface ActionTaskData {
  id: string;
  title: string;
  why: string;
  howToStart: string;
  expectedImpact: string;
  effort: "S" | "M" | "L";
  dueInDays: number;
  pillar: string;
}

interface ActionPlanData {
  tasks: ActionTaskData[];
  primaryPillar: string;
  secondaryPillar: string;
}

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
      <span className="text-xs text-gray-500 w-28 text-right capitalize">
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

function PillarBar({ name, pillar }: { name: string; pillar: PillarData }) {
  const width = Math.max(2, pillar.score);
  let barColor = "bg-red-500";
  if (pillar.score >= 80) barColor = "bg-emerald-500";
  else if (pillar.score >= 60) barColor = "bg-blue-500";
  else if (pillar.score >= 40) barColor = "bg-amber-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-gray-600 w-28 text-right">
          {PILLAR_LABELS[name] || name}
        </span>
        <div className="flex-1 bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${barColor}`}
            style={{ width: `${width}%`, transition: "width 0.8s ease" }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-800 w-10">{pillar.score}</span>
      </div>
      {pillar.reasons.length > 0 && (
        <div className="ml-32 space-y-0.5">
          {pillar.reasons.map((r, i) => (
            <p key={i} className="text-xs text-gray-400">{r}</p>
          ))}
        </div>
      )}
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

function RevenueHealthSection({ isPremium, onScoreChange, onOpenWhy }: { isPremium: boolean; onScoreChange: (has: boolean) => void; onOpenWhy: (item: WhyItem) => void }) {
  const [healthData, setHealthData] = useState<RevenueHealthData | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [businessType, setBusinessType] = useState<string>("");
  const [savedBusinessType, setSavedBusinessType] = useState<string>("");

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
      .then((json: { ok: boolean; result: RevenueHealthData | null; updatedAt?: string }) => {
        if (json.result) {
          setHealthData(json.result);
          setUpdatedAt(json.updatedAt ?? null);
          setHasProfile(true);
          onScoreChange(true);
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
    if (!isPremium) return;
    fetchScore();
    // Also load profile to get businessType for display
    loadProfileValues();
  }, [isPremium, fetchScore, loadProfileValues]);

  const handleEditProfile = () => {
    loadProfileValues();
    setShowForm(true);
    setSaveError(null);
  };

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
      })
      .catch(() => {
        setSaving(false);
        setSaveError("Failed to save. Please try again.");
      });
  };

  if (!isPremium) return null;

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
        <p className="text-xs text-gray-400 mt-2">Loading Revenue Health Score...</p>
      </div>
    );
  }

  // No profile — show CTA
  if (!hasProfile && !showForm) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 rounded-2xl p-8 shadow-sm text-center">
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
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
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
    <div className="space-y-6">
      {/* Score + Risk + Lever */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Score Ring */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center">
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
              <span className={`text-3xl font-bold ${scoreColor}`}>{healthData.score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
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
          {updatedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Updated {new Date(updatedAt).toLocaleDateString()} {new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <button
            onClick={handleEditProfile}
            className="mt-2 text-xs text-blue-500 hover:text-blue-700"
          >
            Update Profile
          </button>
        </div>

        {/* Primary Risk */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Primary Risk
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{healthData.primaryRisk}</p>
        </div>

        {/* Fastest Lever */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-medium text-emerald-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Fastest Lever
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{healthData.fastestLever}</p>
        </div>
      </div>

      {/* 5 Pillar Breakdown */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-5">
          5-Pillar Breakdown
        </h2>
        <div className="space-y-4">
          {Object.entries(healthData.pillars).map(([name, pillar]) => (
            <PillarBar key={name} name={name} pillar={pillar as PillarData} />
          ))}
        </div>
      </div>

      {/* Next Steps */}
      {healthData.recommendedNextSteps.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Recommended Next Steps
          </h2>
          <div className="space-y-3">
            {healthData.recommendedNextSteps.map((step, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded text-xs font-medium text-gray-600 flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 flex-1">{step.title}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${EFFORT_COLORS[step.effort]}`}>
                    {step.effort}
                  </span>
                </div>
                <p className="text-xs text-gray-500 ml-7 mb-1">{step.why}</p>
                <div className="flex items-center justify-between ml-7">
                  <p className="text-xs text-gray-600 font-medium">{step.howToStart}</p>
                  <div className="flex items-center gap-1">
                    <WhyButton
                      itemType="focus"
                      itemKey={`nextstep-${i}`}
                      pillar={guessCategory(step.title)}
                      title={step.title}
                      description={`${step.why} How to start: ${step.howToStart}`}
                      onOpen={onOpenWhy}
                    />
                    <AskAiButton
                      category={guessCategory(step.title)}
                      selectedItem={{
                        title: step.title,
                        category: guessCategory(step.title),
                        description: `${step.why} How to start: ${step.howToStart}`,
                      }}
                      isPremium={isPremium}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Data */}
      {healthData.missingData.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-amber-700 mb-1">
            Missing data ({healthData.missingData.length} fields) — your score could be more accurate
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {healthData.missingData.map((key) => (
              <span key={key} className="px-2 py-0.5 bg-amber-100 border border-amber-200 rounded text-xs text-amber-700">
                Add {key.replace(/([A-Z])/g, " $1").toLowerCase()}
              </span>
            ))}
          </div>
          <button
            onClick={handleEditProfile}
            className="mt-3 text-xs text-amber-800 font-medium hover:underline"
          >
            Update profile to improve accuracy
          </button>
        </div>
      )}
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

// ── Sprint B: Action Plan + Tools Section ──

const EFFORT_SIZE_COLORS: Record<string, string> = {
  S: "bg-emerald-100 text-emerald-700",
  M: "bg-amber-100 text-amber-700",
  L: "bg-red-100 text-red-700",
};

const EFFORT_SIZE_LABELS: Record<string, string> = {
  S: "Quick win",
  M: "Medium",
  L: "Deep work",
};

function ActionPlanToolsSection({ isPremium, hasScore, onOpenWhy }: { isPremium: boolean; hasScore: boolean; onOpenWhy: (item: WhyItem) => void }) {
  const [actionPlan, setActionPlan] = useState<ActionPlanData | null>(null);
  const [toolsByPillar, setToolsByPillar] = useState<ToolsByPillarData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    if (!isPremium || !hasScore) {
      setLoading(false);
      return;
    }
    fetch("/api/revenue-intelligence")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((json) => {
        setActionPlan(json.actionPlan ?? null);
        setToolsByPillar(json.toolsByPillar ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isPremium, hasScore]);

  const handleToolClick = (tool: RecToolData) => {
    fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolId: tool.id,
        slug: tool.slug,
        source: "revenue-dashboard",
        context: { pillar: tool.pillar, placement: "recommended-tools" },
      }),
    }).catch(() => {});
    window.open(tool.affiliateUrl, "_blank", "noopener");
  };

  if (!hasScore) return null;

  // Non-premium: locked preview
  if (!isPremium) {
    return (
      <div className="space-y-6">
        <div className="relative">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm opacity-50 blur-[2px] pointer-events-none">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">This Week&apos;s Focus</h2>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-lg text-center">
              <Lock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 mb-1">Action Plan & Tools</p>
              <p className="text-xs text-gray-500 mb-3">Unlock personalized weekly plans and tool recommendations</p>
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
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
        <p className="text-xs text-gray-400 mt-2">Loading action plan & tools...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* This Week's Focus */}
      {actionPlan && actionPlan.tasks.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              This Week&apos;s Focus
            </h2>
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-xs text-blue-600">
                {PILLAR_LABELS[actionPlan.primaryPillar] || actionPlan.primaryPillar}
              </span>
              <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-xs text-gray-500">
                {PILLAR_LABELS[actionPlan.secondaryPillar] || actionPlan.secondaryPillar}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {actionPlan.tasks.map((task) => {
              const isExpanded = expandedTask === task.id;
              return (
                <div key={task.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg text-xs font-semibold text-gray-500 flex items-center justify-center">
                      D{task.dueInDays}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-400">
                        {PILLAR_LABELS[task.pillar] || task.pillar}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${EFFORT_SIZE_COLORS[task.effort]}`}>
                      {EFFORT_SIZE_LABELS[task.effort]}
                    </span>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-0 space-y-2 border-t border-gray-50">
                      <div className="pt-3">
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Why</p>
                        <p className="text-xs text-gray-600">{task.why}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">How to start</p>
                        <p className="text-xs text-gray-600">{task.howToStart}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Expected impact</p>
                        <p className="text-xs text-gray-600">{task.expectedImpact}</p>
                      </div>
                      <div className="pt-2 flex items-center justify-end gap-1.5">
                        <WhyButton
                          itemType="focus"
                          itemKey={task.id}
                          pillar={task.pillar}
                          title={task.title}
                          description={`${task.why} How to start: ${task.howToStart}. Expected impact: ${task.expectedImpact}`}
                          onOpen={onOpenWhy}
                        />
                        <AskAiButton
                          category={task.pillar}
                          selectedItem={{
                            title: task.title,
                            category: task.pillar,
                            description: `${task.why} Expected impact: ${task.expectedImpact}`,
                          }}
                          isPremium={isPremium}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Tools */}
      {toolsByPillar && toolsByPillar.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" />
            Recommended Tools
          </h2>
          <div className="space-y-5">
            {toolsByPillar.map((group) => (
              <div key={group.pillar}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xs font-semibold text-gray-700">{group.pillarLabel}</span>
                  <span className="text-xs text-gray-400">{group.pillarScore}/100</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {group.tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {tool.pickLabel && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            tool.pickLabel === "Best for you"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}>
                            {tool.pickLabel}
                          </span>
                        )}
                        {tool.promoLabel && (
                          <span className="px-1.5 py-0.5 bg-violet-50 border border-violet-100 rounded text-[10px] text-violet-600">
                            {tool.promoLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">{tool.name}</p>
                        {tool.rating && (
                          <span className="text-xs text-gray-400">{tool.rating.toFixed(1)}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{tool.whyItFits}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {tool.hasFreeTier ? "Free tier" : tool.pricing || "Paid"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <WhyButton
                            itemType="tool"
                            itemKey={tool.slug}
                            pillar={tool.pillar}
                            title={tool.name}
                            description={`${tool.whyItFits} Category: ${tool.category}. Pillar: ${tool.pillar}`}
                            onOpen={onOpenWhy}
                          />
                          <AskAiButton
                            category="tools"
                            selectedItem={{
                              title: tool.name,
                              category: tool.category,
                              description: `${tool.whyItFits} Pillar: ${tool.pillar}`,
                            }}
                            isPremium={isPremium}
                          />
                          <button
                            onClick={() => handleToolClick(tool)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                          >
                            View
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ──

export default function RevenueDashboard() {
  const { data: session, status } = useSession();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasScore, setHasScore] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [whySelected, setWhySelected] = useState<WhyItem | null>(null);
  const [whyData, setWhyData] = useState<WhyData | null>(null);
  const [whyLoading, setWhyLoading] = useState(false);
  const [whyError, setWhyError] = useState<string | null>(null);

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
    if (!session?.user || !isPremium) {
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
  }, [session, status, isPremium]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Sign in to access your revenue dashboard.</p>
          <Link href="/api/auth/signin" className="text-blue-600 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-gray-900 font-semibold text-lg mb-2">Premium Required</p>
          <p className="text-gray-500 mb-6">
            Revenue Health Dashboard is available to Premium subscribers.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            View Pricing
            <ArrowRight className="w-4 h-4" />
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
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FixWorkFlow</span>
          </Link>
          <span className="text-xs text-gray-400">Revenue Dashboard</span>
        </div>
      </nav>

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

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Revenue Health Score Section — always shown for premium */}
        <RevenueHealthSection isPremium={isPremium} onScoreChange={setHasScore} onOpenWhy={openWhy} />

        {/* Sprint B: Action Plan & Recommended Tools */}
        <ActionPlanToolsSection isPremium={isPremium} hasScore={hasScore} onOpenWhy={openWhy} />

        {/* Existing Revenue Intelligence Dashboard */}
        {dashData && (
          <div className="space-y-6">
            {/* Top Row: Score + Revenue Opportunity */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Score Card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center">
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                  Revenue Intelligence Score
                </h2>
                <ScoreGauge score={dashData.score.total} band={dashData.score.band} />
                <p className={`text-sm font-semibold mt-3 ${BAND_COLORS[dashData.score.band] || "text-gray-600"}`}>
                  {dashData.score.band}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(dashData.score.calculatedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Revenue Opportunity */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                  Revenue Opportunity
                </h2>
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
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                  Primary Bottleneck
                </h2>
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

            {/* Component Breakdown */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-5">
                Score Breakdown
              </h2>
              <div className="space-y-3">
                {Object.entries(dashData.score.components).map(([key, val]) => (
                  <ComponentBar key={key} label={key} value={val as number} />
                ))}
              </div>
            </div>

            {/* Insight Section */}
            {dashData.insight && (
              <>
                {/* Summary */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                    Revenue Analysis
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {dashData.insight.summary}
                  </p>
                </div>

                {/* Weekly Directive + Risks/Opportunities */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Weekly Execution Plan */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      This Week&apos;s Directive
                    </h2>
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
                  </div>

                  {/* Risks & Opportunities */}
                  <div className="space-y-6">
                    {dashData.insight.riskWarnings.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Risk Warnings
                        </h2>
                        <ul className="space-y-2">
                          {dashData.insight.riskWarnings.map((w, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {dashData.insight.opportunitySignals.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xs font-medium text-emerald-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Opportunity Signals
                        </h2>
                        <ul className="space-y-2">
                          {dashData.insight.opportunitySignals.map((s, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommended Stack */}
                {dashData.insight.recommendedTools.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                      Recommended Stack
                    </h2>
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
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
