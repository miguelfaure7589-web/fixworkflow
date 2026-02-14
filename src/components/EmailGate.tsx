"use client";

import { useState } from "react";
import { Mail, ArrowRight, Shield } from "lucide-react";

interface EmailGateProps {
  onSubmit: (email: string) => void;
  isLoading?: boolean;
}

export default function EmailGate({ onSubmit, isLoading }: EmailGateProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes("@")) {
      onSubmit(email.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Your report is ready!</h2>
          <p className="text-gray-500">
            We&apos;ve analyzed your workflow and found personalized recommendations. Enter your email to
            view your results.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-lg"
          />

          <button
            type="submit"
            disabled={isLoading || !email.includes("@")}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating your report...
              </>
            ) : (
              <>
                View My Workflow Report
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Shield className="w-4 h-4" />
          <span>No spam. Unsubscribe anytime. We respect your inbox.</span>
        </div>
      </div>
    </div>
  );
}
