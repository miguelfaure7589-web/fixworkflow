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
    <div className="min-h-screen bg-[#fafafa]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">FixWorkFlow</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/blog" className="text-sm text-gray-900 font-medium transition-colors">
              Blog
            </Link>
            <Link href="/reviews" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:inline">
              Reviews
            </Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:inline">
              Pricing
            </Link>
            <Link
              href="/signup"
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-900 text-white text-xs sm:text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 pt-10 sm:pt-16 pb-8 sm:pb-12 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            The FixWorkFlow Blog
          </h1>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Practical advice on revenue health, business metrics, and
            growth strategies for small business owners.
          </p>
        </div>
      </section>

      <BlogList posts={blogPosts} />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
          <Link href="/" className="flex items-center gap-2.5 mb-4 md:mb-0">
            <div className="w-7 h-7 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-lg flex items-center justify-center">
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
