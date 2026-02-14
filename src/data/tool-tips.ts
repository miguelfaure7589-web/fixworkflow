export interface ToolOptimizationTips {
  slug: string;
  name: string;
  generalTips: string[];
  premiumTips: string[];
  premiumSummary: string;
}

export const toolOptimizationTips: ToolOptimizationTips[] = [
  {
    slug: "clickup",
    name: "ClickUp",
    generalTips: [
      "Use ClickUp's built-in templates instead of creating projects from scratch every time",
      "Set up a single 'Home' dashboard to see all your priorities across spaces in one view",
      "Use the 'Everything' view to catch tasks that may have slipped through the cracks",
    ],
    premiumTips: [
      "Set up ClickUp Automations to auto-assign tasks when status changes, auto-move completed items to archive, and trigger email notifications to clients on milestone completion",
      "Build a custom CRM inside ClickUp using a List with custom fields (Deal Value, Stage, Next Action Date) — eliminates the need for a separate CRM tool",
      "Use ClickUp's Time Tracking + Custom Fields to auto-calculate project profitability by comparing estimated vs. actual hours",
      "Create a recurring 'Weekly Review' task template with subtasks for inbox zero, project status updates, and next-week planning",
      "Set up ClickUp Forms for client intake that auto-create projects with pre-populated task lists, assigned team members, and due dates",
    ],
    premiumSummary: "5 advanced ClickUp automations and workflows that could save you 4-6 hours/week",
  },
  {
    slug: "notion",
    name: "Notion",
    generalTips: [
      "Create a single 'Dashboard' page with linked views of your most important databases",
      "Use Notion's relation and rollup properties to connect your projects, clients, and tasks databases",
      "Set up recurring templates for weekly reviews, meeting notes, and project briefs",
    ],
    premiumTips: [
      "Build a client portal system using Notion's shared pages — each client gets a branded page with project status, deliverables, and a feedback section that you control",
      "Create a 'Second Brain' system with interconnected databases: Projects → Tasks → Notes → Resources, with rollup fields showing completion status and upcoming deadlines",
      "Set up a content pipeline database with status automation using Notion's API + Make/Zapier to auto-publish and track content across platforms",
      "Build a SOPs database with step-by-step process docs that link to relevant templates — essential for delegating or scaling",
      "Use Notion's formula properties to auto-calculate project profitability, hours remaining, and deadline risk across all active projects",
    ],
    premiumSummary: "5 advanced Notion systems for client management, content pipelines, and SOPs",
  },
  {
    slug: "asana",
    name: "Asana",
    generalTips: [
      "Use Asana's 'My Tasks' view religiously — sort by due date and review it every morning",
      "Create project templates for your most common project types to avoid rebuilding task lists",
      "Use Sections within projects to create workflow stages (To Do → In Progress → Review → Done)",
    ],
    premiumTips: [
      "Set up Asana Rules to auto-assign tasks when moved to specific sections, auto-set due dates relative to project start, and auto-notify stakeholders on completion",
      "Build a portfolio dashboard to track all active projects' health, timeline, and workload in a single executive view",
      "Create multi-homing tasks that appear in both the client project and your internal tracking board — one update syncs everywhere",
      "Use Asana Forms + Rules to build a fully automated client request pipeline that triages, assigns, and schedules incoming work",
      "Set up custom fields for time estimates and use workload view to prevent over-commitment before accepting new projects",
    ],
    premiumSummary: "5 advanced Asana automations for project scaling and client management",
  },
  {
    slug: "monday",
    name: "Monday.com",
    generalTips: [
      "Use Monday's automation recipes to eliminate repetitive status updates and notifications",
      "Create a master dashboard that pulls data from all your boards for a single overview",
      "Use the Workload view to spot capacity issues before they become deadline problems",
    ],
    premiumTips: [
      "Build a connected board system where your CRM board, project board, and invoicing board share data — update a deal status and watch project tasks auto-generate",
      "Set up Monday's custom automations with conditional logic: 'When status is Done AND client type is Retainer, create next month's tasks AND send recap email'",
      "Create a time tracking + profitability dashboard using Monday's formula columns to auto-calculate hourly rates, margin, and utilization per project",
      "Build client-facing boards with guest access limited to status views — clients see progress without accessing your internal notes",
      "Use Monday's API with Make to auto-sync your boards with invoicing software, creating invoices when project milestones are marked complete",
    ],
    premiumSummary: "5 Monday.com power workflows for connected boards, automation, and client visibility",
  },
  {
    slug: "trello",
    name: "Trello",
    generalTips: [
      "Use Trello's Butler automation to auto-move cards, set due dates, and create recurring tasks",
      "Keep boards focused — one board per active project or workflow, not one mega-board for everything",
      "Use labels consistently across boards to quickly filter by priority, client, or type",
    ],
    premiumTips: [
      "Set up Butler automations to create a full client onboarding pipeline: new card triggers checklist, assigns members, sets dates, and posts to Slack",
      "Build a 'Command Center' board with card mirroring that shows the top 3 priority cards from every project board in one place",
      "Use Trello's Calendar Power-Up combined with Butler rules to auto-schedule tasks and send digest emails of the upcoming week",
      "Create a repeating Sprint board template with Butler that auto-archives completed sprints and generates the next one with rollover tasks",
      "Set up Trello + Zapier webhooks for advanced reporting — auto-log card movements to a Google Sheet for time-in-stage analytics",
    ],
    premiumSummary: "5 Trello Butler automations and Power-Up combos for advanced project management",
  },
  {
    slug: "slack",
    name: "Slack",
    generalTips: [
      "Set up notification schedules so Slack only pings you during your designated communication windows",
      "Use Slack's 'Remind me' and 'Save' features to defer messages instead of acting on everything immediately",
      "Create a #decisions channel where all important decisions are posted — never lose a decision in a thread again",
    ],
    premiumTips: [
      "Build a Slack Workflow that collects async daily standups at 9 AM and posts a formatted summary — eliminates the need for standup meetings",
      "Set up channel naming conventions and auto-archiving rules: prefix with 'proj-' for projects, 'client-' for clients, auto-archive after 30 days of inactivity",
      "Create a Slack + Zapier automation that turns starred messages into tasks in your project management tool with one reaction emoji",
      "Build a client communication protocol using Slack Connect channels with standardized welcome messages, pinned resources, and response SLAs",
      "Set up Slack's Workflow Builder to create automated approval flows for budget requests, content review, and time-off — no more email chains",
    ],
    premiumSummary: "5 Slack workflows and automations to cut communication overhead by 40%",
  },
  {
    slug: "zapier",
    name: "Zapier",
    generalTips: [
      "Start with Zapier's pre-built templates instead of building from scratch — there are templates for most common workflows",
      "Use Zapier's 'Paths' feature to create if/then logic in a single Zap instead of building multiple separate ones",
      "Set up a Zapier monitoring dashboard and check it weekly to catch any failed runs before they cause problems",
    ],
    premiumTips: [
      "Build a complete client onboarding mega-Zap: form submission → CRM entry → Drive folder → project board → welcome email → Slack notification → calendar invite, all in one multi-step flow",
      "Set up revenue tracking automations: payment received → update CRM deal stage → log to revenue spreadsheet → trigger thank-you sequence → schedule follow-up for upsell",
      "Create a content repurposing engine: publish blog post → auto-create social media drafts in Buffer → schedule email newsletter → update content calendar → notify team",
      "Build error-resilient Zaps with built-in retry logic, fallback paths, and Slack alerts when critical automations fail",
      "Set up a 'Digital Assistant' Zap system that monitors your email for specific keywords and auto-creates tasks, calendar events, or CRM entries based on content",
    ],
    premiumSummary: "5 advanced Zapier mega-Zaps for end-to-end workflow automation",
  },
  {
    slug: "make",
    name: "Make",
    generalTips: [
      "Use Make's visual scenario builder to map out your automation before building — the visual approach helps catch logic gaps",
      "Take advantage of Make's free tier (1,000 operations/month) which is more generous than most automation tools",
      "Use Make's 'Router' module to split one trigger into multiple parallel actions for complex workflows",
    ],
    premiumTips: [
      "Build a complete project lifecycle automation: new client form → CRM entry → project folder structure → task board with template → welcome email sequence → Slack channel creation",
      "Set up data store modules to create a lightweight database within Make that tracks automation run history and aggregates metrics across scenarios",
      "Create a multi-scenario error handling system with webhook callbacks, retry queues, and escalation alerts for mission-critical automations",
      "Build a custom API integration using Make's HTTP module and JSON parsing to connect any tool that has an API — even if there's no native module",
      "Set up scheduled scenarios that auto-generate weekly reports by pulling data from 5+ tools and compiling into a formatted email or Notion page",
    ],
    premiumSummary: "5 advanced Make scenarios with data stores, custom APIs, and error handling",
  },
  {
    slug: "calendly",
    name: "Calendly",
    generalTips: [
      "Set up buffer times between meetings (15-30 min) to prevent back-to-back burnout",
      "Create different event types for different meeting purposes (15-min intro, 30-min check-in, 60-min deep dive)",
      "Add your Calendly link to your email signature, website, and proposals to reduce scheduling friction",
    ],
    premiumTips: [
      "Set up Calendly Workflows to auto-send a pre-meeting questionnaire, a reminder with agenda 24 hours before, and a follow-up email with next steps after the meeting",
      "Create a qualifying Calendly flow with routing: intake form → score lead → route to appropriate meeting type or team member based on responses",
      "Build a Calendly + Zapier pipeline that auto-creates CRM contacts, logs meetings to your project tool, and updates your time tracking for each booking",
      "Set up round-robin scheduling with weighted distribution if you have a team, so meetings auto-balance across members based on availability and workload",
      "Create a paid consultation booking page with Stripe integration and automatic confirmation, reducing admin for premium consultations to zero",
    ],
    premiumSummary: "5 Calendly workflows for automated scheduling, lead qualification, and CRM sync",
  },
  {
    slug: "toggl",
    name: "Toggl Track",
    generalTips: [
      "Use Toggl's browser extension for one-click time tracking without switching tabs",
      "Set up projects and clients in Toggl to automatically categorize your time for billing and analysis",
      "Review Toggl's weekly report every Friday to identify where your time actually went vs. where you planned",
    ],
    premiumTips: [
      "Build a profitability dashboard by connecting Toggl to Google Sheets via Zapier — auto-calculate hourly effective rate per client by comparing tracked hours to invoice amounts",
      "Set up Toggl's Project Estimates feature with alerts at 80% and 100% of budgeted hours, so you never accidentally over-deliver without renegotiating scope",
      "Create a Toggl + Make automation that auto-generates weekly time reports per client and emails them — builds trust and justifies your rates",
      "Use Toggl's API to build a personal analytics dashboard showing your productive hours trend, most profitable clients, and time allocation by category",
      "Set up Toggl integrations with your PM tool so starting a timer auto-links to the task, eliminating manual time entry and improving accuracy",
    ],
    premiumSummary: "5 Toggl integrations for profitability tracking, client reporting, and automation",
  },
  {
    slug: "freshbooks",
    name: "FreshBooks",
    generalTips: [
      "Set up recurring invoices for retainer clients to eliminate monthly invoicing work entirely",
      "Enable online payments (credit card + ACH) to reduce average collection time from 2 weeks to 2 days",
      "Use FreshBooks' expense tracking with receipt scanning — snap a photo and categorize in 5 seconds",
    ],
    premiumTips: [
      "Build a FreshBooks + Zapier automation that creates invoices when project milestones are marked complete in your PM tool — zero manual invoicing",
      "Set up automated payment reminder sequences: friendly nudge at 3 days overdue, firm reminder at 7 days, and escalation email at 14 days",
      "Create a cash flow forecasting system using FreshBooks reports + Google Sheets that auto-updates with outstanding invoices, upcoming recurring revenue, and projected income",
      "Set up project profitability tracking by connecting FreshBooks time tracking to invoiced amounts, revealing which clients and project types are most profitable",
      "Build an automated year-end tax prep workflow that categorizes expenses, generates reports, and exports everything your accountant needs in one click",
    ],
    premiumSummary: "5 FreshBooks automations for invoicing, cash flow forecasting, and tax prep",
  },
  {
    slug: "hubspot",
    name: "HubSpot CRM",
    generalTips: [
      "Use HubSpot's free email tracking to see when prospects open your emails — time your follow-ups accordingly",
      "Set up deal pipeline stages that match your actual sales process, not HubSpot's defaults",
      "Use HubSpot's meeting scheduler (free tier) as your Calendly alternative to keep everything in one system",
    ],
    premiumTips: [
      "Build a lead nurture workflow that auto-sends a 5-email sequence when someone downloads your lead magnet, with smart branching based on which emails they open",
      "Set up HubSpot's lead scoring to auto-qualify prospects based on email engagement, page visits, and form submissions — focus only on hot leads",
      "Create a deal stage automation pipeline: when deal moves to 'Won', auto-create onboarding tasks, send welcome email sequence, and notify team in Slack",
      "Build custom reports that show your full funnel metrics: website visits → leads → qualified → proposals → won, with conversion rates at each stage",
      "Set up HubSpot + Zapier integrations to sync deal data with your project management and invoicing tools, creating a seamless lead-to-delivery pipeline",
    ],
    premiumSummary: "5 HubSpot automations for lead nurturing, scoring, and full-funnel analytics",
  },
  {
    slug: "pipedrive",
    name: "Pipedrive",
    generalTips: [
      "Use Pipedrive's activity reminders to never forget a follow-up — schedule the next action before closing any deal view",
      "Set up custom fields for your specific deal data (project type, budget range, timeline) for better filtering and reporting",
      "Use Pipedrive's email integration to log all client emails automatically — no manual data entry needed",
    ],
    premiumTips: [
      "Build a Pipedrive automation that auto-creates and assigns follow-up activities based on deal stage changes, ensuring no lead goes cold",
      "Set up a lead rotation system with weighted assignment rules for teams, auto-distributing new leads based on capacity and expertise",
      "Create a Pipedrive + Make integration that syncs won deals to your project management tool, auto-creating the project with templated tasks and deadlines",
      "Build a deal velocity dashboard with custom fields tracking days-in-stage, identifying exactly where your sales process stalls",
      "Set up smart email templates with merge fields and sequence automation for each pipeline stage, reducing follow-up writing time to zero",
    ],
    premiumSummary: "5 Pipedrive automations for pipeline optimization, lead routing, and deal tracking",
  },
  {
    slug: "loom",
    name: "Loom",
    generalTips: [
      "Replace status update meetings with 3-5 minute Loom recordings — viewers can watch at 2x speed on their own time",
      "Use Loom's chapters feature to let viewers skip to the relevant section instead of watching the whole video",
      "Record quick Loom walkthroughs for client deliverables instead of writing long explanation emails",
    ],
    premiumTips: [
      "Build a Loom-based async meeting protocol: record agenda overview → share with attendees → collect Loom response videos → summarize decisions in doc. Eliminates 60% of meetings",
      "Create a client onboarding video library using Loom: welcome video, platform walkthrough, process explanation, FAQ — reuse across all clients",
      "Set up a Loom + Notion knowledge base where every internal process has a video walkthrough linked to its SOP doc, making training scalable",
      "Build a Loom feedback workflow: share design/work via Loom → client responds with timestamped comments → you compile action items. Cuts revision cycles in half",
      "Use Loom's engagement analytics to identify which parts of your presentations or proposals lose viewer attention, then optimize your communication",
    ],
    premiumSummary: "5 Loom workflows for async meetings, client onboarding, and knowledge management",
  },
  {
    slug: "quickbooks",
    name: "QuickBooks",
    generalTips: [
      "Connect your bank accounts and credit cards for automatic transaction importing — stop manual data entry",
      "Set up rules to auto-categorize recurring transactions (subscriptions, rent, utilities) so they sort themselves",
      "Use QuickBooks' receipt capture app on your phone to snap and categorize expenses in real-time",
    ],
    premiumTips: [
      "Build a QuickBooks + Zapier pipeline that auto-creates invoices when projects are marked complete in your PM tool",
      "Set up automated financial reporting that emails you weekly P&L summaries and monthly cash flow forecasts",
      "Create a project profitability tracking system using QuickBooks classes and custom reports to see which clients and project types drive the most profit",
      "Build a tax-ready system with auto-categorization rules, quarterly estimate calculations, and one-click export for your accountant",
      "Set up QuickBooks + Stripe + CRM sync so payments auto-reconcile, deal stages auto-update, and revenue reporting is always current",
    ],
    premiumSummary: "5 QuickBooks automations for invoicing, profitability, and tax-ready bookkeeping",
  },
  {
    slug: "google_docs",
    name: "Google Docs/Drive",
    generalTips: [
      "Create a consistent folder structure (Client → Project → Phase) and stick to it for every project",
      "Use Google Drive's Starred and Quick Access features to pin your most-used files for instant access",
      "Set up shared drives for client collaboration instead of sharing individual files — keeps permissions clean",
    ],
    premiumTips: [
      "Build a Google Drive template system with pre-made folder structures that auto-create via Zapier when you start a new project",
      "Set up Google Docs + Make automations that auto-generate client reports by pulling data from your PM tool and populating a template doc",
      "Create a document workflow using Google Docs' approval features combined with Slack notifications for review requests and sign-offs",
      "Build a knowledge base in Google Sites that links to your key Google Docs, organized by topic — searchable, shareable, and always up-to-date",
      "Set up auto-backup and organization scripts using Google Apps Script to archive old files, enforce naming conventions, and maintain folder hygiene",
    ],
    premiumSummary: "5 Google Workspace automations for templates, auto-reports, and document workflows",
  },
];

export function getToolTips(slug: string): ToolOptimizationTips | undefined {
  return toolOptimizationTips.find((t) => t.slug === slug);
}
