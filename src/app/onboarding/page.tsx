"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Code,
  Briefcase,
  Palette,
  MapPin,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Shield,
  BarChart3,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

// ── Constants ──

const BUSINESS_TYPES = [
  { value: "ecommerce", label: "E-commerce", description: "Online store, marketplace, or physical products sold online", icon: ShoppingBag },
  { value: "saas", label: "SaaS", description: "Software as a service or subscription-based digital product", icon: Code },
  { value: "service_agency", label: "Service / Agency", description: "Consulting, freelance, or agency services", icon: Briefcase },
  { value: "creator", label: "Creator", description: "Content, courses, community, or digital products", icon: Palette },
  { value: "local_business", label: "Local Business", description: "Physical location, local services, or regional business", icon: MapPin },
];

const REVENUE_RANGES = [
  { value: "pre_revenue", label: "Pre-revenue", description: "Not generating revenue yet" },
  { value: "0_1k", label: "$0 - $1K/mo", description: "Early stage" },
  { value: "1k_5k", label: "$1K - $5K/mo", description: "Getting traction" },
  { value: "5k_15k", label: "$5K - $15K/mo", description: "Growing steadily" },
  { value: "15k_50k", label: "$15K - $50K/mo", description: "Scaling up" },
  { value: "50k_plus", label: "$50K+/mo", description: "Established revenue" },
];

const ACCURACY_LEVELS = [
  { filled: 0, label: "Good", description: "add metrics for better precision", color: "bg-blue-400", width: "25%" },
  { filled: 1, label: "Better", description: "one more field helps a lot", color: "bg-blue-500", width: "50%" },
  { filled: 2, label: "Strong", description: "well-calibrated", color: "bg-violet-500", width: "75%" },
  { filled: 3, label: "Excellent", description: "maximum confidence", color: "bg-emerald-500", width: "100%" },
];

const LOADING_STEPS = [
  "Calculating pillar scores",
  "Identifying primary risk",
  "Finding fastest growth lever",
  "Matching playbooks to your profile",
];

// ── Component ──

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [revenueRange, setRevenueRange] = useState("");
  const [grossMargin, setGrossMargin] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [traffic, setTraffic] = useState("");
  const [usesPersonalCredit, setUsesPersonalCredit] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Auth + redirect guard
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/signup");
      return;
    }
    const user = session.user as Record<string, unknown>;
    if (user.isAdmin) {
      router.push("/admin");
      return;
    }
    if (!user.diagnosisCompleted) {
      router.push("/diagnosis");
      return;
    }
    if (user.onboardingCompleted) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Animate loading steps
  useEffect(() => {
    if (!submitting) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [submitting]);

  const handleBusinessTypeSelect = useCallback((value: string) => {
    setBusinessType(value);
    setTimeout(() => setStep(2), 350);
  }, []);

  const handleRevenueSelect = useCallback((value: string) => {
    setRevenueRange(value);
    setTimeout(() => setStep(3), 350);
  }, []);

  const handleCreditSelect = useCallback((value: string) => {
    setUsesPersonalCredit(value);
  }, []);

  const handleSubmit = useCallback(async (includeOptional: boolean) => {
    setSubmitting(true);
    setLoadingStep(0);

    const payload: Record<string, unknown> = {
      businessType,
      revenueRange,
    };

    if (includeOptional) {
      if (grossMargin) payload.grossMarginPct = Number(grossMargin);
      if (conversionRate) payload.conversionRatePct = Number(conversionRate);
      if (traffic) payload.trafficMonthly = Number(traffic);
    }

    if (usesPersonalCredit) {
      payload.usesPersonalCredit = usesPersonalCredit;
    }

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json: Record<string, unknown> | null = null;
      try { json = text ? JSON.parse(text) : null; } catch {}

      if (!res.ok) {
        throw new Error((json?.error as string) || `Request failed (${res.status})`);
      }

      // Small delay so user sees all loading steps
      await new Promise((r) => setTimeout(r, 1200));
      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      setSubmitting(false);
    }
  }, [businessType, revenueRange, grossMargin, conversionRate, traffic, usesPersonalCredit, router]);

  // ── Loading states ──

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  // ── Submission loading screen ──

  if (submitting) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="w-9 h-9 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Building your Revenue Health Score</h2>
          <div className="space-y-3 text-left">
            {LOADING_STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                {i <= loadingStep ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                )}
                <span className={`text-sm ${i <= loadingStep ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Accuracy indicator for step 3 ──

  const filledCount = [grossMargin, conversionRate, traffic].filter((v) => v !== "").length;
  const accuracy = ACCURACY_LEVELS[filledCount];

  const [integrationConnecting, setIntegrationConnecting] = useState(false);

  const progress = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Business Profile Setup</span>
            <span>Step {step} of 5</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Step 1: Business Type ── */}
        {step === 1 && (
          <div className="bg-white border border-gray-100 rounded-[14px] p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              What type of business do you run?
            </h2>
            <p className="text-gray-400 mb-6">
              This determines how we weight your score — a SaaS company and a local shop have very different priorities.
            </p>
            <div className="space-y-3">
              {BUSINESS_TYPES.map((bt) => {
                const Icon = bt.icon;
                const selected = businessType === bt.value;
                return (
                  <button
                    key={bt.value}
                    onClick={() => handleBusinessTypeSelect(bt.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-gray-900"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        selected ? "bg-blue-100" : "bg-gray-100"
                      }`}>
                        <Icon className={`w-5 h-5 ${selected ? "text-blue-600" : "text-gray-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{bt.label}</div>
                        <div className="text-sm text-gray-400 mt-0.5">{bt.description}</div>
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Revenue Range ── */}
        {step === 2 && (
          <div className="bg-white border border-gray-100 rounded-[14px] p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Where is your revenue at?
            </h2>
            <p className="text-gray-400 mb-6">
              This is the foundation of your Revenue Health Score. Pick the range that is closest.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REVENUE_RANGES.map((rr) => {
                const selected = revenueRange === rr.value;
                return (
                  <button
                    key={rr.value}
                    onClick={() => handleRevenueSelect(rr.value)}
                    className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-gray-900"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{rr.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{rr.description}</div>
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Back button */}
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* ── Step 3: Optional Metrics ── */}
        {step === 3 && (
          <div className="bg-white border border-gray-100 rounded-[14px] p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              A few more numbers for a sharper score
            </h2>
            <p className="text-gray-400 mb-6">
              These are optional but they make your score significantly more accurate. You can always add them later.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Gross Margin</label>
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-400 uppercase">Optional</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={grossMargin}
                    onChange={(e) => setGrossMargin(e.target.value)}
                    placeholder="e.g. 55"
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Conversion Rate</label>
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-400 uppercase">Optional</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(e.target.value)}
                    placeholder="e.g. 3.2"
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Monthly Traffic</label>
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-400 uppercase">Optional</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={traffic}
                  onChange={(e) => setTraffic(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Accuracy indicator */}
            <div className="mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">Score accuracy</span>
                <span className="text-xs font-bold text-gray-700">{accuracy.label}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full ${accuracy.color} transition-all duration-500`}
                  style={{ width: accuracy.width }}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                {accuracy.label} — {accuracy.description}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(4)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-150"
              >
                Skip for now
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 hover:-translate-y-px hover:shadow-md transition-all duration-150"
              >
                Continue
              </button>
            </div>

            {/* Back button */}
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* ── Step 4: Personal Credit ── */}
        {step === 4 && (
          <div className="bg-white border border-gray-100 rounded-[14px] p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              One last question
            </h2>
            <p className="text-gray-400 mb-6">
              This helps us identify potential savings and recommend the right financial tools.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { value: "yes", label: "Yes, regularly", description: "I use personal credit cards or loans for business expenses" },
                { value: "sometimes", label: "Sometimes", description: "Occasionally, when business credit isn't enough" },
                { value: "no", label: "No", description: "I keep personal and business finances separate" },
              ].map((opt) => {
                const selected = usesPersonalCredit === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleCreditSelect(opt.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-gray-900"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-sm text-gray-400 mt-0.5">{opt.description}</div>
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(5)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-150"
              >
                Skip
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={!usesPersonalCredit}
                className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all duration-150 ${
                  usesPersonalCredit
                    ? "bg-gray-900 text-white hover:bg-gray-800 hover:-translate-y-px hover:shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continue
              </button>
            </div>

            {/* Back button */}
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* ── Step 5: Optional Integration Connect ── */}
        {step === 5 && (
          <div className="bg-white border border-gray-100 rounded-[14px] p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Want more accurate results?
              </h2>
              <p className="text-gray-400">
                Connect a service to auto-sync your real metrics instead of estimates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { id: "shopify", name: "Shopify", icon: "cdn.shopify.com", desc: "Sync orders, revenue, and customers", endpoint: "/api/integrations/shopify/connect", needsStore: true },
                { id: "stripe-data", name: "Stripe", icon: "stripe.com", desc: "Sync payments, MRR, and fees", endpoint: "/api/integrations/stripe-data/connect", needsStore: false },
              ].map((svc) => (
                <button
                  key={svc.id}
                  onClick={async () => {
                    if (svc.needsStore) {
                      // For Shopify, they'll connect from settings after onboarding
                      handleSubmit(!!grossMargin || !!conversionRate || !!traffic);
                      return;
                    }
                    setIntegrationConnecting(true);
                    try {
                      const res = await fetch(svc.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                      const data = await res.json();
                      if (data.authUrl) window.location.href = data.authUrl;
                      else setIntegrationConnecting(false);
                    } catch {
                      setIntegrationConnecting(false);
                    }
                  }}
                  disabled={integrationConnecting}
                  className="text-left p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${svc.icon}&sz=64`}
                      alt=""
                      className="w-8 h-8 rounded-lg bg-white"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{svc.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{svc.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center mb-6">
              Read-only access only. You can always connect later from Settings.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit(!!grossMargin || !!conversionRate || !!traffic)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-150"
              >
                Skip for now
              </button>
              <button
                onClick={() => handleSubmit(!!grossMargin || !!conversionRate || !!traffic)}
                className="flex-1 px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 hover:-translate-y-px hover:shadow-md transition-all duration-150"
              >
                Build My Score
              </button>
            </div>

            {/* Back button */}
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-1.5 mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
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
