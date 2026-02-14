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
  Sparkles,
  ArrowRight,
  Eye,
  Lightbulb,
  CheckCircle2,
  Crown,
} from "lucide-react";
import type { RecommendationOutput, ToolOptimization } from "@/lib/recommendation-engine";
import { accessoryProducts, bookRecommendations } from "@/data/tools";
import Link from "next/link";

function ToolOptimizationSection({
  optimizations,
  isPremium,
}: {
  optimizations: ToolOptimization[];
  isPremium: boolean;
}) {
  return (
    <div className="mt-5 pt-5 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h4 className="text-sm font-semibold text-gray-900">
          You already use {optimizations.map((o) => o.toolName).join(" & ")} — here&apos;s how to get more out of {optimizations.length > 1 ? "them" : "it"}
        </h4>
      </div>

      {optimizations.map((opt) => (
        <div key={opt.toolSlug} className="mb-4 last:mb-0">
          {optimizations.length > 1 && (
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">{opt.toolName}</p>
          )}

          {/* General tips - always visible */}
          <div className="space-y-2 mb-3">
            {opt.generalTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>

          {/* Premium tips teaser */}
          {!isPremium && (
            <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 rounded-lg p-3">
              <div className="flex items-start gap-2.5">
                <Crown className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-violet-800">
                    {opt.premiumSummary}
                  </p>
                  <p className="text-xs text-violet-600 mt-1">
                    Unlock {opt.premiumTips.length} advanced workflows with your free trial
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Premium tips - full display */}
          {isPremium && (
            <div className="space-y-2 mt-3 bg-violet-50 border border-violet-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2">Advanced Workflows</p>
              {opt.premiumTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Star className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface ResultsDashboardProps {
  healthScore: number;
  summary: string;
  recommendations: RecommendationOutput[];
  userRole: string;
  userIndustry?: string;
  frictionAreas?: string[];
  isPremium?: boolean;
}

function HealthScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#3b82f6" : "#ef4444";

  return (
    <div className="relative w-36 h-36">
      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" stroke="#f3f4f6" strokeWidth="8" fill="none" />
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
        <span className="text-3xl font-bold text-gray-900">{score}</span>
        <span className="text-xs text-gray-400">/100</span>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    high: "bg-red-50 text-red-600 border-red-100",
    medium: "bg-amber-50 text-amber-600 border-amber-100",
    low: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };
  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${styles[priority as keyof typeof styles] || styles.medium}`}
    >
      {priority.toUpperCase()}
    </span>
  );
}

function FullRecommendationCard({
  rec,
  index,
}: {
  rec: RecommendationOutput;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index < 2);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all hover:shadow-sm hover:border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 text-left flex items-start gap-3"
      >
        <span className="text-blue-500 font-mono text-sm mt-1 flex-shrink-0">{index + 1}.</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={rec.priority} />
            <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
          </div>
          {!expanded && <p className="text-gray-400 mt-1 line-clamp-1">{rec.problem}</p>}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-50 pt-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-500 mb-1">The Problem</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{rec.problem}</p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-emerald-500 mb-1">The Fix</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{rec.solution}</p>
          </div>

          <div className="mb-5 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-blue-600 font-medium">Estimated Impact:</span>
            <span className="text-gray-600">{rec.impact}</span>
          </div>

          {rec.tools.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Recommended Tools</h4>
              <div className="space-y-2">
                {rec.tools.map((tool) => (
                  <a
                    key={tool.slug}
                    href={`/go/${tool.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        {tool.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {tool.hasFreeTier ? "Free tier available" : tool.pricing} · {tool.rating}/5
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {tool.hasFreeTier ? "Start free" : "Learn more"}
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {rec.toolOptimizations && rec.toolOptimizations.length > 0 && (
            <ToolOptimizationSection optimizations={rec.toolOptimizations} isPremium={true} />
          )}
        </div>
      )}
    </div>
  );
}

// Shows full problem + a general directional fix (no specific tools/steps)
function FreeOpenCard({
  rec,
  index,
}: {
  rec: RecommendationOutput;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  // General directional advice - helpful but not the full specific solution
  const generalFixes: Record<string, string> = {
    project_management: "You need a single, reliable system for tracking all your tasks and projects. The key is consolidation — stop splitting work across multiple tools and commit to one source of truth. Pair it with a daily 5-minute review habit to stay on top of priorities.",
    communication: "Reduce your active communication channels and establish clear async-first norms. Set specific response time expectations and batch your message checking to 2-3 times per day instead of constantly monitoring every channel.",
    crm: "Build a repeatable system for managing client relationships. Start with a standard onboarding checklist and a simple pipeline to track where each client stands. Consistency here builds client trust and frees up mental energy.",
    automation: "Identify your 3 most repetitive manual tasks and automate them first. Focus on tasks you do weekly — like data entry, follow-up emails, or project setup. Even simple automations can save 3-5 hours per week.",
    consolidation: "Audit your tools for overlap and commit to cutting at least 2-3 subscriptions. Look for platforms that can handle multiple functions so you reduce context switching and subscription costs simultaneously.",
    time_tracking: "Start tracking your time for at least 2 weeks to get a clear picture of where hours actually go. Most people discover 30-50% more admin time than they estimated. This data is essential for better pricing and project scoping.",
    invoicing: "Move to automated invoicing tied to project milestones or recurring schedules. The faster an invoice goes out, the faster you get paid. Enable online payments to cut collection time from weeks to days.",
    productivity: "Block 2-3 hours daily for uninterrupted deep work. During these blocks, close all communication tools and disable notifications. Protect this time like you would a meeting with your most important client.",
    file_management: "Pick one cloud platform and create a consistent folder structure. Use a naming convention that includes dates and client names. The goal is that anyone (including future you) can find any file in under 30 seconds.",
    remote_setup: "Invest in your physical workspace basics — proper monitor height, good lighting, and reliable audio for calls. Small ergonomic improvements compound into significant productivity and health gains over time.",
    email_marketing: "Start building an email list with a simple lead magnet related to your expertise. Even one valuable email per week creates a compounding asset for client acquisition that you fully own and control.",
    scheduling: "Replace scheduling back-and-forth with a booking link that shows your real-time availability. Set up buffer time between meetings automatically and create different meeting types with appropriate durations.",
    team_morale: "Start by having honest 1-on-1 conversations to understand what's really going on. Low morale is usually a symptom, not the root cause. Common quick wins: implement a weekly 'wins' ritual, protect at least one meeting-free day per week, and make workloads visible so no one is silently drowning.",
    internal_ops: "Document your top 3-5 recurring processes as simple checklists. Set up a short weekly sync with a fixed agenda (wins, blockers, priorities). These lightweight structures create clarity without adding bureaucracy.",
    sustainability: "Set a hard start and stop time for your workday and protect at least one full day off per week. Schedule a quarterly 'CEO Day' to step back from delivery work and review your business health, goals, and personal energy.",
    tool_optimization: "Most people only use 20-30% of their existing tools' capabilities. Before adding new tools, invest time learning the advanced features of what you already have — it's almost always faster and cheaper than switching.",
    business_finances: "Separate your personal and business finances immediately if you haven't already. Set up a dedicated business bank account and automate transfers for taxes (25-30%) and profit (10%) on every payment received. This one habit gives you financial clarity and eliminates tax-season panic.",
    business_banking_tip: "Switch to a modern no-fee business banking platform that integrates with your invoicing and accounting tools. Set up automatic reserves for taxes and profit so you always know your real available cash.",
    phone_internet: "Get a dedicated business phone number — modern VoIP apps run on your existing phone and give you a professional number with business hours, voicemail transcription, and call routing for as little as $15/month. For internet, make sure you have a reliable primary connection and consider a backup for critical client calls.",
    payment_processing: "Compare your current payment processing fees against modern interchange-plus options. If you're on flat-rate pricing and processing over $5K/month, you're likely overpaying. Also set up one-click payment links and recurring billing to get paid faster with less admin work.",
    sales_leads: "Build a simple pipeline to track every lead from first contact to close. Even a basic system — Lead, Contacted, Proposal Sent, Won/Lost — transforms your sales from reactive to systematic. Pair it with automated follow-up reminders so no prospect falls through the cracks.",
    hiring_delegation: "Start by listing every task you do in a week and sorting by value. Anything that doesn't require YOUR specific expertise should be delegated. Document your top 3 repeatable tasks as step-by-step checklists — this makes delegation reliable and repeatable.",
    training_onboarding: "Record short Loom videos of yourself doing your core processes. Convert them into simple checklists and store them in a central wiki. This 'document as you work' approach builds a training library with zero extra effort.",
    security_privacy: "Implement the basics: use a password manager for unique passwords everywhere, enable two-factor authentication on all critical accounts, and set up automated backups. These three steps eliminate 90% of common vulnerabilities in under an hour.",
    scaling: "Identify where you're the bottleneck and build systems to remove yourself. Document processes, automate recurring tasks, and delegate anything that doesn't require your unique expertise. Growth requires letting go of control.",
    marketing_visibility: "Pick one platform where your ideal clients spend time and commit to posting consistently for 90 days. Pair content with an email capture to build an audience you own. Consistency beats perfection — start before you're ready.",
  };

  const generalFix = generalFixes[rec.category] || "Focus on simplifying this part of your workflow. Start by documenting your current process, then identify the biggest time sink and address that first.";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all hover:shadow-sm hover:border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 text-left flex items-start gap-3"
      >
        <span className="text-blue-500 font-mono text-sm mt-1 flex-shrink-0">{index + 1}.</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={rec.priority} />
            <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
          </div>
          {!expanded && <p className="text-gray-400 mt-1 line-clamp-1">{rec.problem}</p>}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-50 pt-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-500 mb-1">The Problem</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{rec.problem}</p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-emerald-500 mb-1">General Guidance</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{generalFix}</p>
          </div>

          <div className="mb-5 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-blue-600 font-medium">Estimated Impact:</span>
            <span className="text-gray-600">{rec.impact}</span>
          </div>

          {/* Show top recommended tool */}
          {rec.tools.length > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Top Recommended Tool</h4>
              <a
                href={`/go/${rec.tools[0].slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    {rec.tools[0].name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                      {rec.tools[0].name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {rec.tools[0].hasFreeTier ? "Free tier available" : rec.tools[0].pricing} · {rec.tools[0].rating}/5
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </a>
              {rec.tools.length > 1 && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {rec.tools.length - 1} more tool {rec.tools.length - 1 === 1 ? "comparison" : "comparisons"} in Premium
                </p>
              )}
            </div>
          )}

          {/* Tool optimization tips if user already uses relevant tools */}
          {rec.toolOptimizations && rec.toolOptimizations.length > 0 && (
            <ToolOptimizationSection optimizations={rec.toolOptimizations} isPremium={false} />
          )}

          {/* Teaser for premium specifics */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-5">
            <div className="flex items-start gap-3">
              <Star className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Want all tool comparisons and the step-by-step plan?</p>
                <p className="text-xs text-blue-600 mt-1">
                  Premium includes full tool comparisons, integration setup guides, and automation blueprints tailored to your stack.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shows the 3rd free rec with a "highest impact" badge and one top tool visible
function PriorityFixCard({
  rec,
  index,
}: {
  rec: RecommendationOutput;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const generalFixes: Record<string, string> = {
    project_management: "You need a single, reliable system for tracking all your tasks and projects. The key is consolidation — stop splitting work across multiple tools and commit to one source of truth.",
    communication: "Reduce your active communication channels and establish clear async-first norms. Batch your message checking to 2-3 times per day instead of constantly monitoring every channel.",
    crm: "Build a repeatable system for managing client relationships. Start with a standard onboarding checklist and a simple pipeline to track where each client stands.",
    automation: "Identify your 3 most repetitive manual tasks and automate them first. Focus on tasks you do weekly — even simple automations can save 3-5 hours per week.",
    consolidation: "Audit your tools for overlap and commit to cutting at least 2-3 subscriptions. Look for platforms that handle multiple functions to reduce context switching.",
    time_tracking: "Start tracking your time for at least 2 weeks. Most people discover 30-50% more admin time than they estimated. This data is essential for better pricing and project scoping.",
    invoicing: "Move to automated invoicing tied to project milestones. The faster an invoice goes out, the faster you get paid. Enable online payments to cut collection time.",
    productivity: "Block 2-3 hours daily for uninterrupted deep work. Close all communication tools and disable notifications during these blocks.",
    file_management: "Pick one cloud platform and create a consistent folder structure with a naming convention that includes dates and client names.",
    remote_setup: "Invest in your physical workspace basics — proper monitor height, good lighting, and reliable audio for calls.",
    team_morale: "Start by having honest 1-on-1 conversations. Low morale is usually a symptom — common quick wins include a weekly 'wins' ritual and protecting meeting-free days.",
    internal_ops: "Document your top 3-5 recurring processes as simple checklists. Set up a short weekly sync with a fixed agenda: wins, blockers, priorities.",
    sustainability: "Set a hard start and stop time for your workday. Schedule a quarterly 'CEO Day' to review business health and personal energy.",
    tool_optimization: "Most people only use 20-30% of their existing tools' capabilities. Invest time learning advanced features before adding new tools.",
    business_finances: "Separate personal and business finances with a dedicated business bank account. Automate tax reserves (25-30%) and profit (10%) on every payment received.",
    business_banking_tip: "Switch to a modern no-fee business banking platform that integrates with your accounting tools. Set up automatic reserves for taxes and profit.",
    phone_internet: "Get a dedicated business phone number on your existing phone. Modern VoIP apps cost as little as $15/month and include professional voicemail, business hours, and call routing.",
    payment_processing: "Compare your processing fees against interchange-plus pricing. Set up payment links and recurring billing to get paid faster.",
    sales_leads: "Set up a simple sales pipeline to track every lead. Automate follow-up reminders so no prospect gets forgotten. Even a basic CRM transforms your conversion rates.",
    hiring_delegation: "List everything you do and sort by value. Delegate your lowest-value recurring tasks first. Document them as checklists so handoff is smooth.",
    training_onboarding: "Record Loom videos of your processes and convert them into checklists. Store in a central wiki so new hires can self-serve.",
    security_privacy: "Use a password manager, enable 2FA on critical accounts, and set up automated backups. These three steps cover 90% of small business security.",
    scaling: "Find where you're the bottleneck, then document and delegate. Build systems that work without you so growth doesn't require more hours.",
    marketing_visibility: "Pick one platform, post consistently for 90 days, and capture emails with a simple lead magnet. Consistency beats perfection.",
  };

  const generalFix = generalFixes[rec.category] || "Focus on simplifying this part of your workflow. Document your current process, then address the biggest time sink first.";

  // Show only the top recommended tool
  const topTool = rec.tools.length > 0 ? rec.tools[0] : null;

  return (
    <div className="mt-4">
      <div className="bg-white border-2 border-blue-200 rounded-2xl overflow-hidden">
        {/* Badge inside the card */}
        <div className="px-6 pt-5 pb-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            HIGHEST IMPACT FIX
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 pb-4 text-left flex items-start gap-3"
        >
          <span className="text-blue-500 font-mono text-sm mt-1 flex-shrink-0">{index + 1}.</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={rec.priority} />
              <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
            </div>
            {!expanded && <p className="text-gray-400 mt-1 line-clamp-1">{rec.problem}</p>}
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
          )}
        </button>

        {expanded && (
          <div className="px-6 pb-6 border-t border-gray-50 pt-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-500 mb-1">The Problem</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{rec.problem}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-emerald-500 mb-1">General Guidance</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{generalFix}</p>
            </div>

            <div className="flex items-center gap-2 text-sm mb-5">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-blue-600 font-medium">Estimated Impact:</span>
              <span className="text-gray-600">{rec.impact}</span>
            </div>

            {/* Show top tool */}
            {topTool && (
              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Top Recommended Tool</h4>
                <a
                  href={`/go/${topTool.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      {topTool.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                        {topTool.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {topTool.hasFreeTier ? "Free tier available" : topTool.pricing} · {topTool.rating}/5
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </a>
                {rec.tools.length > 1 && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {rec.tools.length - 1} more tool {rec.tools.length - 1 === 1 ? "comparison" : "comparisons"} in Premium
                  </p>
                )}
              </div>
            )}

            {/* Tool optimization tips if applicable */}
            {rec.toolOptimizations && rec.toolOptimizations.length > 0 && (
              <ToolOptimizationSection optimizations={rec.toolOptimizations} isPremium={false} />
            )}

            {/* Premium upgrade nudge */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-100 rounded-xl p-4 mt-5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Get the full step-by-step solution</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Unlock detailed automation blueprints, all tool comparisons, and integration guides with your free trial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LockedCard({
  rec,
  index,
}: {
  rec: RecommendationOutput;
  index: number;
}) {
  return (
    <div className="relative bg-white border border-gray-100 rounded-2xl p-6 overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-sm bg-white/80 flex items-center justify-center z-10">
        <div className="text-center">
          <Lock className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Premium recommendation</p>
        </div>
      </div>
      <div className="opacity-30">
        <div className="flex items-start gap-3">
          <span className="text-gray-300 font-mono text-sm mt-1">{index + 1}.</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
            <p className="text-gray-400 mt-1 line-clamp-2">{rec.problem}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsDashboard({
  healthScore,
  summary,
  recommendations,
  userRole,
  userIndustry = "",
  frictionAreas = [],
  isPremium = false,
}: ResultsDashboardProps) {
  const freeRecs = recommendations.filter((r) => !r.isPremium);
  const premiumRecs = recommendations.filter((r) => r.isPremium);
  const totalRecs = recommendations.length;

  const [showAllProducts, setShowAllProducts] = useState(false);

  // Score and rank accessory products based on relevance to this user
  const allScoredAccessories = accessoryProducts.map((p) => {
    let score = 0;
    // Role match (base relevance)
    if (p.bestFor.includes(userRole)) score += 3;
    // Industry match (strong signal)
    if (p.bestForIndustry?.includes(userIndustry)) score += 4;
    // Friction area match (strongest signal - directly addresses their problems)
    const frictionMatches = p.bestForFriction?.filter((f) => frictionAreas.includes(f)).length || 0;
    score += frictionMatches * 5;
    // Small bonus for any role match at all
    if (score === 0 && p.bestFor.length > 3) score += 1;
    return { product: p, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.product);

  const scoredAccessories = showAllProducts ? allScoredAccessories : allScoredAccessories.slice(0, 5);

  // Score and rank books based on relevance
  const scoredBooks = bookRecommendations.map((b) => {
    let score = 0;
    if (b.bestFor.includes(userRole)) score += 3;
    if (b.bestForIndustry?.includes(userIndustry)) score += 4;
    const frictionMatches = b.bestForFriction?.filter((f) => frictionAreas.includes(f)).length || 0;
    score += frictionMatches * 5;
    return { book: b, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.book);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Workflow Diagnosis</h1>
          <p className="text-gray-400">by FixWorkFlow</p>
        </div>

        {/* Health Score */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <HealthScoreRing score={healthScore} />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Workflow Health Score</h2>
              <p className="text-gray-500 leading-relaxed">{summary}</p>
            </div>
          </div>
        </div>

        {/* Score Breakdown - free feature */}
        {!isPremium && (
          <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Score Breakdown</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(() => {
                const categories = [
                  { label: "Productivity", score: Math.min(100, Math.max(0, healthScore + (freeRecs.some(r => r.category === "productivity") ? -15 : 10))), icon: "⚡" },
                  { label: "Tools & Stack", score: Math.min(100, Math.max(0, healthScore + (freeRecs.some(r => r.category === "consolidation" || r.category === "tool_optimization") ? -20 : 5))), icon: "🔧" },
                  { label: "Communication", score: Math.min(100, Math.max(0, healthScore + (freeRecs.some(r => r.category === "communication") ? -18 : 8))), icon: "💬" },
                  { label: "Operations", score: Math.min(100, Math.max(0, healthScore + (freeRecs.some(r => r.category === "automation" || r.category === "internal_ops") ? -12 : 12))), icon: "📋" },
                ];
                return categories.map((cat) => (
                  <div key={cat.label} className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-lg mb-1">{cat.icon}</div>
                    <div className={`text-2xl font-bold ${cat.score >= 70 ? "text-emerald-600" : cat.score >= 40 ? "text-blue-600" : "text-red-500"}`}>
                      {cat.score}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{cat.label}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Quick-Win Checklist - free feature */}
        {!isPremium && (
          <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-900">Quick Wins You Can Do Today</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">Free actions to improve your workflow right now</p>
            <div className="space-y-3">
              {(() => {
                const quickWins: Record<string, { text: string; time: string }[]> = {
                  task_management: [
                    { text: "Do a 10-minute brain dump of every task on your plate", time: "10 min" },
                    { text: "Pick ONE place to capture all new tasks starting today", time: "5 min" },
                  ],
                  communication: [
                    { text: "Turn off non-essential notifications for 2 hours", time: "2 min" },
                    { text: "Set a status message with your response time expectations", time: "3 min" },
                  ],
                  client_work: [
                    { text: "Create a simple onboarding checklist from your last 3 clients", time: "15 min" },
                    { text: "Send a proactive status update to your current clients", time: "10 min" },
                  ],
                  file_management: [
                    { text: "Create 3 main folders: Active, Archive, Templates", time: "5 min" },
                    { text: "Move completed project files to an Archive folder", time: "15 min" },
                  ],
                  automation: [
                    { text: "List your top 5 most repeated manual tasks this week", time: "10 min" },
                    { text: "Set up one email template for your most common response", time: "10 min" },
                  ],
                  too_many_tools: [
                    { text: "List every tool you pay for and when you last used it", time: "10 min" },
                    { text: "Cancel one tool you haven't used in 30+ days", time: "5 min" },
                  ],
                  focus: [
                    { text: "Block 2 hours on your calendar tomorrow for deep work", time: "2 min" },
                    { text: "Close all browser tabs not related to your current task", time: "1 min" },
                  ],
                  morale: [
                    { text: "Send a genuine thank-you message to someone on your team", time: "3 min" },
                    { text: "Write down 3 wins from this past week", time: "5 min" },
                  ],
                  invoicing: [
                    { text: "Send any overdue invoices right now", time: "10 min" },
                    { text: "Set a recurring calendar reminder for billing day", time: "2 min" },
                  ],
                  time_tracking: [
                    { text: "Track your time manually for today — write start/stop for each task", time: "ongoing" },
                    { text: "Review where your time went last week from memory", time: "10 min" },
                  ],
                  finances: [
                    { text: "List every subscription and recurring expense you pay monthly", time: "15 min" },
                    { text: "Open a free business bank account if you're still using personal", time: "20 min" },
                    { text: "Send any outstanding invoices and follow up on late payments", time: "10 min" },
                  ],
                  phone_internet: [
                    { text: "Run a speed test and note your actual download/upload speeds", time: "2 min" },
                    { text: "Set up a professional voicemail greeting on your business line", time: "5 min" },
                    { text: "Research VoIP business phone options — most offer free trials", time: "15 min" },
                  ],
                  payments: [
                    { text: "Calculate what you paid in processing fees last month", time: "10 min" },
                    { text: "Create a payment link you can embed in emails and proposals", time: "10 min" },
                    { text: "Set up autopay or recurring billing for your repeat clients", time: "15 min" },
                  ],
                  sales_leads: [
                    { text: "List every lead or prospect you're currently talking to", time: "10 min" },
                    { text: "Follow up with 3 leads you haven't contacted in 2+ weeks", time: "15 min" },
                    { text: "Create an email template for your most common follow-up", time: "10 min" },
                  ],
                  hiring_delegation: [
                    { text: "List every task you did today and mark which ones only YOU can do", time: "10 min" },
                    { text: "Write a step-by-step checklist for your most repeated task", time: "15 min" },
                    { text: "Record a quick Loom of yourself doing a task you want to hand off", time: "10 min" },
                  ],
                  training_onboarding: [
                    { text: "Document one process you explain to people repeatedly", time: "15 min" },
                    { text: "Create a 'Day 1 Checklist' for your next new hire or contractor", time: "15 min" },
                  ],
                  security_privacy: [
                    { text: "Enable two-factor authentication on your email and bank accounts", time: "10 min" },
                    { text: "Change any passwords you've reused across multiple accounts", time: "15 min" },
                    { text: "Check when you last backed up your important files", time: "5 min" },
                  ],
                  scaling: [
                    { text: "Write down 3 things that only work because YOU do them personally", time: "10 min" },
                    { text: "Identify 1 task you could delegate or automate this week", time: "5 min" },
                    { text: "Calculate how many hours you spend on admin vs. revenue-generating work", time: "10 min" },
                  ],
                  marketing: [
                    { text: "Post one helpful tip on LinkedIn or your main social platform", time: "10 min" },
                    { text: "Send a value-add email to your 5 best past clients", time: "15 min" },
                    { text: "Write down your ideal client profile in 3 sentences", time: "5 min" },
                  ],
                };
                const frictionKeys = freeRecs.map((r) => {
                  // Map recommendation categories back to friction areas
                  const mapping: Record<string, string> = {
                    project_management: "task_management",
                    communication: "communication",
                    crm: "client_work",
                    consolidation: "too_many_tools",
                    automation: "automation",
                    productivity: "focus",
                    file_management: "file_management",
                    team_morale: "morale",
                    invoicing: "invoicing",
                    time_tracking: "time_tracking",
                    business_finances: "finances",
                    business_banking_tip: "finances",
                    phone_internet: "phone_internet",
                    payment_processing: "payments",
                    sales_leads: "sales_leads",
                    hiring_delegation: "hiring_delegation",
                    training_onboarding: "training_onboarding",
                    security_privacy: "security_privacy",
                    scaling: "scaling",
                    marketing_visibility: "marketing",
                  };
                  return mapping[r.category] || r.category;
                });
                const wins: { text: string; time: string }[] = [];
                frictionKeys.forEach((key) => {
                  if (quickWins[key]) {
                    wins.push(...quickWins[key]);
                  }
                });
                // Fallbacks
                if (wins.length === 0) {
                  wins.push(
                    { text: "Spend 10 minutes writing down everything on your plate", time: "10 min" },
                    { text: "Identify one task you do every week that could be templated", time: "5 min" },
                    { text: "Close unnecessary browser tabs and apps to reduce distractions", time: "1 min" },
                  );
                }
                return wins.slice(0, 5).map((win, i) => (
                  <label key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors group">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{win.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{win.time}</p>
                    </div>
                  </label>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Free preview banner */}
        {!isPremium && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-8 flex items-start gap-3">
            <Eye className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">
                You&apos;re viewing 3 of your {totalRecs} recommendations
              </p>
              <p className="text-sm text-amber-600 mt-1">
                We found {totalRecs} areas to improve. Your free report includes guidance, quick wins, and a top tool pick for each issue. Upgrade to unlock all recommendations with full tool comparisons, automation blueprints, and step-by-step solutions.
              </p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isPremium ? "Priority Recommendations" : "Issues We Found"}
            </h2>
          </div>
          <div className="space-y-4">
            {isPremium
              ? freeRecs.map((rec, i) => (
                  <FullRecommendationCard key={i} rec={rec} index={i} />
                ))
              : freeRecs.map((rec, i) => {
                  // First 2 recs: show real problem + general guidance
                  if (i < 2) {
                    return <FreeOpenCard key={i} rec={rec} index={i} />;
                  }
                  // 3rd rec: priority fix card — show the problem + impact but lock the solution
                  return <PriorityFixCard key={i} rec={rec} index={i} />;
                })}
          </div>
        </div>

        {/* Mid-page CTA for free users */}
        {!isPremium && (
          <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-8 mb-8">
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-amber-300 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">
                Your full action plan is ready
              </h3>
              <p className="text-blue-100 max-w-md mx-auto mb-2">
                We&apos;ve built a detailed, step-by-step plan to fix your workflow — including specific tool recommendations, automation blueprints, and impact estimates.
              </p>
              <p className="text-white font-medium mb-6">
                Try it free for 7 days. No credit card needed.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 mb-6 max-w-lg mx-auto text-sm">
                {[
                  "Specific solutions for each issue",
                  "Tool recommendations with comparisons",
                  "Step-by-step automation blueprints",
                  "Integration mapping for your stack",
                  "Monthly re-diagnosis & tracking",
                  "Exclusive partner discounts",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-blue-100 text-left">
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-50 transition-all shadow-lg"
              >
                Start 7-Day Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-blue-200 text-xs mt-3">Then $9.99/mo · Cancel anytime</p>
            </div>
          </div>
        )}

        {/* Premium Locked Recs */}
        {premiumRecs.length > 0 && !isPremium && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-400">
                  {premiumRecs.length} more recommendations found
                </h2>
              </div>
            </div>
            <div className="space-y-4">
              {premiumRecs.slice(0, 3).map((rec, i) => (
                <LockedCard key={i} rec={rec} index={freeRecs.length + i} />
              ))}
            </div>
            {premiumRecs.length > 3 && (
              <p className="text-center text-sm text-gray-400 mt-4">
                + {premiumRecs.length - 3} more locked recommendations
              </p>
            )}
          </div>
        )}

        {isPremium && premiumRecs.length > 0 && (
          <div className="mb-8 space-y-4">
            {premiumRecs.map((rec, i) => (
              <FullRecommendationCard key={i} rec={rec} index={freeRecs.length + i} />
            ))}
          </div>
        )}


        {/* Recommended Reading */}
        {scoredBooks.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-700">Recommended Reading</h3>
              <p className="text-sm text-gray-400">Books picked for your specific challenges</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {scoredBooks.map((book) => (
                <a
                  key={book.slug}
                  href={book.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm hover:border-blue-200 transition-all group flex flex-col"
                >
                  <div className="w-full h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-3 flex items-center justify-center">
                    <span className="text-3xl">📖</span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {book.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 flex-1">{book.description}</p>
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-blue-600 flex items-center gap-1 mb-2">
                      <TrendingUp className="w-3 h-3" />
                      {book.whyRecommended}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">{book.price}</span>
                      <span className="text-xs text-gray-400">{book.format}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tailored Product Recommendations */}
        {scoredAccessories.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-700">Recommended For You</h3>
              <p className="text-sm text-gray-400">Products tailored to your workflow and setup</p>
            </div>
            <div className="space-y-3">
              {scoredAccessories.map((product) => (
                <a
                  key={product.slug}
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm hover:border-blue-200 transition-all group"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 text-lg flex-shrink-0">
                    {product.category === "headphones" || product.category === "earbuds" ? "🎧" :
                     product.category === "desk" ? "🪑" :
                     product.category === "chair" ? "💺" :
                     product.category === "monitor" || product.category === "portable_monitor" ? "🖥️" :
                     product.category === "webcam" ? "📷" :
                     product.category === "microphone" ? "🎙️" :
                     product.category === "keyboard" ? "⌨️" :
                     product.category === "mouse" ? "🖱️" :
                     product.category === "lighting" ? "💡" :
                     product.category === "networking" ? "📶" :
                     product.category === "security" ? "🔒" :
                     product.category === "backup" ? "☁️" :
                     product.category === "learning" ? "📚" :
                     product.category === "bag" ? "🎒" :
                     product.category === "planner" || product.category === "timer" ? "📋" :
                     product.category === "power" ? "🔋" :
                     product.category === "wellness" ? "🌿" :
                     product.category === "dock" ? "🔌" :
                     product.category === "stream_deck" || product.category === "productivity_hardware" ? "🎛️" :
                     "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {product.name}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {product.whyRecommended}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{product.price}</div>
                    <div className="flex items-center gap-1 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      View
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {allScoredAccessories.length > 5 && (
              <div className="text-center mt-5">
                <button
                  onClick={() => setShowAllProducts(!showAllProducts)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all"
                >
                  {showAllProducts ? (
                    <>
                      Show Less
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      View More ({allScoredAccessories.length - 5} more picks)
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
            <p className="text-center text-xs text-gray-300 mt-4">
              FixWorkFlow may earn a commission from purchases made through these links.
            </p>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-300">
          <p>
            Affiliate Disclosure: FixWorkFlow recommends tools based on your diagnostic results. We
            may earn a commission when you sign up through our links, at no extra cost to you.
          </p>
        </div>
      </div>
    </div>
  );
}
