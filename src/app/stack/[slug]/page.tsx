import { notFound } from "next/navigation";
import Link from "next/link";
import { toolsDatabase } from "@/data/tools";
import { ArrowRight, Zap, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

interface StackConfig {
  slug: string;
  role: string;
  title: string;
  description: string;
  introText: string;
  toolSlugs: string[];
}

const stacks: StackConfig[] = [
  {
    slug: "freelancer",
    role: "freelancer",
    title: "Best Tool Stack for Freelancers (2026)",
    description:
      "The ultimate freelancer tech stack. Project management, time tracking, invoicing, CRM, and automation tools recommended by FixWorkFlow.",
    introText:
      "As a freelancer, you need tools that handle client work, time tracking, invoicing, and communication without overwhelming you. This stack is designed for solo operators who want maximum productivity with minimal tool bloat.",
    toolSlugs: ["clickup", "toggl", "freshbooks", "pipedrive", "zapier", "calendly", "loom", "convertkit"],
  },
  {
    slug: "remote-team",
    role: "team_lead",
    title: "Best Tool Stack for Remote Teams (2026)",
    description:
      "The essential remote team tech stack. Collaboration, project management, communication, and automation tools for distributed teams.",
    introText:
      "Remote teams need clear communication channels, structured project management, and automation to replace the spontaneous coordination that happens in offices. This stack keeps everyone aligned without creating meeting overload.",
    toolSlugs: ["clickup", "slack", "loom", "zapier", "hubspot", "calendly", "notion"],
  },
  {
    slug: "consultant",
    role: "consulting",
    title: "Best Tool Stack for Consultants (2026)",
    description:
      "The ideal consultant tech stack. CRM, scheduling, proposals, and client management tools to run a consulting business efficiently.",
    introText:
      "Consultants need a lean stack focused on client relationships, scheduling, and deliverable tracking. Every hour spent on admin is an hour not billed. This stack minimizes overhead while maximizing client experience.",
    toolSlugs: ["pipedrive", "calendly", "loom", "toggl", "harvest", "zapier", "convertkit"],
  },
  {
    slug: "solopreneur",
    role: "solopreneur",
    title: "Best Tool Stack for Solo Entrepreneurs (2026)",
    description:
      "The essential solopreneur tech stack. Everything you need to run a one-person business — CRM, marketing, automation, and project management.",
    introText:
      "As a solopreneur, you are the entire company. You need tools that punch above their weight — platforms that handle multiple functions so you can focus on growth instead of tool management.",
    toolSlugs: ["notion", "hubspot", "convertkit", "zapier", "calendly", "freshbooks", "loom", "canva"],
  },
  {
    slug: "agency",
    role: "marketing",
    title: "Best Tool Stack for Small Agencies (2026)",
    description:
      "The optimal small agency tech stack. Client management, project tracking, communication, and automation tools for growing agencies.",
    introText:
      "Small agencies juggle multiple clients, deliverables, and team members. Without the right systems, things fall through the cracks as you grow. This stack scales from 2 people to 15+ without needing replacement.",
    toolSlugs: ["monday", "gohighlevel", "slack", "make", "loom", "harvest", "activecampaign"],
  },
];

export async function generateStaticParams() {
  return stacks.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stack = stacks.find((s) => s.slug === slug);
  if (!stack) return { title: "Stack — FixWorkFlow" };
  return {
    title: `${stack.title} — FixWorkFlow`,
    description: stack.description,
  };
}

export default async function StackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stack = stacks.find((s) => s.slug === slug);

  if (!stack) notFound();

  const tools = stack.toolSlugs
    .map((slug) => toolsDatabase.find((t) => t.slug === slug))
    .filter(Boolean) as typeof toolsDatabase;

  // Group tools by category
  const categories = [...new Set(tools.map((t) => t.category))];
  const categoryLabels: Record<string, string> = {
    project_management: "Project Management",
    crm: "CRM & Client Management",
    automation: "Automation",
    communication: "Communication",
    email_marketing: "Email Marketing",
    time_tracking: "Time Tracking",
    invoicing: "Invoicing & Accounting",
    scheduling: "Scheduling",
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">FixWorkFlow</span>
          </Link>
          <Link
            href="/signup"
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-900 text-white text-xs sm:text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Start Free
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{stack.title}</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-8 sm:mb-10 leading-relaxed">{stack.introText}</p>

        {/* Tool Stack */}
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryTools = tools.filter((t) => t.category === category);
            return (
              <div key={category}>
                <h2 className="text-lg font-semibold text-blue-600 mb-4">
                  {categoryLabels[category] || category}
                </h2>
                <div className="space-y-3">
                  {categoryTools.map((tool) => (
                    <div
                      key={tool.slug}
                      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-gray-200 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5">
                            {tool.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-gray-900 font-semibold">{tool.name}</h3>
                            <p className="text-gray-500 text-sm mt-1">{tool.description}</p>
                            <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                              <span>{tool.pricing}</span>
                              <span>Rating: {tool.rating}/5</span>
                              {tool.hasFreeTier && (
                                <span className="text-emerald-500">Free tier available</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <a
                          href={`/go/${tool.slug}?source=stack`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm font-medium transition-colors flex-shrink-0 ml-13 sm:ml-0"
                        >
                          Try it
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 sm:mt-12 text-center bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-white mb-3">
            Get a stack recommendation tailored to you
          </h3>
          <p className="text-blue-100 mb-6">
            This is a general recommendation. Your ideal stack depends on your specific workflow,
            clients, and pain points.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-50 transition-all shadow-lg"
          >
            Get Personalized Recommendations
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
