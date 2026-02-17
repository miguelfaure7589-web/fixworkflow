import type { BottleneckCategory } from "@/lib/bottleneck-scoring";

export interface ActionItem {
  id: string;
  category: BottleneckCategory;
  title: string;
  summary: string;
  difficulty: number; // 1-5
  impact: number; // 1-5
  timeToImplement: string;
  prerequisites: string[];
  stageFit: string[]; // solo, small, medium, larger
  businessTypeFit: string[]; // freelancer, solopreneur, team_lead, remote_employee, agency_owner
  templateUrl?: string;
  resourceLinks?: string[];
  affiliateToolTags: string[]; // tool category slugs for matching
}

export const actionLibrary: ActionItem[] = [
  // ─── Lead Generation (3 actions) ───
  {
    id: "lg-01",
    category: "lead_generation",
    title: "Create a lead magnet and landing page",
    summary:
      "Build a high-value free resource (checklist, template, or mini-guide) that solves a specific problem for your ideal client. Pair it with a simple landing page and email capture form. This becomes your automated lead generation engine — share the link everywhere and let it work 24/7.",
    difficulty: 2,
    impact: 5,
    timeToImplement: "1-2 weeks",
    prerequisites: ["Clear ideal client profile"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["lead magnet ideas for your niche", "landing page copywriting tips"],
    affiliateToolTags: ["email_marketing", "crm"],
  },
  {
    id: "lg-02",
    category: "lead_generation",
    title: "Set up an outbound prospecting system",
    summary:
      "Define your ideal client criteria, build a targeted list of 50-100 prospects, and create a 3-touch outreach sequence (personalized connection, value-add follow-up, soft ask). Schedule 30 minutes daily for outreach. Track responses in a simple spreadsheet or CRM.",
    difficulty: 3,
    impact: 4,
    timeToImplement: "1 week",
    prerequisites: ["Clear service offering", "Target market defined"],
    stageFit: ["solo", "small"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["cold outreach templates that work", "LinkedIn prospecting strategy"],
    affiliateToolTags: ["crm", "email_marketing"],
  },
  {
    id: "lg-03",
    category: "lead_generation",
    title: "Launch a referral and partnership program",
    summary:
      "Identify your top 10 clients and 5 complementary service providers. Create a simple referral incentive (discount, bonus service, or cash). Reach out personally to each one with a clear ask and make it easy for them to refer. Follow up monthly.",
    difficulty: 2,
    impact: 4,
    timeToImplement: "3-5 days",
    prerequisites: ["Existing client base"],
    stageFit: ["solo", "small", "medium", "larger"],
    businessTypeFit: ["freelancer", "solopreneur", "team_lead", "agency_owner"],
    resourceLinks: ["referral program templates", "partnership outreach scripts"],
    affiliateToolTags: ["crm"],
  },

  // ─── Conversion (3 actions) ───
  {
    id: "cv-01",
    category: "conversion",
    title: "Build a discovery call framework",
    summary:
      "Create a structured discovery call script that uncovers the prospect's pain, budget, timeline, and decision process. Include qualifying questions, a clear agenda, and a next-step close. Practice it until it feels natural, then use it consistently.",
    difficulty: 2,
    impact: 5,
    timeToImplement: "2-3 days",
    prerequisites: [],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["discovery call script templates", "consultative selling framework"],
    affiliateToolTags: ["scheduling", "crm"],
  },
  {
    id: "cv-02",
    category: "conversion",
    title: "Create a proposal template system",
    summary:
      "Design a reusable proposal template that clearly shows the problem, your solution, deliverables, timeline, investment, and social proof. Include 2-3 pricing tiers to anchor value. Automate sending and tracking so you know when prospects view it.",
    difficulty: 2,
    impact: 4,
    timeToImplement: "3-5 days",
    prerequisites: ["Defined service packages"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["high-converting proposal templates", "pricing tier strategies"],
    affiliateToolTags: ["project_management", "crm"],
  },
  {
    id: "cv-03",
    category: "conversion",
    title: "Implement a follow-up automation sequence",
    summary:
      "Set up an automated follow-up sequence that triggers after proposals, discovery calls, or inquiries. Day 1: recap email. Day 3: value-add resource. Day 7: check-in. Day 14: last touch. This alone can increase close rates by 20-30%.",
    difficulty: 3,
    impact: 5,
    timeToImplement: "1 week",
    prerequisites: ["Email tool or CRM"],
    stageFit: ["solo", "small", "medium", "larger"],
    businessTypeFit: ["freelancer", "solopreneur", "team_lead", "agency_owner"],
    resourceLinks: ["follow-up email sequence templates", "sales automation setup guide"],
    affiliateToolTags: ["automation", "crm", "email_marketing"],
  },

  // ─── Retention (3 actions) ───
  {
    id: "rt-01",
    category: "retention",
    title: "Set up quarterly business reviews with clients",
    summary:
      "Schedule 30-minute quarterly check-ins with your top clients. Review results, gather feedback, discuss upcoming needs, and identify upsell opportunities. Use a simple template: wins, challenges, next quarter goals. This builds loyalty and surfaces renewal/expansion opportunities.",
    difficulty: 1,
    impact: 4,
    timeToImplement: "2-3 days",
    prerequisites: ["Active client relationships"],
    stageFit: ["solo", "small", "medium", "larger"],
    businessTypeFit: ["freelancer", "solopreneur", "team_lead", "agency_owner"],
    resourceLinks: ["quarterly business review template", "client retention strategies"],
    affiliateToolTags: ["scheduling", "crm"],
  },
  {
    id: "rt-02",
    category: "retention",
    title: "Create a client feedback loop",
    summary:
      "Build a simple feedback system: send a 3-question survey at project milestones and at completion. Track NPS or satisfaction scores over time. Act on feedback within 48 hours. Clients who feel heard are 4x more likely to refer others.",
    difficulty: 1,
    impact: 3,
    timeToImplement: "1-2 days",
    prerequisites: [],
    stageFit: ["solo", "small", "medium", "larger"],
    businessTypeFit: ["freelancer", "solopreneur", "team_lead", "agency_owner"],
    resourceLinks: ["client feedback survey templates", "NPS implementation guide"],
    affiliateToolTags: ["automation", "crm"],
  },
  {
    id: "rt-03",
    category: "retention",
    title: "Build a client reactivation campaign",
    summary:
      "Identify past clients who haven't worked with you in 3+ months. Send a personalized check-in email with a relevant insight or offer. Reactivating dormant clients costs 5-7x less than acquiring new ones and has a much higher conversion rate.",
    difficulty: 2,
    impact: 4,
    timeToImplement: "3-5 days",
    prerequisites: ["Past client list"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["client reactivation email templates", "win-back campaign strategies"],
    affiliateToolTags: ["email_marketing", "crm"],
  },

  // ─── Pricing (3 actions) ───
  {
    id: "pr-01",
    category: "pricing",
    title: "Conduct a pricing analysis and adjustment",
    summary:
      "Audit your current pricing against your costs, time investment, and market rates. Calculate your effective hourly rate for each service. If it's below your target, raise prices by 15-25% for new clients immediately. Existing clients can be grandfathered for one cycle.",
    difficulty: 2,
    impact: 5,
    timeToImplement: "3-5 days",
    prerequisites: ["Time tracking data or estimates"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["pricing calculator for services", "how to raise your rates"],
    affiliateToolTags: ["time_tracking", "invoicing"],
  },
  {
    id: "pr-02",
    category: "pricing",
    title: "Create tiered service packages",
    summary:
      "Design 3 tiers of your core service: Basic (entry point), Standard (most popular), and Premium (high-touch). Each tier should have clear deliverables and increasing value. This anchors pricing, speeds up buying decisions, and naturally increases average deal size.",
    difficulty: 3,
    impact: 4,
    timeToImplement: "1 week",
    prerequisites: ["Clear understanding of service deliverables"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["service packaging frameworks", "tiered pricing examples"],
    affiliateToolTags: ["crm"],
  },
  {
    id: "pr-03",
    category: "pricing",
    title: "Implement retainer or subscription pricing",
    summary:
      "Convert your best one-time clients to monthly retainers or subscription packages. Start by offering a maintenance/support plan at 20-30% of the project value per month. This creates predictable revenue and reduces the constant hustle for new projects.",
    difficulty: 3,
    impact: 5,
    timeToImplement: "1-2 weeks",
    prerequisites: ["Proven service delivery", "Recurring needs from clients"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["retainer pricing strategies", "subscription business models for services"],
    affiliateToolTags: ["invoicing", "payment_processing", "crm"],
  },

  // ─── Offer & Positioning (3 actions) ───
  {
    id: "op-01",
    category: "offer_positioning",
    title: "Define your signature offer",
    summary:
      "Create one clearly defined flagship service with a specific outcome, timeline, and price. Instead of 'I do web design', it becomes 'I build conversion-focused landing pages in 2 weeks for $3,500.' A signature offer makes you memorable and easy to refer.",
    difficulty: 3,
    impact: 5,
    timeToImplement: "1 week",
    prerequisites: ["Market experience", "Client results to reference"],
    stageFit: ["solo", "small"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["signature offer creation framework", "positioning for consultants"],
    affiliateToolTags: [],
  },
  {
    id: "op-02",
    category: "offer_positioning",
    title: "Build a case study and proof library",
    summary:
      "Document 3-5 of your best client results as structured case studies: situation, challenge, solution, results (with numbers). Use these in proposals, on your website, and in sales conversations. Social proof is the strongest conversion tool you have.",
    difficulty: 2,
    impact: 4,
    timeToImplement: "1-2 weeks",
    prerequisites: ["Past client results"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["case study template", "how to collect client testimonials"],
    affiliateToolTags: ["project_management"],
  },
  {
    id: "op-03",
    category: "offer_positioning",
    title: "Create a competitive positioning map",
    summary:
      "Research 5-10 competitors and map them on two axes that matter to your clients (e.g., price vs. specialization, speed vs. quality). Find the gap where you can own a unique position. Use this to refine your messaging and stand out in a crowded market.",
    difficulty: 3,
    impact: 3,
    timeToImplement: "3-5 days",
    prerequisites: [],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["solopreneur", "agency_owner", "freelancer"],
    resourceLinks: ["competitive analysis frameworks", "positioning map template"],
    affiliateToolTags: [],
  },

  // ─── Operations (3 actions) ───
  {
    id: "ops-01",
    category: "operations",
    title: "Document your top 5 SOPs",
    summary:
      "Identify the 5 processes you repeat most often (client onboarding, project kickoff, delivery, invoicing, reporting). Document each as a step-by-step checklist with screenshots. Store them in a central wiki. This is the foundation for delegation and consistency.",
    difficulty: 2,
    impact: 4,
    timeToImplement: "1-2 weeks",
    prerequisites: [],
    stageFit: ["solo", "small", "medium", "larger"],
    businessTypeFit: ["freelancer", "solopreneur", "team_lead", "agency_owner"],
    resourceLinks: ["SOP template for small business", "process documentation best practices"],
    affiliateToolTags: ["project_management", "communication"],
  },
  {
    id: "ops-02",
    category: "operations",
    title: "Implement a weekly planning and review system",
    summary:
      "Block 30 minutes every Monday morning for planning and 15 minutes Friday afternoon for review. Monday: set 3 priorities, review calendar, check pipeline. Friday: log wins, note blockers, prep next week. This simple ritual prevents reactive firefighting.",
    difficulty: 1,
    impact: 4,
    timeToImplement: "1 day",
    prerequisites: [],
    stageFit: ["solo", "small", "medium", "larger"],
    businessTypeFit: ["freelancer", "solopreneur", "team_lead", "remote_employee", "agency_owner"],
    resourceLinks: ["weekly review template", "weekly planning system for solopreneurs"],
    affiliateToolTags: ["project_management"],
  },
  {
    id: "ops-03",
    category: "operations",
    title: "Create an automated client onboarding workflow",
    summary:
      "Map every step from signed contract to project kickoff. Automate: welcome email, intake form, folder creation, kickoff scheduling, and first milestone setup. A smooth onboarding sets the tone for the entire engagement and saves 2-4 hours per new client.",
    difficulty: 3,
    impact: 4,
    timeToImplement: "1-2 weeks",
    prerequisites: ["Defined onboarding steps"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["client onboarding automation guide", "onboarding checklist template"],
    affiliateToolTags: ["automation", "project_management", "crm"],
  },

  // ─── Time Management (3 actions) ───
  {
    id: "tm-01",
    category: "time_management",
    title: "Implement time blocking for deep work",
    summary:
      "Block 2-3 hour 'deep work' sessions on your calendar every day. During these blocks: close email, mute Slack, put your phone on DND. Start with 2 blocks per week and increase. Protect this time like a client meeting — it is your most valuable work time.",
    difficulty: 1,
    impact: 5,
    timeToImplement: "1 day",
    prerequisites: [],
    stageFit: ["solo", "small", "medium", "larger"],
    businessTypeFit: ["freelancer", "solopreneur", "team_lead", "remote_employee"],
    resourceLinks: ["time blocking guide for remote workers", "deep work scheduling strategies"],
    affiliateToolTags: ["scheduling"],
  },
  {
    id: "tm-02",
    category: "time_management",
    title: "Build a task batching system",
    summary:
      "Group similar tasks into batches and assign them to specific time slots. Email: 10am and 3pm. Meetings: Tuesdays and Thursdays. Admin: Friday afternoon. Content creation: Monday mornings. Batching reduces context-switching, which eats 20-40% of most people's productive time.",
    difficulty: 1,
    impact: 4,
    timeToImplement: "2-3 days",
    prerequisites: ["Time tracking data"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "remote_employee", "team_lead"],
    resourceLinks: ["task batching template", "context switching research"],
    affiliateToolTags: ["project_management", "scheduling"],
  },
  {
    id: "tm-03",
    category: "time_management",
    title: "Create a delegation playbook",
    summary:
      "List every recurring task and rate it: only-I-can-do (keep), trainable (delegate soon), anyone-can-do (delegate now). For each delegatable task, create a one-page guide with steps, quality standards, and common mistakes. Start delegating the 3 easiest ones this week.",
    difficulty: 3,
    impact: 5,
    timeToImplement: "1-2 weeks",
    prerequisites: ["Budget for contractor or assistant"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner", "team_lead"],
    resourceLinks: ["delegation framework for solopreneurs", "hiring your first VA"],
    affiliateToolTags: ["project_management", "communication"],
  },

  // ─── Cash Flow (3 actions) ───
  {
    id: "cf-01",
    category: "cashflow",
    title: "Set up profit-first banking",
    summary:
      "Open a dedicated business bank account with multiple sub-accounts: Operating (55%), Tax Reserve (25%), Profit (10%), Owner Pay (10%). Set up automatic transfers on every deposit. You'll always know your real available cash and never get surprised at tax time.",
    difficulty: 1,
    impact: 4,
    timeToImplement: "2-3 days",
    prerequisites: [],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["profit first system setup guide", "business banking comparison"],
    affiliateToolTags: ["business_banking"],
  },
  {
    id: "cf-02",
    category: "cashflow",
    title: "Implement 48-hour invoicing with payment links",
    summary:
      "Send invoices within 48 hours of completing work or hitting a milestone. Include a one-click payment link so clients can pay instantly. Set up automatic reminders at 3, 7, and 14 days overdue. This alone can reduce average payment time from 30+ days to under 10.",
    difficulty: 1,
    impact: 5,
    timeToImplement: "2-3 days",
    prerequisites: [],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["invoicing best practices", "getting clients to pay faster"],
    affiliateToolTags: ["invoicing", "payment_processing"],
  },
  {
    id: "cf-03",
    category: "cashflow",
    title: "Build a 90-day cash flow forecast",
    summary:
      "Map out your expected income and expenses for the next 90 days. Include recurring revenue, pending proposals (weighted by probability), and fixed costs. Update weekly. This gives you early warning of cash gaps and confidence to invest in growth.",
    difficulty: 2,
    impact: 3,
    timeToImplement: "3-5 days",
    prerequisites: ["Basic financial records"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner", "team_lead"],
    resourceLinks: ["cash flow forecast template", "financial planning for freelancers"],
    affiliateToolTags: ["invoicing", "business_banking"],
  },

  // ─── Marketing Channel Fit (3 actions) ───
  {
    id: "mc-01",
    category: "marketing_channel_fit",
    title: "Run a marketing channel audit",
    summary:
      "List every marketing channel you've used in the last 6 months. For each, track: time invested, money spent, leads generated, clients won. Calculate cost-per-lead and cost-per-client. Double down on your top 2 channels and cut the rest. Most businesses spread too thin.",
    difficulty: 2,
    impact: 4,
    timeToImplement: "3-5 days",
    prerequisites: ["Some marketing history"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["marketing channel audit template", "channel ROI calculator"],
    affiliateToolTags: [],
  },
  {
    id: "mc-02",
    category: "marketing_channel_fit",
    title: "Build a content repurposing system",
    summary:
      "Create one long-form piece per week (blog post, video, or podcast). Break it into 5-10 micro-content pieces for social media. Use a template to batch this process. One input creates a week of content across platforms without additional creative effort.",
    difficulty: 3,
    impact: 4,
    timeToImplement: "1-2 weeks",
    prerequisites: ["One primary content channel"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["solopreneur", "agency_owner", "freelancer"],
    resourceLinks: ["content repurposing framework", "batch content creation workflow"],
    affiliateToolTags: ["automation"],
  },
  {
    id: "mc-03",
    category: "marketing_channel_fit",
    title: "Set up email marketing automation",
    summary:
      "Build a 5-email welcome sequence for new subscribers: introduce yourself, share your best insight, provide a quick win, show social proof, and make a soft offer. Set up weekly or biweekly newsletters. Email consistently outperforms every other channel for ROI.",
    difficulty: 2,
    impact: 5,
    timeToImplement: "1-2 weeks",
    prerequisites: ["Lead magnet or signup form"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["welcome sequence templates", "email marketing for small business"],
    affiliateToolTags: ["email_marketing"],
  },

  // ─── Sales Process (3 actions) ───
  {
    id: "sp-01",
    category: "sales_process",
    title: "Set up a CRM with pipeline stages",
    summary:
      "Choose a CRM and create pipeline stages that match your sales process: Lead, Contacted, Discovery Call, Proposal Sent, Negotiating, Won, Lost. Add every prospect immediately. Review your pipeline weekly. Visibility into your pipeline is the first step to improving it.",
    difficulty: 2,
    impact: 5,
    timeToImplement: "3-5 days",
    prerequisites: [],
    stageFit: ["solo", "small", "medium", "larger"],
    businessTypeFit: ["freelancer", "solopreneur", "team_lead", "agency_owner"],
    resourceLinks: ["CRM setup guide for solopreneurs", "sales pipeline best practices"],
    affiliateToolTags: ["crm"],
  },
  {
    id: "sp-02",
    category: "sales_process",
    title: "Create a sales playbook",
    summary:
      "Document your entire sales process: how you qualify leads, discovery call script, objection responses, proposal format, follow-up cadence, and closing techniques. A written playbook ensures consistency and makes it possible to train others or delegate sales.",
    difficulty: 3,
    impact: 4,
    timeToImplement: "1-2 weeks",
    prerequisites: ["Active sales experience"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["solopreneur", "agency_owner", "team_lead"],
    resourceLinks: ["sales playbook template", "objection handling scripts"],
    affiliateToolTags: ["crm", "project_management"],
  },
  {
    id: "sp-03",
    category: "sales_process",
    title: "Implement deal scoring and prioritization",
    summary:
      "Score each deal in your pipeline by: budget fit (1-5), timeline urgency (1-5), decision-maker access (1-5), and need match (1-5). Total score determines priority. Focus 80% of your sales time on top-scored deals. Stop wasting time on low-probability prospects.",
    difficulty: 2,
    impact: 3,
    timeToImplement: "2-3 days",
    prerequisites: ["Active pipeline with deals"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner"],
    resourceLinks: ["deal scoring framework", "sales prioritization strategies"],
    affiliateToolTags: ["crm"],
  },

  // ─── Tech Stack (3 actions) ───
  {
    id: "ts-01",
    category: "tech_stack",
    title: "Run a tool stack audit and consolidation",
    summary:
      "List every tool you pay for with monthly cost, last used date, and what it does. Identify overlap (e.g., two project tools, three note apps). Cancel unused subscriptions immediately. Consolidate overlapping tools to 1-2 platforms. Most people save $50-200/month.",
    difficulty: 1,
    impact: 3,
    timeToImplement: "2-3 days",
    prerequisites: [],
    stageFit: ["solo", "small", "medium", "larger"],
    businessTypeFit: ["freelancer", "solopreneur", "team_lead", "remote_employee", "agency_owner"],
    resourceLinks: ["tool audit spreadsheet template", "SaaS stack optimization guide"],
    affiliateToolTags: ["project_management"],
  },
  {
    id: "ts-02",
    category: "tech_stack",
    title: "Set up cross-tool automation workflows",
    summary:
      "Connect your core tools (CRM, project management, email, invoicing) with automation workflows. Start with 3 high-impact automations: new lead → CRM + task, project complete → invoice + feedback survey, meeting booked → prep task + reminder.",
    difficulty: 3,
    impact: 4,
    timeToImplement: "1-2 weeks",
    prerequisites: ["Core tools selected"],
    stageFit: ["solo", "small", "medium"],
    businessTypeFit: ["freelancer", "solopreneur", "agency_owner", "team_lead"],
    resourceLinks: ["top automation workflows for small business", "Zapier/Make getting started"],
    affiliateToolTags: ["automation"],
  },
  {
    id: "ts-03",
    category: "tech_stack",
    title: "Implement a centralized knowledge base",
    summary:
      "Set up one platform as your single source of truth for all SOPs, templates, meeting notes, and reference docs. Use a clear folder structure: by client, by process, by team. Link to it from your project management tool. No more 'where is that document?'",
    difficulty: 2,
    impact: 3,
    timeToImplement: "1 week",
    prerequisites: [],
    stageFit: ["solo", "small", "medium", "larger"],
    businessTypeFit: ["freelancer", "solopreneur", "team_lead", "agency_owner"],
    resourceLinks: ["knowledge base setup guide", "Notion wiki templates"],
    affiliateToolTags: ["project_management"],
  },
];

export function getActionsForCategory(category: BottleneckCategory): ActionItem[] {
  return actionLibrary.filter((a) => a.category === category);
}

export function getActionById(id: string): ActionItem | undefined {
  return actionLibrary.find((a) => a.id === id);
}
