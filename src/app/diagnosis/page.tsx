"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Outfit } from "next/font/google";
import {
  Loader2,
  Shield,
  CheckCircle2,
  ChevronLeft,
  ShoppingBag,
  Code,
  Briefcase,
  Palette,
  MapPin,
  Activity,
} from "lucide-react";

const outfit = Outfit({ subsets: ["latin"] });

// ── Constants ──

const TOTAL_STEPS = 8;
const DRAFT_KEY = "fixworkflow_diagnosis_draft_v2";

const BUSINESS_TYPES = [
  { value: "service_agency", label: "Service / Agency", description: "Consulting, freelancing, or agency services", icon: Briefcase },
  { value: "ecommerce", label: "E-commerce", description: "Online store, marketplace, or physical products", icon: ShoppingBag },
  { value: "saas", label: "SaaS", description: "Software or subscription-based product", icon: Code },
  { value: "creator", label: "Creator / Freelancer", description: "Content, courses, community, or digital products", icon: Palette },
  { value: "local_business", label: "Local Business", description: "Physical location or local services", icon: MapPin },
];

const FRICTION_OPTIONS = [
  { value: "getting_customers", label: "Getting new customers" },
  { value: "keeping_customers", label: "Keeping existing customers" },
  { value: "pricing_margins", label: "Pricing and margins" },
  { value: "managing_operations", label: "Managing operations" },
  { value: "cash_flow", label: "Cash flow" },
  { value: "marketing_visibility", label: "Marketing and visibility" },
  { value: "time_management", label: "Time management" },
  { value: "scaling", label: "Scaling" },
];

const GOAL_OPTIONS = [
  { value: "grow_revenue", label: "Grow revenue" },
  { value: "improve_profitability", label: "Improve profitability" },
  { value: "reduce_churn", label: "Reduce customer churn" },
  { value: "get_customers", label: "Get more customers" },
  { value: "streamline_ops", label: "Streamline operations" },
];

const REVENUE_OPTIONS = [
  { value: "0_1k", label: "$0 \u2013 $1k/mo" },
  { value: "1k_5k", label: "$1k \u2013 $5k/mo" },
  { value: "5k_15k", label: "$5k \u2013 $15k/mo" },
  { value: "15k_50k", label: "$15k \u2013 $50k/mo" },
  { value: "50k_plus", label: "$50k+/mo" },
];

const MARGIN_OPTIONS = [
  { value: "under_20", label: "Under 20%" },
  { value: "20_40", label: "20\u201340%" },
  { value: "40_60", label: "40\u201360%" },
  { value: "60_80", label: "60\u201380%" },
  { value: "over_80", label: "Over 80%" },
  { value: "not_sure", label: "Not sure" },
];

const CONVERSION_OPTIONS = [
  { value: "under_1", label: "Under 1%" },
  { value: "1_3", label: "1\u20133%" },
  { value: "3_5", label: "3\u20135%" },
  { value: "5_10", label: "5\u201310%" },
  { value: "over_10", label: "Over 10%" },
  { value: "not_sure", label: "Not sure" },
];

const CREDIT_OPTIONS = [
  { value: "yes", label: "Yes, regularly", description: "I use personal credit cards or loans for business expenses" },
  { value: "sometimes", label: "Sometimes", description: "Occasionally, when business credit isn\u2019t enough" },
  { value: "no", label: "No, I keep them separate", description: "Personal and business finances are separated" },
];

// ── Draft helpers ──

interface DiagnosisDraft {
  step: number;
  businessType: string;
  frictionAreas: string[];
  primaryGoal: string;
  revenueRange: string;
  grossMargin: string;
  conversionRate: string;
  usesPersonalCredit: string;
  freeText: string;
}

function saveDraft(draft: DiagnosisDraft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
}

function loadDraft(): DiagnosisDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.step !== "number") return null;
    return parsed as DiagnosisDraft;
  } catch { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

// ── Shared UI ──

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-[11px] border transition-all duration-200 ${
        selected
          ? "border-[#4361ee] bg-[rgba(67,97,238,0.07)] text-gray-900"
          : "border-[#e6e9ef] bg-white text-gray-600 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

// ── Main Form ──

function DiagnosisForm() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";

  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [frictionAreas, setFrictionAreas] = useState<string[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [revenueRange, setRevenueRange] = useState("");
  const [grossMargin, setGrossMargin] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [usesPersonalCredit, setUsesPersonalCredit] = useState("");
  const [freeText, setFreeText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [validationError, setValidationError] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const restoredRef = useRef(false);

  // Route guard
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { router.push("/signup"); return; }
    const user = session.user as Record<string, unknown>;
    if (user.isAdmin) { router.push("/dashboard"); return; }
    if (!isEditMode && user.diagnosisCompleted) {
      router.push("/dashboard");
    }
  }, [session, status, router, isEditMode]);

  // Load existing data (edit mode) or draft (fresh)
  useEffect(() => {
    if (restoredRef.current) return;
    if (status === "loading" || !session?.user) return;
    restoredRef.current = true;

    if (isEditMode) {
      Promise.all([
        fetch("/api/diagnosis").then((r) => r.ok ? r.json() : null),
        fetch("/api/onboarding").then((r) => r.ok ? r.json() : null),
      ]).then(([diagJson, onbJson]) => {
        if (diagJson?.ok && diagJson.data) {
          const d = diagJson.data;
          if (Array.isArray(d.frictionAreas) && d.frictionAreas.length > 0) setFrictionAreas(d.frictionAreas);
          if (d.primaryGoal) setPrimaryGoal(d.primaryGoal);
          if (d.freeTextChallenge) setFreeText(d.freeTextChallenge);
        }
        if (onbJson?.ok && onbJson.data) {
          const d = onbJson.data;
          if (d.businessType) setBusinessType(d.businessType);
          if (d.revenueRange) setRevenueRange(d.revenueRange);
          if (d.usesPersonalCredit) setUsesPersonalCredit(d.usesPersonalCredit);
        }
        setDraftLoaded(true);
      }).catch(() => setDraftLoaded(true));
    } else {
      const draft = loadDraft();
      if (draft) {
        setStep(draft.step);
        setBusinessType(draft.businessType || "");
        setFrictionAreas(draft.frictionAreas || []);
        setPrimaryGoal(draft.primaryGoal || "");
        setRevenueRange(draft.revenueRange || "");
        setGrossMargin(draft.grossMargin || "");
        setConversionRate(draft.conversionRate || "");
        setUsesPersonalCredit(draft.usesPersonalCredit || "");
        setFreeText(draft.freeText || "");
      }
      setDraftLoaded(true);
    }
  }, [status, session, isEditMode]);

  // Save draft on changes
  useEffect(() => {
    if (!draftLoaded || isEditMode) return;
    saveDraft({ step, businessType, frictionAreas, primaryGoal, revenueRange, grossMargin, conversionRate, usesPersonalCredit, freeText });
  }, [step, businessType, frictionAreas, primaryGoal, revenueRange, grossMargin, conversionRate, usesPersonalCredit, freeText, draftLoaded, isEditMode]);

  // Score animation
  useEffect(() => {
    if (calculatedScore === null) return;
    let current = 0;
    const target = calculatedScore;
    const duration = 1500;
    const frameRate = 16;
    const totalFrames = duration / frameRate;
    const increment = target / totalFrames;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, frameRate);
    return () => clearInterval(timer);
  }, [calculatedScore]);

  // Redirect after score animation
  useEffect(() => {
    if (calculatedScore === null || animatedScore < calculatedScore) return;
    const timeout = setTimeout(() => router.push("/dashboard"), 1500);
    return () => clearTimeout(timeout);
  }, [animatedScore, calculatedScore, router]);

  const goToStep = useCallback((s: number) => { setValidationError(""); setStep(s); }, []);

  const toggleFriction = useCallback((value: string) => {
    setValidationError("");
    setFrictionAreas((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= 3) return prev;
      return [...prev, value];
    });
  }, []);

  const handleSubmit = useCallback(async (skip: boolean) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/diagnosis/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType,
          frictionAreas,
          primaryGoal,
          revenueRange,
          grossMargin,
          conversionRate,
          usesPersonalCredit,
          freeTextChallenge: skip ? null : freeText || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error || `Request failed (${res.status})`);
      }

      const json = await res.json();
      clearDraft();
      await update();

      if (isEditMode) {
        router.push("/dashboard");
      } else {
        setCalculatedScore(json.score ?? 50);
      }
    } catch (err) {
      console.error("Diagnosis error:", err);
      setSubmitting(false);
    }
  }, [businessType, frictionAreas, primaryGoal, revenueRange, grossMargin, conversionRate, usesPersonalCredit, freeText, router, isEditMode, update]);

  // ── Loading ──

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  // ── Score Animation Screen ──

  if (submitting && calculatedScore !== null) {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (animatedScore / 100) * circumference;
    const gaugeColor = calculatedScore >= 70 ? "#10b981" : calculatedScore >= 50 ? "#4361ee" : calculatedScore >= 35 ? "#f59e0b" : "#ef4444";

    return (
      <div className={`${outfit.className} min-h-screen bg-[#f4f5f8] flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={gaugeColor}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.3s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-gray-900 tabular-nums">{animatedScore}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your Revenue Health Score</h2>
          <p className="text-sm text-gray-400 mt-2">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Calculating Screen ──

  if (submitting) {
    return (
      <div className={`${outfit.className} min-h-screen bg-[#f4f5f8] flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-9 h-9 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Calculating your score...</h2>
          <p className="text-sm text-gray-400">Analyzing your business profile across 5 pillars</p>
        </div>
      </div>
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className={`${outfit.className} min-h-screen bg-[#f4f5f8] flex items-center justify-center p-4`}>
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{isEditMode ? "Edit Business Profile" : "Business Diagnosis"}</span>
            <span>Step {step} of {TOTAL_STEPS}</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #6366f1, #4361ee)" }}
            />
          </div>
        </div>

        {/* ── Step 1: Business Type ── */}
        {step === 1 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              What type of business do you run?
            </h2>
            <p className="text-gray-400 mb-6">
              This determines how we weight your score.
            </p>
            <div className="space-y-3">
              {BUSINESS_TYPES.map((bt) => {
                const Icon = bt.icon;
                const selected = businessType === bt.value;
                return (
                  <OptionCard
                    key={bt.value}
                    selected={selected}
                    onClick={() => { setBusinessType(bt.value); setTimeout(() => goToStep(2), 350); }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? "bg-blue-100" : "bg-gray-100"}`}>
                        <Icon className={`w-5 h-5 ${selected ? "text-blue-600" : "text-gray-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{bt.label}</div>
                        <div className="text-sm text-gray-400 mt-0.5">{bt.description}</div>
                      </div>
                      {selected && <CheckCircle2 className="w-5 h-5 text-[#4361ee] flex-shrink-0" />}
                    </div>
                  </OptionCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Friction Areas (multi-select, max 3) ── */}
        {step === 2 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Where does your business feel stuck?
            </h2>
            <p className="text-gray-400 mb-6">
              Pick up to 3 areas where you feel the most friction.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FRICTION_OPTIONS.map((opt) => {
                const selected = frictionAreas.includes(opt.value);
                const disabled = !selected && frictionAreas.length >= 3;
                return (
                  <button
                    key={opt.value}
                    onClick={() => !disabled && toggleFriction(opt.value)}
                    className={`text-left p-3.5 rounded-[11px] border transition-all duration-200 ${
                      selected
                        ? "border-[#4361ee] bg-[rgba(67,97,238,0.07)] text-gray-900"
                        : disabled
                          ? "border-[#e6e9ef] bg-gray-50 text-gray-300 cursor-not-allowed"
                          : "border-[#e6e9ef] bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected ? "border-[#4361ee] bg-[#4361ee]" : "border-gray-300 bg-white"
                      }`}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {validationError && <p className="mt-3 text-sm text-red-500">{validationError}</p>}

            <div className="flex items-center justify-between mt-6">
              <button onClick={() => goToStep(1)} className="flex items-center gap-1.5 text-[13px] text-[#5a6578] hover:text-gray-900 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => {
                  if (frictionAreas.length === 0) { setValidationError("Please select at least one area."); return; }
                  goToStep(3);
                }}
                className={`px-6 py-3 rounded-[10px] font-semibold text-white transition-all duration-150 ${
                  frictionAreas.length > 0
                    ? "bg-[#4361ee] hover:bg-[#3a56d4] hover:-translate-y-px hover:shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Primary Goal ── */}
        {step === 3 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              What is your #1 goal right now?
            </h2>
            <p className="text-gray-400 mb-6">
              This shapes the playbooks we recommend.
            </p>
            <div className="space-y-3">
              {GOAL_OPTIONS.map((opt) => {
                const selected = primaryGoal === opt.value;
                return (
                  <OptionCard
                    key={opt.value}
                    selected={selected}
                    onClick={() => { setPrimaryGoal(opt.value); setTimeout(() => goToStep(4), 350); }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{opt.label}</span>
                      {selected && <CheckCircle2 className="w-5 h-5 text-[#4361ee] flex-shrink-0" />}
                    </div>
                  </OptionCard>
                );
              })}
            </div>
            <button onClick={() => goToStep(2)} className="flex items-center gap-1.5 mt-6 text-[13px] text-[#5a6578] hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        {/* ── Step 4: Monthly Revenue ── */}
        {step === 4 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              What is your approximate monthly revenue?
            </h2>
            <p className="text-gray-400 mb-6">
              Pick the range that is closest.
            </p>
            <div className="space-y-3">
              {REVENUE_OPTIONS.map((opt) => {
                const selected = revenueRange === opt.value;
                return (
                  <OptionCard
                    key={opt.value}
                    selected={selected}
                    onClick={() => { setRevenueRange(opt.value); setTimeout(() => goToStep(5), 350); }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{opt.label}</span>
                      {selected && <CheckCircle2 className="w-5 h-5 text-[#4361ee] flex-shrink-0" />}
                    </div>
                  </OptionCard>
                );
              })}
            </div>
            <button onClick={() => goToStep(3)} className="flex items-center gap-1.5 mt-6 text-[13px] text-[#5a6578] hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        {/* ── Step 5: Gross Margin ── */}
        {step === 5 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              What is your estimated gross margin?
            </h2>
            <p className="text-gray-400 mb-6">
              Revenue minus direct costs (materials, COGS, direct labor). If unsure, take your best guess.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MARGIN_OPTIONS.map((opt) => {
                const selected = grossMargin === opt.value;
                return (
                  <OptionCard
                    key={opt.value}
                    selected={selected}
                    onClick={() => { setGrossMargin(opt.value); setTimeout(() => goToStep(6), 350); }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{opt.label}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-[#4361ee] flex-shrink-0" />}
                    </div>
                  </OptionCard>
                );
              })}
            </div>
            <button onClick={() => goToStep(4)} className="flex items-center gap-1.5 mt-6 text-[13px] text-[#5a6578] hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        {/* ── Step 6: Conversion Rate ── */}
        {step === 6 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              What percentage of leads or visitors become paying customers?
            </h2>
            <p className="text-gray-400 mb-6">
              Your conversion rate from inquiry/visit to sale.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CONVERSION_OPTIONS.map((opt) => {
                const selected = conversionRate === opt.value;
                return (
                  <OptionCard
                    key={opt.value}
                    selected={selected}
                    onClick={() => { setConversionRate(opt.value); setTimeout(() => goToStep(7), 350); }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{opt.label}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-[#4361ee] flex-shrink-0" />}
                    </div>
                  </OptionCard>
                );
              })}
            </div>
            <button onClick={() => goToStep(5)} className="flex items-center gap-1.5 mt-6 text-[13px] text-[#5a6578] hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        {/* ── Step 7: Personal Credit ── */}
        {step === 7 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Do you use personal credit for business expenses?
            </h2>
            <p className="text-gray-400 mb-6">
              This helps us identify hidden costs affecting your profitability.
            </p>
            <div className="space-y-3">
              {CREDIT_OPTIONS.map((opt) => {
                const selected = usesPersonalCredit === opt.value;
                return (
                  <OptionCard
                    key={opt.value}
                    selected={selected}
                    onClick={() => { setUsesPersonalCredit(opt.value); setTimeout(() => goToStep(8), 350); }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-sm text-gray-400 mt-0.5">{opt.description}</div>
                      </div>
                      {selected && <CheckCircle2 className="w-5 h-5 text-[#4361ee] flex-shrink-0 ml-3" />}
                    </div>
                  </OptionCard>
                );
              })}
            </div>
            <button onClick={() => goToStep(6)} className="flex items-center gap-1.5 mt-6 text-[13px] text-[#5a6578] hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        {/* ── Step 8: Free Text (optional) ── */}
        {step === 8 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Anything else we should know about your business?
            </h2>
            <p className="text-gray-400 mb-6">
              Optional \u2014 helps us personalize your recommendations.
            </p>
            <div className="relative">
              <textarea
                value={freeText}
                onChange={(e) => { if (e.target.value.length <= 500) setFreeText(e.target.value); }}
                placeholder="e.g. I spend 3 hours a day on manual invoicing..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4361ee] focus:bg-white focus:ring-1 focus:ring-[#4361ee] transition-all resize-none"
              />
              <span className="absolute bottom-3 right-4 text-xs text-gray-400">{freeText.length}/500</span>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="flex-1 px-6 py-3 rounded-[10px] border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 px-6 py-3 rounded-[10px] bg-[#4361ee] text-white font-semibold hover:bg-[#3a56d4] hover:-translate-y-px hover:shadow-md transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditMode ? "Save Changes" : "Finish"}
              </button>
            </div>
            <button onClick={() => goToStep(7)} className="flex items-center gap-1.5 mt-6 text-[13px] text-[#5a6578] hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        {/* Privacy note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Your data stays private. We never share your business metrics.</span>
        </div>
      </div>
    </div>
  );
}

export default function DiagnosisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      }
    >
      <DiagnosisForm />
    </Suspense>
  );
}
