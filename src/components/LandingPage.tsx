"use client";

import { useState } from "react";
import {
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  Users,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Wifi,
  TrendingUp,
  ShieldAlert,
  X,
  AlertTriangle,
  Star,
} from "lucide-react";
import Link from "next/link";
import { reviews as testimonials } from "@/data/reviews";

interface MiniQuizQuestion {
  question: string;
  options: { label: string; value: string }[];
}

interface MiniQuizResult {
  headline: string;
  insight: string;
  stat: string;
}

interface ProblemCard {
  icon: typeof Layers;
  title: string;
  description: string;
  color: string;
  iconColor: string;
  frictionArea: string;
  quiz: MiniQuizQuestion[];
  getResult: (answers: string[]) => MiniQuizResult;
}

const problems: ProblemCard[] = [
  {
    icon: Layers,
    title: "Too many tools, nothing connects",
    description: "You're juggling 8+ apps and wasting time switching between them.",
    color: "bg-violet-50 text-violet-600 border-violet-100",
    iconColor: "text-violet-500",
    frictionArea: "too_many_tools",
    quiz: [
      {
        question: "How many paid tools/apps do you use for work?",
        options: [
          { label: "1-3", value: "few" },
          { label: "4-6", value: "moderate" },
          { label: "7-10", value: "many" },
          { label: "10+", value: "excessive" },
        ],
      },
      {
        question: "How often do you copy-paste data between tools?",
        options: [
          { label: "Rarely", value: "rarely" },
          { label: "A few times a week", value: "weekly" },
          { label: "Daily", value: "daily" },
          { label: "Multiple times a day", value: "constant" },
        ],
      },
    ],
    getResult: (answers) => {
      const severe = answers.includes("excessive") || answers.includes("constant");
      return {
        headline: severe ? "Your tool stack is costing you big" : "There's room to streamline",
        insight: severe
          ? "You're likely losing 5-8 hours per week to context switching and duplicate data entry. Each tool switch costs ~23 minutes of refocus time."
          : "Even a moderate tool stack has hidden overlap. Most users can cut 2-3 tools without losing any functionality.",
        stat: severe ? "~$200-400/mo in wasted subscriptions" : "~2-3 hours/week recoverable",
      };
    },
  },
  {
    icon: Clock,
    title: "More managing than doing",
    description: "Admin work eats into the hours you should spend on what matters.",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    iconColor: "text-blue-500",
    frictionArea: "task_management",
    quiz: [
      {
        question: "What percentage of your day is admin vs. actual work?",
        options: [
          { label: "Mostly real work", value: "low" },
          { label: "About 50/50", value: "half" },
          { label: "Mostly admin", value: "high" },
          { label: "I'm drowning in admin", value: "critical" },
        ],
      },
      {
        question: "Do you have a single system for tracking all your tasks?",
        options: [
          { label: "Yes, everything's in one place", value: "organized" },
          { label: "Sort of — I use a few tools", value: "scattered" },
          { label: "I use my head and sticky notes", value: "none" },
        ],
      },
    ],
    getResult: (answers) => {
      const severe = answers.includes("critical") || answers.includes("none");
      return {
        headline: severe ? "Admin is stealing your best hours" : "You can reclaim more time",
        insight: severe
          ? "Without a system, you're losing entire days to reactive admin work. The fix isn't working harder — it's building a simple task system and batching admin into 1-2 blocks per day."
          : "Consolidating your task tracking into one system and time-blocking admin work can free up 3-4 hours per week immediately.",
        stat: severe ? "~6-10 hours/week lost to admin" : "~3-4 hours/week recoverable",
      };
    },
  },
  {
    icon: Users,
    title: "Clients falling through cracks",
    description: "No system to keep track of deliverables, follow-ups, or feedback.",
    color: "bg-amber-50 text-amber-600 border-amber-100",
    iconColor: "text-amber-500",
    frictionArea: "client_work",
    quiz: [
      {
        question: "How do you track client projects and deliverables?",
        options: [
          { label: "A proper CRM or PM tool", value: "system" },
          { label: "Spreadsheets or docs", value: "manual" },
          { label: "Email and memory", value: "none" },
        ],
      },
      {
        question: "How often do clients have to chase you for updates?",
        options: [
          { label: "Never — I'm proactive", value: "never" },
          { label: "Occasionally", value: "sometimes" },
          { label: "More than I'd like to admit", value: "often" },
        ],
      },
    ],
    getResult: (answers) => {
      const severe = answers.includes("none") || answers.includes("often");
      return {
        headline: severe ? "You're losing clients silently" : "Small gaps, big opportunity",
        insight: severe
          ? "When clients have to chase you, trust erodes fast. A simple pipeline system with automated status updates can transform your client relationships and unlock referrals."
          : "Even occasional follow-up gaps cost you. Automating client updates and building onboarding templates can increase your client capacity by 20-30%.",
        stat: severe ? "~40% of referrals lost to poor follow-up" : "~4-6 hours/week saved with templates",
      };
    },
  },
  {
    icon: Zap,
    title: "Everything is manual",
    description: "Copy-pasting, data entry, and repetitive tasks you know could be automated.",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    iconColor: "text-emerald-500",
    frictionArea: "automation",
    quiz: [
      {
        question: "Do you use any automation tools (Zapier, Make, etc.)?",
        options: [
          { label: "Yes, I automate a lot", value: "advanced" },
          { label: "A little bit", value: "basic" },
          { label: "No, everything is manual", value: "none" },
          { label: "I don't know what those are", value: "unaware" },
        ],
      },
      {
        question: "What's your most repeated manual task?",
        options: [
          { label: "Data entry between apps", value: "data_entry" },
          { label: "Sending follow-up emails", value: "follow_ups" },
          { label: "Creating reports", value: "reporting" },
          { label: "Project/client setup", value: "onboarding" },
        ],
      },
    ],
    getResult: (answers) => {
      const severe = answers.includes("none") || answers.includes("unaware");
      return {
        headline: severe ? "You're doing a robot's job" : "Quick automation wins are waiting",
        insight: severe
          ? "Most freelancers and small teams have 5-10 tasks per week that could run on autopilot. The average automation saves 3-5 hours per week and costs under $20/month."
          : "You've started automating, but there's likely 3-5 more workflows you haven't touched yet. Even one new automation per month compounds into massive time savings.",
        stat: severe ? "~5-8 hours/week doing automatable tasks" : "~2-4 more hours/week to save",
      };
    },
  },
  {
    icon: DollarSign,
    title: "Money leaking everywhere",
    description: "Overpaying for tools, unclear cash flow, mixing personal and business finances, missing deductions.",
    color: "bg-red-50 text-red-600 border-red-100",
    iconColor: "text-red-500",
    frictionArea: "finances",
    quiz: [
      {
        question: "Do you have a separate business bank account?",
        options: [
          { label: "Yes, fully separate", value: "separate" },
          { label: "Sort of — still mixing sometimes", value: "partial" },
          { label: "No, everything's in one account", value: "mixed" },
        ],
      },
      {
        question: "Do you know exactly what you spend on tools/subscriptions monthly?",
        options: [
          { label: "Yes, I track everything", value: "tracked" },
          { label: "I have a rough idea", value: "rough" },
          { label: "Honestly, no clue", value: "unknown" },
        ],
      },
    ],
    getResult: (answers) => {
      const severe = answers.includes("mixed") || answers.includes("unknown");
      return {
        headline: severe ? "Financial blind spots are costing you" : "Small tweaks, real savings",
        insight: severe
          ? "Mixing finances makes tax prep a nightmare and hides your true profitability. Most freelancers who separate accounts discover they've been missing $5K-15K in deductions annually."
          : "You're on the right track, but a subscription audit and automated expense tracking could reveal $50-200/month in savings you're not seeing.",
        stat: severe ? "~$5K-15K/year in missed deductions" : "~$50-200/mo in hidden savings",
      };
    },
  },
  {
    icon: Wifi,
    title: "Unreliable tech infrastructure",
    description: "Dropped calls, slow internet, no business phone line — your setup is costing you clients.",
    color: "bg-cyan-50 text-cyan-600 border-cyan-100",
    iconColor: "text-cyan-500",
    frictionArea: "phone_internet",
    quiz: [
      {
        question: "Do you use your personal phone number for business?",
        options: [
          { label: "No, I have a business line", value: "business" },
          { label: "Yes, my personal number", value: "personal" },
        ],
      },
      {
        question: "How reliable is your internet during calls?",
        options: [
          { label: "Rock solid", value: "solid" },
          { label: "Drops occasionally", value: "occasional" },
          { label: "Unreliable — I've lost calls", value: "unreliable" },
        ],
      },
    ],
    getResult: (answers) => {
      const severe = answers.includes("personal") || answers.includes("unreliable");
      return {
        headline: severe ? "Your setup is silently losing you business" : "Room for a professional upgrade",
        insight: severe
          ? "Using a personal number looks unprofessional and means you can never truly disconnect. Dropped calls cost you deals. A VoIP business number costs $15/month and a backup internet connection can save entire client relationships."
          : "Even solid setups benefit from a professional VoIP number with business hours, call routing, and voicemail transcription. It's a small upgrade with outsized credibility gains.",
        stat: severe ? "~$15/mo for a business phone line" : "40-60% savings vs. traditional carriers",
      };
    },
  },
  {
    icon: TrendingUp,
    title: "Can't scale past yourself",
    description: "You're the bottleneck. Everything runs through you and there's no system to grow beyond your own hours.",
    color: "bg-orange-50 text-orange-600 border-orange-100",
    iconColor: "text-orange-500",
    frictionArea: "scaling",
    quiz: [
      {
        question: "If you took a week off, what would happen?",
        options: [
          { label: "Everything would keep running", value: "autonomous" },
          { label: "Things would slow down", value: "slow" },
          { label: "Everything would stop", value: "stop" },
        ],
      },
      {
        question: "What's your biggest scaling bottleneck?",
        options: [
          { label: "I can't find or afford help", value: "hiring" },
          { label: "I can't let go of tasks", value: "delegation" },
          { label: "My systems break with more clients", value: "systems" },
          { label: "No recurring revenue model", value: "revenue" },
        ],
      },
    ],
    getResult: (answers) => {
      const severe = answers.includes("stop");
      return {
        headline: severe ? "Your business can't exist without you" : "You're close to a breakthrough",
        insight: severe
          ? "If a week off would shut everything down, you don't own a business — you own a job. The fix is documenting your processes, delegating low-value tasks, and building systems that work without your constant input."
          : "You've built something solid, but growth requires removing yourself as the bottleneck. Focus on the 20% of tasks only you can do and systemize the rest.",
        stat: severe ? "80% of your tasks can be delegated" : "~10-15 hours/week freed with systems",
      };
    },
  },
  {
    icon: ShieldAlert,
    title: "Security is an afterthought",
    description: "Reused passwords, no backups, shared logins — one breach could take down your entire business.",
    color: "bg-rose-50 text-rose-600 border-rose-100",
    iconColor: "text-rose-500",
    frictionArea: "security_privacy",
    quiz: [
      {
        question: "Do you use a password manager?",
        options: [
          { label: "Yes", value: "yes" },
          { label: "No — I reuse passwords", value: "no" },
          { label: "I use my browser's saved passwords", value: "browser" },
        ],
      },
      {
        question: "When did you last back up your important files?",
        options: [
          { label: "It's automatic — always backed up", value: "auto" },
          { label: "Within the last month", value: "recent" },
          { label: "I can't remember", value: "never" },
        ],
      },
    ],
    getResult: (answers) => {
      const severe = answers.includes("no") || answers.includes("never");
      return {
        headline: severe ? "You're one breach away from disaster" : "Good start — close the gaps",
        insight: severe
          ? "43% of cyberattacks target small businesses. Reused passwords and no backups mean one incident could cost you everything — client data, reputation, and revenue. A password manager (free) and cloud backup ($9/mo) fix this today."
          : "You've got the basics, but browser-saved passwords aren't secure and manual backups fail when you forget. A dedicated password manager and automated backup close your remaining gaps.",
        stat: severe ? "Avg. breach cost for small biz: $120K" : "Under $10/mo to be fully protected",
      };
    },
  },
];

const steps = [
  {
    number: "1",
    title: "Tell us about your work",
    description: "Answer a few questions about your role, your tools, and where you feel stuck. Takes about 3 minutes.",
    color: "bg-blue-500",
  },
  {
    number: "2",
    title: "Get your personalized diagnosis",
    description: "Our AI analyzes your workflow and pinpoints the changes that will make the biggest difference.",
    color: "bg-violet-500",
  },
  {
    number: "3",
    title: "Follow your improvement plan",
    description: "Clear, actionable steps with the right tools and strategies — no guesswork needed.",
    color: "bg-emerald-500",
  },
];

const entryPoints = [
  { label: "Fix my project management", href: "/diagnose?focus=task_management", icon: Target },
  { label: "Fix my client workflow", href: "/diagnose?focus=client_work", icon: Users },
  { label: "Fix my team communication", href: "/diagnose?focus=communication", icon: BarChart3 },
  { label: "Fix my automation stack", href: "/diagnose?focus=automation", icon: Zap },
];


function MiniQuizModal({
  problem,
  onClose,
}: {
  problem: ProblemCard;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const totalQuestions = problem.quiz.length;
  const isComplete = step >= totalQuestions;
  const result = isComplete ? problem.getResult(answers) : null;

  function handleAnswer(value: string) {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    setStep(step + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-5 flex items-center gap-3 ${problem.color} border-b`}>
          <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center">
            <problem.icon className={`w-5 h-5 ${problem.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">{problem.title}</h3>
            <p className="text-xs text-gray-500">Quick check — {totalQuestions} questions</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
            style={{ width: `${((isComplete ? totalQuestions : step) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Quiz content */}
        {!isComplete ? (
          <div className="p-6">
            <p className="text-gray-900 font-medium mb-5">{problem.quiz[step].question}</p>
            <div className="space-y-2.5">
              {problem.quiz[step].options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="w-full text-left px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-sm text-gray-700 hover:text-blue-700"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Question {step + 1} of {totalQuestions}
            </p>
          </div>
        ) : result ? (
          <div className="p-6">
            {/* Result */}
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h4 className="text-lg font-bold text-gray-900">{result.headline}</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{result.insight}</p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Estimated Impact</p>
              <p className="text-sm font-semibold text-gray-900">{result.stat}</p>
            </div>

            <p className="text-xs text-gray-500 mb-4 text-center">
              This is just a snapshot. Get your full personalized diagnosis with specific tool recommendations, automation blueprints, and a step-by-step action plan.
            </p>

            <Link
              href={`/diagnose?focus=${problem.frictionArea}`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-blue-200"
              onClick={onClose}
            >
              Get Your Full Diagnosis — Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-gray-400 mt-2 text-center">Takes 3 minutes · No account needed</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [activeQuiz, setActiveQuiz] = useState<ProblemCard | null>(null);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FixWorkFlow</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Blog
            </Link>
            <Link href="/reviews" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Reviews
            </Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link
              href="/diagnose"
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Start Free Diagnosis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-sm text-blue-600 font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Free AI-powered workflow diagnosis
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900">
            Work smarter, not harder.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Fix your workflow in 5 minutes.
            </span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Whether you&apos;re a freelancer, consultant, or leading a small team — our AI diagnoses
            what&apos;s slowing you down and gives you a clear plan to fix it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href="/diagnose"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full font-semibold text-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
            >
              Start Your Free Diagnosis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-sm text-gray-400">No account needed · Takes 3 minutes · Completely free</p>

          <div className="mt-14 flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>850+ workflows diagnosed</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Personalized results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Agitation */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Sound familiar?</h2>
          <p className="text-gray-500">
            These are the most common workflow frustrations we hear about.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map((problem) => (
            <button
              key={problem.title}
              onClick={() => setActiveQuiz(problem)}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-300 text-left group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${problem.color}`}>
                <problem.icon className="w-5 h-5" />
              </div>
              <h3 className="text-gray-900 font-semibold mb-2 group-hover:text-blue-600 transition-colors">{problem.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{problem.description}</p>
              <span className="text-xs font-medium text-blue-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Take quick check
                <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>

        {/* Mini Quiz Modal */}
        {activeQuiz && (
          <MiniQuizModal problem={activeQuiz} onClose={() => setActiveQuiz(null)} />
        )}
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500">Three simple steps to a better workflow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className={`w-10 h-10 ${step.color} rounded-full flex items-center justify-center text-white font-bold mx-auto mb-5`}>
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 rounded-full text-sm text-amber-600 font-medium mb-6">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            4.9/5 average rating
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Real people, real results</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            See how freelancers, consultants, and small teams transformed their workflows.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-8 sm:gap-14 py-8 mb-8">
          {[
            { value: "850+", label: "Diagnoses run" },
            { value: "5.2 hrs", label: "Avg. time saved/week" },
            { value: "93%", label: "Would recommend" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonial cards — masonry-style 2 col */}
        <div className="columns-1 md:columns-2 gap-5 space-y-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 break-inside-avoid"
            >
              {/* Top row: Avatar + Name + Tag */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 bg-gradient-to-br ${t.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0">
                  {t.tag}
                </span>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                {Array.from({ length: 5 - t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gray-200" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 leading-relaxed mb-5 text-sm">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Metric highlight */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.metric}</p>
                    <p className="text-xs text-gray-400">{t.metricLabel}</p>
                  </div>
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom social proof */}
        <div className="mt-10 text-center">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
          >
            Read all reviews
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Specific Entry Points */}
      <section className="bg-white border-y border-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Know what you need to fix?
            </h2>
            <p className="text-gray-500">
              Jump straight to a focused diagnosis.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {entryPoints.map((entry) => (
              <Link
                key={entry.label}
                href={entry.href}
                className="flex items-center gap-3 p-5 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
              >
                <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center group-hover:border-blue-200 transition-colors">
                  <entry.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <span className="text-gray-700 font-medium flex-1">{entry.label}</span>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl p-14">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to work smarter?
          </h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">
            Your personalized workflow diagnosis takes 3 minutes and is completely free.
            No credit card, no commitment.
          </p>
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all shadow-lg"
          >
            Start Free Diagnosis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2.5 mb-4 md:mb-0">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-gray-600 font-medium">FixWorkFlow</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="hover:text-gray-700 transition-colors">
              Blog
            </Link>
            <Link href="/reviews" className="hover:text-gray-700 transition-colors">
              Reviews
            </Link>
            <Link href="/pricing" className="hover:text-gray-700 transition-colors">
              Pricing
            </Link>
            <span className="hover:text-gray-700 transition-colors cursor-pointer">
              Affiliate Disclosure
            </span>
            <span className="hover:text-gray-700 transition-colors cursor-pointer">
              Privacy Policy
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
