"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OnboardingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/diagnosis");
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-[var(--text-muted)] animate-spin" />
    </div>
  );
}
