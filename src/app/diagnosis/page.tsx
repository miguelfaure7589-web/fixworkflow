"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Outfit } from "next/font/google";
import { Loader2, Shield, CheckCircle2, ChevronLeft } from "lucide-react";

const outfit = Outfit({ subsets: ["latin"] });

// ── Constants ──

const DRAFT_KEY = "fixworkflow_diagnosis_draft";

const FRICTION_OPTIONS = [
  { value: "revenue", label: "Revenue & Sales", description: "Getting leads, closing deals, or growing income" },
  { value: "operations", label: "Operations & Systems", description: "Processes, workflows, or repetitive tasks" },
  { value: "client_work", label: "Client / Project Delivery", description: "Managing scope, deadlines, or communication" },
  { value: "marketing", label: "Marketing & Visibility", description: "Content, social media, or getting seen" },
  { value: "finances", label: "Finances & Profitability", description: "Cash flow, margins, or tracking money" },
  { value: "hiring", label: "Hiring & Delegation", description: "Finding help, outsourcing, or managing people" },
];

const TOOL_PAIN_OPTIONS = [
  { value: "dont_connect", label: "My tools don\u2019t connect", description: "I waste time switching between apps" },
  { value: "too_expensive", label: "Too many subscriptions", description: "I\u2019m paying for tools I barely use" },
  { value: "too_complicated", label: "Too complicated to use", description: "My tools have a steep learning curve" },
  { value: "no_tools", label: "I don\u2019t have the right tools", description: "I\u2019m missing key software for my workflow" },
];

const GOAL_OPTIONS = [
  { value: "grow_revenue", label: "Grow revenue", description: "Bring in more income consistently" },
  { value: "save_time", label: "Save time", description: "Automate or simplify daily tasks" },
  { value: "reduce_costs", label: "Reduce costs", description: "Cut unnecessary spending" },
  { value: "scale_up", label: "Scale the business", description: "Hire, systematize, and grow" },
];

// ── Helpers ──

interface DiagnosisDraft {
  step: number;
  frictionAreas: string[];
  toolPain: string;
  primaryGoal: string;
  freeText: string;
}

function saveDraft(draft: DiagnosisDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

function loadDraft(): DiagnosisDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.step !== "number") return null;
    return parsed as DiagnosisDraft;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

// ── Component ──

function DiagnosisForm() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";

  const [step, setStep] = useState(1);
  const [frictionAreas, setFrictionAreas] = useState<string[]>([]);
  const [toolPain, setToolPain] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Track whether we've loaded saved data to avoid overwriting with defaults
  const restoredRef = useRef(false);

  // Route guard — skip redirects in edit mode
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/signup");
      return;
    }
    const user = session.user as Record<string, unknown>;
    if (user.isAdmin) {
      router.push("/dashboard");
      return;
    }
    if (!isEditMode) {
      if (user.diagnosisCompleted && user.onboardingCompleted) {
        router.push("/dashboard");
      } else if (user.diagnosisCompleted) {
        router.push("/onboarding");
      }
    }
  }, [session, status, router, isEditMode]);

  // Load saved draft (localStorage) or existing answers (edit mode)
  useEffect(() => {
    if (restoredRef.current) return;
    if (status === "loading") return;
    if (!session?.user) return;

    restoredRef.current = true;

    if (isEditMode) {
      // In edit mode, load existing answers from server
      fetch("/api/diagnosis")
        .then((r) => r.json())
        .then((json) => {
          if (json.ok && json.data) {
            const d = json.data;
            if (Array.isArray(d.frictionAreas) && d.frictionAreas.length > 0) {
              setFrictionAreas(d.frictionAreas);
            }
            if (d.toolPain) setToolPain(d.toolPain);
            if (d.primaryGoal) setPrimaryGoal(d.primaryGoal);
            if (d.freeTextChallenge) setFreeText(d.freeTextChallenge);
          }
          setDraftLoaded(true);
        })
        .catch(() => setDraftLoaded(true));
    } else {
      // Check localStorage for abandoned draft
      const draft = loadDraft();
      if (draft) {
        setStep(draft.step);
        setFrictionAreas(draft.frictionAreas || []);
        setToolPain(draft.toolPain || "");
        setPrimaryGoal(draft.primaryGoal || "");
        setFreeText(draft.freeText || "");
      }
      setDraftLoaded(true);
    }
  }, [status, session, isEditMode]);

  // Save draft to localStorage on every change
  useEffect(() => {
    if (!draftLoaded) return;
    if (isEditMode) return; // Don't save drafts in edit mode
    saveDraft({ step, frictionAreas, toolPain, primaryGoal, freeText });
  }, [step, frictionAreas, toolPain, primaryGoal, freeText, draftLoaded, isEditMode]);

  const goToStep = useCallback((newStep: number) => {
    setValidationError("");
    setStep(newStep);
  }, []);

  const toggleFriction = useCallback((value: string) => {
    setValidationError("");
    setFrictionAreas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const handleToolPainSelect = useCallback((value: string) => {
    setValidationError("");
    setToolPain(value);
    setTimeout(() => goToStep(3), 350);
  }, [goToStep]);

  const handleGoalSelect = useCallback((value: string) => {
    setValidationError("");
    setPrimaryGoal(value);
    setTimeout(() => goToStep(4), 350);
  }, [goToStep]);

  const handleContinueStep1 = useCallback(() => {
    if (frictionAreas.length === 0) {
      setValidationError("Please select at least one friction area.");
      return;
    }
    goToStep(2);
  }, [frictionAreas, goToStep]);

  const handleSubmit = useCallback(async (skip: boolean) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frictionAreas,
          toolPain,
          primaryGoal,
          freeTextChallenge: skip ? null : freeText || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error || `Request failed (${res.status})`);
      }

      clearDraft();

      // Force session refresh so the JWT reflects diagnosisCompleted = true
      await update();

      if (isEditMode) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err) {
      console.error("Diagnosis error:", err);
      setSubmitting(false);
    }
  }, [frictionAreas, toolPain, primaryGoal, freeText, router, isEditMode, update]);

  // ── Loading ──

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const progress = (step / 4) * 100;

  return (
    <div className={`${outfit.className} min-h-screen bg-[#f4f5f8] flex items-center justify-center p-4`}>
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{isEditMode ? "Edit Diagnosis" : "Quick Diagnosis"}</span>
            <span>Step {step} of 4</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #6366f1, #4361ee)",
              }}
            />
          </div>
        </div>

        {/* ── Step 1: Friction Areas (multi-select) ── */}
        {step === 1 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Where do you feel the most friction?
            </h2>
            <p className="text-gray-400 mb-6">
              Select all that apply — this helps us prioritize your playbooks.
            </p>
            <div className="space-y-3">
              {FRICTION_OPTIONS.map((opt) => {
                const selected = frictionAreas.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleFriction(opt.value)}
                    className={`w-full text-left p-4 rounded-[11px] border transition-all duration-200 ${
                      selected
                        ? "border-[#4361ee] bg-[rgba(67,97,238,0.07)] text-gray-900"
                        : "border-[#e6e9ef] bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected
                            ? "border-[#4361ee] bg-[#4361ee]"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-sm text-gray-400 mt-0.5">{opt.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {validationError && (
              <p className="mt-3 text-sm text-red-500">{validationError}</p>
            )}

            <button
              onClick={handleContinueStep1}
              className={`w-full mt-6 px-6 py-3 rounded-[10px] font-semibold text-white transition-all duration-150 ${
                frictionAreas.length > 0
                  ? "bg-[#4361ee] hover:bg-[#3a56d4] hover:-translate-y-px hover:shadow-md"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 2: Tool Frustration (single-select, auto-advance) ── */}
        {step === 2 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              What is your #1 frustration with your current setup?
            </h2>
            <p className="text-gray-400 mb-6">
              Pick the one that resonates most.
            </p>
            <div className="space-y-3">
              {TOOL_PAIN_OPTIONS.map((opt) => {
                const selected = toolPain === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleToolPainSelect(opt.value)}
                    className={`w-full text-left p-4 rounded-[11px] border transition-all duration-200 ${
                      selected
                        ? "border-[#4361ee] bg-[rgba(67,97,238,0.07)] text-gray-900"
                        : "border-[#e6e9ef] bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-sm text-gray-400 mt-0.5">{opt.description}</div>
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-5 h-5 text-[#4361ee] flex-shrink-0 ml-3" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToStep(1)}
              className="flex items-center gap-1.5 mt-6 text-[13px] text-[#5a6578] hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* ── Step 3: Primary Goal (single-select, auto-advance) ── */}
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
                  <button
                    key={opt.value}
                    onClick={() => handleGoalSelect(opt.value)}
                    className={`w-full text-left p-4 rounded-[11px] border transition-all duration-200 ${
                      selected
                        ? "border-[#4361ee] bg-[rgba(67,97,238,0.07)] text-gray-900"
                        : "border-[#e6e9ef] bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-sm text-gray-400 mt-0.5">{opt.description}</div>
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-5 h-5 text-[#4361ee] flex-shrink-0 ml-3" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToStep(2)}
              className="flex items-center gap-1.5 mt-6 text-[13px] text-[#5a6578] hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* ── Step 4: Free Text (optional) ── */}
        {step === 4 && (
          <div className="bg-white border border-[#e6e9ef] rounded-[14px] p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Anything else we should know?
            </h2>
            <p className="text-gray-400 mb-6">
              Optional — share a specific challenge or context that would help us tailor your results.
            </p>

            <div className="relative">
              <textarea
                value={freeText}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setFreeText(e.target.value);
                }}
                placeholder="e.g. I spend 3 hours a day on manual invoicing..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4361ee] focus:bg-white focus:ring-1 focus:ring-[#4361ee] transition-all resize-none"
              />
              <span className="absolute bottom-3 right-4 text-xs text-gray-400">
                {freeText.length}/500
              </span>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="flex-1 px-6 py-3 rounded-[10px] border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
              >
                Skip for now
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 px-6 py-3 rounded-[10px] bg-[#4361ee] text-white font-semibold hover:bg-[#3a56d4] hover:-translate-y-px hover:shadow-md transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditMode ? "Save Changes" : "Continue \u2192"}
              </button>
            </div>

            <button
              onClick={() => goToStep(3)}
              className="flex items-center gap-1.5 mt-6 text-[13px] text-[#5a6578] hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* Bottom note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5" />
          <span>This helps us personalize your dashboard — it does not affect your score.</span>
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
