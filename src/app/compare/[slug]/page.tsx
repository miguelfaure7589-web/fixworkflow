import { notFound } from "next/navigation";
import Link from "next/link";
import { toolsDatabase, type ToolData } from "@/data/tools";
import { ArrowRight, Check, X, Zap, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

interface Comparison {
  slug: string;
  tool1: string;
  tool2: string;
  title: string;
  description: string;
  verdict: string;
}

const comparisons: Comparison[] = [
  {
    slug: "clickup-vs-monday",
    tool1: "clickup",
    tool2: "monday",
    title: "ClickUp vs Monday.com: Which Is Better for Your Workflow?",
    description:
      "Compare ClickUp and Monday.com side by side. Features, pricing, and which is better for freelancers, small teams, and remote workers.",
    verdict:
      "ClickUp is better for solo workers and power users who want everything in one place. Monday.com wins for visual thinkers and teams who need a gentler learning curve.",
  },
  {
    slug: "zapier-vs-make",
    tool1: "zapier",
    tool2: "make",
    title: "Zapier vs Make (Integromat): Which Automation Tool Should You Use?",
    description:
      "Compare Zapier and Make for workflow automation. Features, pricing, and which is better for different use cases.",
    verdict:
      "Zapier is easier to set up and has more integrations. Make offers more complex logic at a lower price. Choose Zapier for simplicity, Make for power.",
  },
  {
    slug: "pipedrive-vs-hubspot",
    tool1: "pipedrive",
    tool2: "hubspot",
    title: "Pipedrive vs HubSpot: Which CRM Is Right for Your Business?",
    description:
      "Compare Pipedrive and HubSpot CRM for small businesses, freelancers, and consultants. Features, pricing, and our recommendation.",
    verdict:
      "Pipedrive is better for pure sales pipeline management. HubSpot offers more marketing features and a generous free tier. Choose based on whether you need CRM-only or CRM + marketing.",
  },
  {
    slug: "notion-vs-clickup",
    tool1: "notion",
    tool2: "clickup",
    title: "Notion vs ClickUp: Flexible Workspace or All-in-One PM?",
    description:
      "Compare Notion and ClickUp for project management and productivity. Which is better for your workflow?",
    verdict:
      "Notion excels as a flexible knowledge base and workspace. ClickUp is stronger for structured project management. Many power users combine both.",
  },
  {
    slug: "toggl-vs-harvest",
    tool1: "toggl",
    tool2: "harvest",
    title: "Toggl vs Harvest: Best Time Tracking for Freelancers",
    description:
      "Compare Toggl Track and Harvest for time tracking and invoicing. Which is better for freelancers and small teams?",
    verdict:
      "Toggl is simpler and better for pure time tracking. Harvest wins if you need integrated invoicing. Freelancers billing hourly should try both free tiers.",
  },
  {
    slug: "convertkit-vs-activecampaign",
    tool1: "convertkit",
    tool2: "activecampaign",
    title: "ConvertKit vs ActiveCampaign: Email Marketing Compared",
    description:
      "Compare ConvertKit and ActiveCampaign for email marketing. Which is better for creators, freelancers, and small businesses?",
    verdict:
      "ConvertKit is simpler and creator-focused. ActiveCampaign is more powerful with advanced automation. Start with ConvertKit if you're new to email marketing.",
  },
];

export async function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = comparisons.find((c) => c.slug === slug);
  if (!comparison) return { title: "Comparison — FixWorkFlow" };
  return {
    title: `${comparison.title} — FixWorkFlow`,
    description: comparison.description,
  };
}

function ToolColumn({ tool }: { tool: ToolData }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-lg flex items-center justify-center text-white font-bold">
          {tool.name.charAt(0)}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
          <p className="text-sm text-gray-400">{tool.pricing}</p>
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Key Features:</div>
        <ul className="space-y-1.5">
          {tool.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">Free Tier:</div>
        <div className="flex items-center gap-1.5 text-sm">
          {tool.hasFreeTier ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600">Available</span>
            </>
          ) : (
            <>
              <X className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-500">No free tier</span>
            </>
          )}
        </div>
      </div>
      <div className="text-sm text-gray-400 mb-4">
        Rating: <span className="text-amber-500 font-medium">{tool.rating}/5</span>
      </div>
      <a
        href={`/go/${tool.slug}?source=comparison`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm font-medium transition-colors"
      >
        Try {tool.name}
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comparison = comparisons.find((c) => c.slug === slug);

  if (!comparison) notFound();

  const tool1 = toolsDatabase.find((t) => t.slug === comparison.tool1);
  const tool2 = toolsDatabase.find((t) => t.slug === comparison.tool2);

  if (!tool1 || !tool2) notFound();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FixWorkFlow</span>
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Start Free Diagnosis
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{comparison.title}</h1>
        <p className="text-gray-500 mb-10">{comparison.description}</p>

        {/* Side by side */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <ToolColumn tool={tool1} />
          <ToolColumn tool={tool2} />
        </div>

        {/* Verdict */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Our Verdict</h2>
          <p className="text-gray-600">{comparison.verdict}</p>
        </div>

        {/* CTA */}
        <div className="text-center bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Not sure which is right for you?
          </h3>
          <p className="text-gray-500 mb-6">
            Take our free workflow diagnosis and get a personalized recommendation based on your
            specific situation.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full font-medium transition-all shadow-lg shadow-blue-200"
          >
            Start Free Diagnosis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-xs text-gray-300 text-center mt-8">
          Affiliate Disclosure: FixWorkFlow may earn a commission from purchases made through links
          on this page, at no extra cost to you.
        </p>
      </div>
    </div>
  );
}
