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
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
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
        </>
      ) : (
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 text-center">
          <p className="text-gray-400">No posts in this category yet.</p>
        </div>
      )}
    </>
  );
}
