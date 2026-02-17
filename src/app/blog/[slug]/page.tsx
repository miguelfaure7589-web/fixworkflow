import { blogPosts, getBlogPost, getRelatedPosts } from "@/data/blog";
import Link from "next/link";
import { Zap, ArrowRight, ArrowLeft, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post Not Found | FixWorkFlow" };
  return {
    title: `${post.title} | FixWorkFlow Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug, 3);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FixWorkFlow</span>
          </Link>
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
              href="/signup"
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Start Free Diagnosis
            </Link>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 pt-12 pb-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to blog
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
            {post.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {post.readTime}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-10 pb-8 border-b border-gray-100">
          <span>By {post.author}</span>
          <span>{post.date}</span>
        </div>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:text-gray-600 prose-p:leading-relaxed prose-strong:text-gray-900 prose-li:text-gray-600 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
          {post.content.split("\n\n").map((block, i) => {
            if (block.startsWith("## ")) {
              return (
                <h2 key={i}>{block.replace("## ", "")}</h2>
              );
            }
            if (block.startsWith("### ")) {
              return (
                <h3 key={i}>{block.replace("### ", "")}</h3>
              );
            }
            if (block.startsWith("- ") || block.startsWith("1. ")) {
              const items = block.split("\n").filter(Boolean);
              const isOrdered = block.startsWith("1. ");
              const ListTag = isOrdered ? "ol" : "ul";
              return (
                <ListTag key={i} className={isOrdered ? "list-decimal pl-6" : "list-disc pl-6"}>
                  {items.map((item, j) => (
                    <li key={j}>
                      {item.replace(/^[-\d]+[.)]\s*/, "").split("**").map((part, k) =>
                        k % 2 === 1 ? <strong key={k}>{part}</strong> : part
                      )}
                    </li>
                  ))}
                </ListTag>
              );
            }
            if (block.startsWith("| ")) {
              const rows = block.split("\n").filter((r) => !r.startsWith("|--") && !r.startsWith("| --"));
              return (
                <div key={i} className="overflow-x-auto my-6">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        {rows[0]?.split("|").filter(Boolean).map((cell, j) => (
                          <th key={j} className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-200">
                            {cell.trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(1).map((row, j) => (
                        <tr key={j} className="border-b border-gray-100">
                          {row.split("|").filter(Boolean).map((cell, k) => (
                            <td key={k} className="px-4 py-2 text-gray-600">
                              {cell.trim()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            return (
              <p key={i}>
                {block.split("**").map((part, k) =>
                  k % 2 === 1 ? <strong key={k}>{part}</strong> : part
                )}
              </p>
            );
          })}
        </div>
      </article>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to fix your workflow?
          </h2>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            Take our free 3-minute diagnosis and get a personalized plan to work
            smarter.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-50 transition-all"
          >
            Start Free Diagnosis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Related Posts */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Related articles
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {related.map((rp) => (
            <Link
              key={rp.slug}
              href={`/blog/${rp.slug}`}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-300"
            >
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                {rp.category}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mt-3 mb-2">
                {rp.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">{rp.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>

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
