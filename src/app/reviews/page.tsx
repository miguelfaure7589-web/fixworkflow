"use client";

import { reviews, getAverageRating, getRatingDistribution } from "@/data/reviews";
import Link from "next/link";
import { Zap, ArrowRight, Star, TrendingUp } from "lucide-react";

export default function ReviewsPage() {
  const avg = getAverageRating();
  const dist = getRatingDistribution();
  const total = reviews.length;

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Navigation */}
      <nav className="bg-[var(--bg-card)] border-b border-[var(--border-default)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">FixWorkFlow</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/blog" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:inline">
              Blog
            </Link>
            <Link href="/reviews" className="text-sm text-[var(--text-primary)] font-medium transition-colors">
              Reviews
            </Link>
            <Link href="/pricing" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:inline">
              Pricing
            </Link>
            <Link
              href="/signup"
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[var(--text-primary)] text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header with summary */}
      <section className="bg-[var(--bg-card)] border-b border-[var(--border-default)]">
        <div className="max-w-6xl mx-auto px-4 pt-10 sm:pt-16 pb-8 sm:pb-12">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-full text-sm text-amber-600 font-medium mb-6">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {avg}/5 average rating
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">
              Real people, real results
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              See how freelancers, consultants, and small teams transformed their
              workflows with FixWorkFlow.
            </p>
          </div>

          {/* Rating summary */}
          <div className="max-w-md mx-auto bg-[var(--bg-subtle)] rounded-2xl p-6 border border-[var(--border-default)]">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--text-primary)]">{avg}</div>
                <div className="flex items-center gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(avg)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-[var(--border-default)] text-[var(--border-default)]"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-[var(--text-muted)] mt-1">
                  {total} reviews
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)] w-3">{stars}</span>
                    <div className="flex-1 h-2 bg-[var(--border-default)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width: `${total > 0 ? (dist[stars] / total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-[var(--text-muted)] w-6 text-right">
                      {dist[stars]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-14 mt-10">
            {[
              { value: "850+", label: "Diagnoses run" },
              { value: "5.2 hrs", label: "Avg. time saved/week" },
              { value: "93%", label: "Would recommend" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews — masonry 2-col */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="columns-1 md:columns-2 gap-5 space-y-5">
          {reviews.map((t) => (
            <div
              key={t.name}
              className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-default)] hover:shadow-lg hover:border-[var(--border-default)] transition-all duration-300 break-inside-avoid"
            >
              {/* Top row: Avatar + Name + Tag */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 bg-gradient-to-br ${t.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] text-sm">{t.name}</div>
                  <div className="text-[var(--text-muted)] text-xs">{t.role}</div>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full flex-shrink-0">
                  {t.tag}
                </span>
              </div>

              {/* Stars + Date */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  {Array.from({ length: 5 - t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[var(--border-default)]" />
                  ))}
                </div>
                <span className="text-xs text-[var(--text-muted)]">{t.date}</span>
              </div>

              {/* Quote */}
              <p className="text-[var(--text-secondary)] leading-relaxed mb-5 text-sm">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Metric highlight */}
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{t.metric}</p>
                    <p className="text-xs text-[var(--text-muted)]">{t.metricLabel}</p>
                  </div>
                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl p-14 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to fix your workflow?
          </h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">
            Join hundreds of professionals who&apos;ve optimized how they work. It
            takes 3 minutes and it&apos;s completely free.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg"
          >
            Start Free Diagnosis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--bg-card)] border-t border-[var(--border-default)]">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-[var(--text-muted)]">
          <Link href="/" className="flex items-center gap-2.5 mb-4 md:mb-0">
            <div className="w-7 h-7 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[var(--text-secondary)] font-medium">FixWorkFlow</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="hover:text-[var(--text-secondary)] transition-colors">Blog</Link>
            <Link href="/reviews" className="hover:text-[var(--text-secondary)] transition-colors">Reviews</Link>
            <Link href="/pricing" className="hover:text-[var(--text-secondary)] transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
