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
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
    </div>
  );
}
