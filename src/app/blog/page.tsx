import { blogPosts } from "@/data/blog";
import Link from "next/link";
import { Zap, ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | FixWorkFlow",
  description:
    "Practical tips on workflow automation, productivity systems, and tool stack optimization for freelancers and small teams.",
};

const categories = Array.from(new Set(blogPosts.map((p) => p.category)));

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;

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
            <Link href="/blog" className="text-sm text-gray-900 font-medium transition-colors">
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

      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The FixWorkFlow Blog
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Practical advice on workflow optimization, automation, and
            productivity for freelancers and small teams.
          </p>
        </div>
      </section>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-full">
            All
          </span>
          {categories.map((cat) => (
            <span
              key={cat}
              className="px-4 py-1.5 bg-white border border-gray-200 text-sm text-gray-600 rounded-full hover:border-gray-300 cursor-pointer transition-colors"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Featured Post */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <Link
          href={`/blog/${featured.slug}`}
          className="block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-300"
        >
          <div className="p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                {featured.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {featured.readTime}
              </span>
              <span className="text-xs text-gray-400">{featured.date}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              {featured.title}
            </h2>
            <p className="text-gray-500 leading-relaxed mb-4 max-w-3xl">
              {featured.excerpt}
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
              Read article <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>

      {/* Post Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{post.date}</span>
                <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                  Read <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

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
