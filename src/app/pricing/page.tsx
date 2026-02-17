"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

const freeFeatures = [
  "Workflow diagnostic questionnaire",
  "Workflow health score",
  "Top 3 recommendations with guidance",
  "Quick-win action checklist",
  "Score breakdown by category",
  "1 top tool suggestion per issue",
  "Basic tool optimization tips",
  "3 diagnoses per month",
];

const premiumFeatures = [
  "Full 12+ recommendations",
  "Integration mapping (visual diagram)",
  "Automation blueprints (step-by-step)",
  "Stack cost analysis",
  "Unlimited saved reports",
  "Monthly re-diagnosis with change tracking",
  "Priority AI responses",
  "Exclusive partner discounts",
  "Workspace optimization tips",
  "Email support",
];

export default function PricingPage() {
  const { data: session } = useSession();
  // @ts-ignore
  const isPremium = session?.user?.isPremium;
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FixWorkFlow</span>
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Start Free Diagnosis
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-gray-500 text-lg">
            Start free. Upgrade when you need the full picture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Free</h2>
            <p className="text-gray-400 text-sm mb-6">Get started with a basic diagnosis</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-400">/forever</span>
            </div>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition-colors mb-8"
            >
              Start Free Diagnosis
            </Link>
            <ul className="space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-8 relative shadow-sm">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold rounded-full">
              MOST POPULAR
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Premium</h2>
            <p className="text-gray-400 text-sm mb-6">Full workflow transformation</p>
            <div className="mb-2">
              <span className="text-4xl font-bold text-gray-900">$9.99</span>
              <span className="text-gray-400">/month</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">or $79/year (save 34%)</p>
            {isPremium ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-medium text-emerald-600 mb-6">
                  <Check className="w-3 h-3" />
                  You&apos;re Premium
                </div>
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="w-full text-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-colors mb-8 disabled:opacity-50"
                >
                  {portalLoading ? "Loading..." : "Manage Billing"}
                </button>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-medium text-emerald-600 mb-6">
                  <Zap className="w-3 h-3" />
                  7-day free trial — no credit card required
                </div>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full font-medium transition-all mb-8 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {loading ? "Redirecting..." : "Start Free Trial"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </>
            )}
            <ul className="space-y-3">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Is the free diagnosis really free?",
                a: "Yes, completely. You get a real workflow diagnosis with your top 3 personalized recommendations. No credit card required.",
              },
              {
                q: "What do I get with Premium?",
                a: "Your full 12+ recommendation report, visual integration maps, step-by-step automation blueprints, monthly re-diagnosis to track progress, and exclusive discounts on recommended tools.",
              },
              {
                q: "How does the 7-day free trial work?",
                a: "Start your Premium trial instantly — no credit card needed. You get full access to all Premium features for 7 days. If you love it, choose a monthly or yearly plan to continue. If not, you simply go back to the free tier.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel anytime from your dashboard. You keep access until the end of your billing period.",
              },
              {
                q: "Do you earn commissions on tool recommendations?",
                a: "Yes, we may earn affiliate commissions when you sign up for recommended tools through our links. This doesn't cost you anything extra, and our recommendations are based on your diagnostic results, not commission rates.",
              },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-gray-100 pb-6">
                <h3 className="text-gray-900 font-medium mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
