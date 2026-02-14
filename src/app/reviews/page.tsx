"use client";

import { reviews, getAverageRating, getRatingDistribution } from "@/data/reviews";
import Link from "next/link";
import { Zap, ArrowRight, Star, TrendingUp } from "lucide-react";

export default function ReviewsPage() {
  const avg = getAverageRating();
  const dist = getRatingDistribution();
  const total = reviews.length;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FixWorkFlow</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Blog
            </Link>
            <Link href="/reviews" className="text-sm text-gray-900 font-medium transition-colors">
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

      {/* Header with summary */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 rounded-full text-sm text-amber-600 font-medium mb-6">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {avg}/5 average rating
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Real people, real results
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              See how freelancers, consultants, and small teams transformed their
              workflows with FixWorkFlow.
            </p>
          </div>

          {/* Rating summary */}
          <div className="max-w-md mx-auto bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{avg}</div>
                <div className="flex items-center gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(avg)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {total} reviews
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-3">{stars}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width: `${total > 0 ? (dist[stars] / total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">
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
                <div className="text-xs sm:text-sm text-gray-400 mt-1">{stat.label}</div>
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

              {/* Stars + Date */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  {Array.from({ length: 5 - t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gray-200" />
                  ))}
                </div>
                <span className="text-xs text-gray-300">{t.date}</span>
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
          <Link href="/" className="flex items-center gap-2.5 mb-4 md:mb-0">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-gray-600 font-medium">FixWorkFlow</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
            <Link href="/reviews" className="hover:text-gray-700 transition-colors">Reviews</Link>
            <Link href="/pricing" className="hover:text-gray-700 transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
