"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Lock,
  TrendingUp,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import type { RecommendationOutput } from "@/lib/recommendation-engine";
import { accessoryProducts } from "@/data/tools";

interface ResultsDashboardProps {
  healthScore: number;
  summary: string;
  recommendations: RecommendationOutput[];
  userRole: string;
  isPremium?: boolean;
}

function HealthScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-36 h-36">
      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" stroke="#1e293b" strokeWidth="8" fill="none" />
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[priority as keyof typeof styles] || styles.medium}`}
    >
      {priority.toUpperCase()}
    </span>
  );
}

function RecommendationCard({
  rec,
  index,
  isLocked,
}: {
  rec: RecommendationOutput;
  index: number;
  isLocked: boolean;
}) {
  const [expanded, setExpanded] = useState(index < 2);

  if (isLocked) {
    return (
      <div className="relative bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-sm bg-slate-900/60 flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Premium recommendation</p>
          </div>
        </div>
        <div className="opacity-30">
          <div className="flex items-start gap-3">
            <span className="text-slate-500 font-mono text-sm mt-1">{index + 1}.</span>
            <div>
              <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
              <p className="text-slate-400 mt-1 line-clamp-2">{rec.problem}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 text-left flex items-start gap-3"
      >
        <span className="text-blue-400 font-mono text-sm mt-1 flex-shrink-0">{index + 1}.</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={rec.priority} />
            <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
          </div>
          {!expanded && <p className="text-slate-400 mt-1 line-clamp-1">{rec.problem}</p>}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-slate-700/50 pt-4">
          {/* Problem */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-400 mb-1">The Problem</h4>
            <p className="text-slate-300 text-sm leading-relaxed">{rec.problem}</p>
          </div>

          {/* Solution */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-green-400 mb-1">The Fix</h4>
            <p className="text-slate-300 text-sm leading-relaxed">{rec.solution}</p>
          </div>

          {/* Impact */}
          <div className="mb-5 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-medium">Estimated Impact:</span>
            <span className="text-slate-300">{rec.impact}</span>
          </div>

          {/* Tool Recommendations */}
          {rec.tools.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3">Recommended Tools</h4>
              <div className="space-y-2">
                {rec.tools.map((tool) => (
                  <a
                    key={tool.slug}
                    href={`/go/${tool.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-blue-500/50 hover:bg-slate-700 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        {tool.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors">
                          {tool.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {tool.hasFreeTier ? "Free tier available" : tool.pricing} · {tool.rating}/5
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {tool.hasFreeTier ? "Start free" : "Learn more"}
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsDashboard({
  healthScore,
  summary,
  recommendations,
  userRole,
  isPremium = false,
}: ResultsDashboardProps) {
  const freeRecs = recommendations.filter((r) => !r.isPremium);
  const premiumRecs = recommendations.filter((r) => r.isPremium);
  const relevantAccessories = accessoryProducts.filter((p) =>
    p.bestFor.includes(userRole)
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Your Workflow Diagnosis</h1>
          <p className="text-slate-400">by FixWorkflow</p>
        </div>

        {/* Health Score + Summary */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <HealthScoreRing score={healthScore} />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-white mb-1">Workflow Health Score</h2>
              <p className="text-slate-300 leading-relaxed">{summary}</p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Priority Recommendations</h2>
          </div>

          <div className="space-y-4">
            {freeRecs.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} index={i} isLocked={false} />
            ))}
          </div>
        </div>

        {/* Premium Upsell */}
        {premiumRecs.length > 0 && !isPremium && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-8 mb-4">
              <div className="text-center mb-6">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Unlock {premiumRecs.length} more recommendations
                </h3>
                <p className="text-slate-300 max-w-md mx-auto">
                  Get your full workflow analysis with integration mapping, automation blueprints,
                  and advanced improvement reports.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-6 max-w-md mx-auto text-sm">
                {[
                  "Full 12+ recommendations",
                  "Integration mapping",
                  "Automation blueprints",
                  "Monthly re-diagnosis",
                  "Stack cost analysis",
                  "Exclusive tool discounts",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/pricing"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all flex items-center gap-2"
                >
                  Upgrade to Premium — $12/mo
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <span className="text-sm text-slate-400">or $97/year (save 33%)</span>
              </div>
            </div>

            {/* Locked premium recommendations preview */}
            <div className="space-y-4">
              {premiumRecs.slice(0, 3).map((rec, i) => (
                <RecommendationCard
                  key={i}
                  rec={rec}
                  index={freeRecs.length + i}
                  isLocked={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Premium unlocked recommendations */}
        {isPremium && premiumRecs.length > 0 && (
          <div className="mb-8 space-y-4">
            {premiumRecs.map((rec, i) => (
              <RecommendationCard
                key={i}
                rec={rec}
                index={freeRecs.length + i}
                isLocked={false}
              />
            ))}
          </div>
        )}

        {/* Workspace Accessories Section */}
        {relevantAccessories.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-800">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-slate-300">Optimize Your Workspace</h3>
              <p className="text-sm text-slate-500">
                Top-rated gear recommended for your remote setup
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {relevantAccessories.map((product) => (
                <a
                  key={product.slug}
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-all group"
                >
                  <div className="w-full h-32 bg-slate-700/30 rounded-lg mb-3 flex items-center justify-center text-slate-500 text-xs">
                    Product Image
                  </div>
                  <h4 className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold text-blue-400">{product.price}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </div>
                </a>
              ))}
            </div>
            <p className="text-center text-xs text-slate-600 mt-4">
              FixWorkflow may earn a commission from purchases made through these links.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>
            Affiliate Disclosure: FixWorkflow recommends tools based on your diagnostic results. We
            may earn a commission when you sign up through our links, at no extra cost to you.
          </p>
        </div>
      </div>
    </div>
  );
}
