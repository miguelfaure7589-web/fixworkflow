"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import DiagnosticForm from "@/components/DiagnosticForm";
import EmailGate from "@/components/EmailGate";

function DiagnoseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const focus = searchParams.get("focus") || undefined;
  const [stage, setStage] = useState<"form" | "email" | "loading">("form");
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});

  const handleFormComplete = (formAnswers: Record<string, string | string[] | number>) => {
    setAnswers(formAnswers);
    setStage("email");
  };

  const handleEmailSubmit = async (email: string) => {
    setStage("loading");

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, email }),
      });

      const data = await response.json();

      if (data.id) {
        router.push(`/results/${data.id}`);
      }
    } catch (error) {
      console.error("Diagnosis failed:", error);
      setStage("email");
    }
  };

  if (stage === "email" || stage === "loading") {
    return <EmailGate onSubmit={handleEmailSubmit} isLoading={stage === "loading"} />;
  }

  return <DiagnosticForm onComplete={handleFormComplete} prefilledCategory={focus} />;
}

export default function DiagnosePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      }
    >
      <DiagnoseContent />
    </Suspense>
  );
}
