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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Animated processing indicator */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Your report is ready!</h2>
          <p className="text-slate-400">
            We&apos;ve analyzed your workflow and found personalized recommendations. Enter your email to
            view your results.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-5 py-4 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-lg"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.includes("@")}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Shield className="w-4 h-4" />
          <span>No spam. Unsubscribe anytime. We respect your inbox.</span>
        </div>
      </div>
    </div>
  );
}
