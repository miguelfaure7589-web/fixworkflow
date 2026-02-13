"use client";

import {
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  Users,
  Clock,
  Layers,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const problems = [
  {
    icon: Layers,
    title: "Using 8+ tools that don't connect",
    description: "Data silos, context switching, and subscription bloat",
  },
  {
    icon: Clock,
    title: "Spending more time managing work than doing it",
    description: "Admin overhead eating into billable hours",
  },
  {
    icon: Users,
    title: "Clients slipping through the cracks",
    description: "No system for tracking deliverables and follow-ups",
  },
  {
    icon: Zap,
    title: "Automations? What automations?",
    description: "Manual data entry, copy-paste, and repetitive tasks",
  },
];

const steps = [
  {
    number: "01",
    title: "Answer a few questions",
    description: "Tell us about your role, tools, and biggest frustrations. Takes ~3 minutes.",
  },
  {
    number: "02",
    title: "Get your diagnosis",
    description: "Our AI analyzes your workflow and identifies the highest-impact improvements.",
  },
  {
    number: "03",
    title: "Follow the plan",
    description: "Step-by-step recommendations with the exact tools and processes to fix each issue.",
  },
];

const entryPoints = [
  { label: "Fix my project management", href: "/diagnose?focus=task_management", icon: Target },
  { label: "Fix my client workflow", href: "/diagnose?focus=client_work", icon: Users },
  { label: "Fix my team communication", href: "/diagnose?focus=communication", icon: BarChart3 },
  { label: "Fix my automation stack", href: "/diagnose?focus=automation", icon: Zap },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">FixWorkflow</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link
              href="/diagnose"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              Start Free Diagnosis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-8">
          <CheckCircle2 className="w-4 h-4" />
          Free AI-powered workflow diagnosis
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
          Your workflow is broken.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Let&apos;s fix it in 5 minutes.
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Free AI diagnostic for remote workers, freelancers, and small teams. Discover exactly
          what&apos;s slowing you down and get a personalized plan to fix it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/diagnose"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold text-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            Start Free Diagnosis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="text-sm text-slate-500">No account required · Takes 3 minutes</span>
        </div>

        <div className="mt-12 text-sm text-slate-500">
          Trusted by <span className="text-slate-400 font-medium">12,000+</span> remote workers and
          freelancers
        </div>
      </section>

      {/* Problem Agitation */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-3">Sound familiar?</h2>
        <p className="text-slate-400 text-center mb-10">
          These are the problems our users come to us with most often.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors"
            >
              <problem.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-white font-semibold mb-2">{problem.title}</h3>
              <p className="text-sm text-slate-400">{problem.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          How FixWorkflow works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="text-5xl font-bold text-blue-500/20 mb-4">{step.number}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Specific Entry Points */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-3">
          Know what you need to fix?
        </h2>
        <p className="text-slate-400 text-center mb-10">
          Jump straight to a focused diagnosis.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {entryPoints.map((entry) => (
            <Link
              key={entry.label}
              href={entry.href}
              className="flex items-center gap-3 p-5 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:border-blue-500/50 hover:bg-slate-800/60 transition-all group"
            >
              <entry.icon className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium flex-1">{entry.label}</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stop guessing. Start fixing.
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Your personalized workflow diagnosis takes 3 minutes and is completely free. No credit
            card required.
          </p>
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:from-blue-500 hover:to-cyan-400 transition-all"
          >
            Start Free Diagnosis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-400 rounded flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-400">FixWorkflow</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-slate-300 transition-colors">
              Pricing
            </Link>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">
              Affiliate Disclosure
            </span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">
              Privacy Policy
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
