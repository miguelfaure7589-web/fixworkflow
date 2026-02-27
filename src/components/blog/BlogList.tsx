"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { BlogPost } from "@/data/blog";

const categories = ["Revenue", "Profitability", "Retention", "Acquisition", "Operations", "Tools"];

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? posts : posts.filter((p) => p.category === active);
  const [featured, ...rest] = filtered;

  return (
    <>
      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-2 flex-wrap">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                active === cat
                  ? "bg-[var(--text-primary)] text-white"
                  : "bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {featured ? (
        <>
          {/* Featured Post */}
          <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
            <Link
              href={`/blog/${featured.slug}`}
              className="block bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] overflow-hidden hover:shadow-md hover:border-[var(--border-default)] transition-all duration-300"
            >
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full">
                    {featured.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Clock className="w-3 h-3" />
                    {featured.readTime}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{featured.date}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3">
                  {featured.title}
                </h2>
                <p className="text-[var(--text-muted)] leading-relaxed mb-4 max-w-3xl">
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
                  className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] p-6 hover:shadow-md hover:border-[var(--border-default)] transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">{post.date}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                      Read <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 text-center">
          <p className="text-[var(--text-muted)]">No posts in this category yet.</p>
        </div>
      )}
    </>
  );
}
