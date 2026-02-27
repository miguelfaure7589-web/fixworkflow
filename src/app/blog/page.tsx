import { blogPosts } from "@/data/blog";
import Link from "next/link";
import { Zap } from "lucide-react";
import type { Metadata } from "next";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical advice on revenue health, business metrics, and growth strategies for small business owners.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
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
            <Link href="/blog" className="text-sm text-[var(--text-primary)] font-medium transition-colors">
              Blog
            </Link>
            <Link href="/reviews" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:inline">
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

      {/* Header */}
      <section className="bg-[var(--bg-card)] border-b border-[var(--border-default)]">
        <div className="max-w-6xl mx-auto px-4 pt-10 sm:pt-16 pb-8 sm:pb-12 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">
            The FixWorkFlow Blog
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Practical advice on revenue health, business metrics, and
            growth strategies for small business owners.
          </p>
        </div>
      </section>

      <BlogList posts={blogPosts} />

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
