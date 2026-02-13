import { toolsDatabase, type ToolData } from "@/data/tools";

export interface DiagnosticInput {
  role: string;
  industry: string;
  teamSize: string;
  workEnvironment: string;
  productivityScore: number;
  frictionAreas: string[];
  currentTools: string[];
  detailedAnswers: Record<string, string>;
}

export interface RecommendationOutput {
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  problem: string;
  solution: string;
  impact: string;
  tools: ToolData[];
  isPremium: boolean;
}

interface ProblemRule {
  frictionArea: string;
  category: string;
  title: string;
  getProblem: (input: DiagnosticInput) => string;
  getSolution: (input: DiagnosticInput) => string;
  getImpact: (input: DiagnosticInput) => string;
  getTools: (input: DiagnosticInput) => ToolData[];
  getPriority: (input: DiagnosticInput) => "high" | "medium" | "low";
}

const problemRules: ProblemRule[] = [
  // ─── Task Management ───
  {
    frictionArea: "task_management",
    category: "project_management",
    title: "Consolidate your task management",
    getProblem: (input) => {
      const detail = input.detailedAnswers.task_detail;
      const problems: Record<string, string> = {
        no_system: "You don't have a structured system for tracking tasks. This leads to forgotten deliverables and constant mental overhead trying to remember what needs doing.",
        too_complex: "Your current project management setup is too complex for your needs. Features you don't use are creating friction instead of reducing it.",
        no_visibility: "You lack visibility into what's happening across your work. Without a clear overview, priorities slip and work gets duplicated.",
        missed_deadlines: "Tasks are consistently missing deadlines. Without proper tracking and reminders, work falls through the cracks.",
      };
      return problems[detail] || "Your task management process has significant gaps that are costing you productive hours every week.";
    },
    getSolution: (input) => {
      if (input.teamSize === "solo") {
        return "Set up a single project management tool as your command center. Use it for every task, no matter how small. The key is consistency — one system for everything eliminates the mental overhead of remembering where things live.";
      }
      return "Consolidate your team onto a single project management platform. Create standardized project templates and establish a daily routine where everyone updates their task status. This eliminates status meetings and gives everyone real-time visibility.";
    },
    getImpact: (input) => {
      return input.teamSize === "solo" ? "~3-4 hours/week saved" : "~5-8 hours/week saved across team";
    },
    getTools: (input) => {
      const hasNotion = input.currentTools.includes("notion");
      const tools = toolsDatabase.filter((t) => t.category === "project_management");
      if (hasNotion) {
        return tools.filter((t) => t.slug !== "notion").slice(0, 2);
      }
      if (input.teamSize === "solo" || input.role === "freelancer") {
        return tools.filter((t) => ["notion", "clickup"].includes(t.slug));
      }
      return tools.filter((t) => ["clickup", "monday", "asana"].includes(t.slug));
    },
    getPriority: () => "high",
  },

  // ─── Communication ───
  {
    frictionArea: "communication",
    category: "communication",
    title: "Fix your communication workflow",
    getProblem: (input) => {
      const detail = input.detailedAnswers.communication_detail;
      const problems: Record<string, string> = {
        too_many_channels: "You're spreading communication across too many platforms. Important context gets lost when conversations happen in email, chat, text, and DMs simultaneously.",
        sync_overload: "Your calendar is packed with meetings, leaving no time for deep work. Most of these meetings could be replaced with async updates.",
        messages_lost: "Critical information is getting buried in message threads and channels. There's no reliable way to surface decisions or action items.",
        no_async: "Everything feels urgent because there are no async communication norms. This leads to constant interruptions and context switching.",
      };
      return problems[detail] || "Your communication workflow has gaps that are creating unnecessary overhead and missed information.";
    },
    getSolution: (input) => {
      const detail = input.detailedAnswers.communication_detail;
      if (detail === "sync_overload") {
        return "Replace 50% of your recurring meetings with async video updates using Loom. Set a rule: if a meeting doesn't require real-time decision-making, it becomes a Loom. Create a dedicated channel for async updates so they're easy to find.";
      }
      if (detail === "too_many_channels") {
        return "Consolidate to two communication tools maximum: one for real-time (Slack) and one for formal/external (email). Create clear rules for what goes where. Pin important decisions in dedicated channels.";
      }
      return "Establish clear async-first communication norms. Use threaded conversations, set response time expectations (e.g., 4-hour window for non-urgent), and create a weekly async standup instead of daily sync calls.";
    },
    getImpact: () => "~3-5 hours/week saved",
    getTools: (input) => {
      const tools: ToolData[] = [];
      const hasSlack = input.currentTools.includes("slack");
      if (!hasSlack) {
        const slack = toolsDatabase.find((t) => t.slug === "slack");
        if (slack) tools.push(slack);
      }
      const loom = toolsDatabase.find((t) => t.slug === "loom");
      if (loom) tools.push(loom);
      return tools;
    },
    getPriority: (input) => {
      return input.detailedAnswers.communication_detail === "sync_overload" ? "high" : "medium";
    },
  },

  // ─── Client Work ───
  {
    frictionArea: "client_work",
    category: "crm",
    title: "Streamline your client management",
    getProblem: (input) => {
      const detail = input.detailedAnswers.client_detail;
      const problems: Record<string, string> = {
        onboarding: "Every new client starts from scratch. You're recreating onboarding steps, sending the same emails, and setting up the same folders manually each time.",
        feedback: "Getting feedback and approvals from clients is a bottleneck. Revision cycles stretch out because there's no structured process.",
        tracking: "You're losing track of deliverables across clients. Without a clear system, things fall through the cracks and client trust erodes.",
        communication: "Client communication is scattered across email, chat, and calls. There's no single source of truth for each client relationship.",
      };
      return problems[detail] || "Your client management process has inefficiencies that are limiting how many clients you can serve effectively.";
    },
    getSolution: (input) => {
      if (input.role === "freelancer" || input.role === "solopreneur") {
        return "Set up a lightweight CRM to track every client relationship in one place. Create a templated onboarding workflow that triggers automatically when you add a new client. This includes welcome emails, intake forms, folder creation, and kickoff scheduling.";
      }
      return "Implement a CRM with pipeline stages that match your client journey (lead → onboarding → active → delivered → follow-up). Automate repetitive touchpoints and create client-facing portals for status updates.";
    },
    getImpact: () => "~4-6 hours/week saved",
    getTools: (input) => {
      if (input.industry === "marketing" || input.industry === "consulting") {
        return toolsDatabase.filter((t) => ["gohighlevel", "pipedrive"].includes(t.slug));
      }
      return toolsDatabase.filter((t) => ["pipedrive", "hubspot"].includes(t.slug));
    },
    getPriority: () => "high",
  },

  // ─── Automation ───
  {
    frictionArea: "automation",
    category: "automation",
    title: "Add an automation layer to your workflow",
    getProblem: (input) => {
      const detail = input.detailedAnswers.automation_detail;
      const problems: Record<string, string> = {
        data_entry: "You're manually copying data between tools — updating spreadsheets from emails, moving CRM data to project boards, syncing contacts across platforms. This is exactly what automation was built for.",
        follow_ups: "You're manually sending follow-up emails, reminders, and check-ins. These repetitive tasks eat into your productive hours and are easy to forget.",
        reporting: "You're building reports from scratch each week or month. The data exists across your tools but requires manual assembly.",
        onboarding_steps: "Every new project or client requires the same setup steps — creating folders, sending templates, updating trackers. This should happen automatically.",
      };
      return problems[detail] || "You're spending hours on repetitive manual tasks that can be automated with the right tools.";
    },
    getSolution: () => {
      return "Start with 3-5 high-impact automations that save you the most time. Common starters: (1) New form submission → create project + send welcome email, (2) Task completed → notify client + update tracker, (3) New email from client → create task in project board, (4) Weekly → auto-generate status report, (5) Invoice paid → update CRM + send thank you.";
    },
    getImpact: () => "~3-6 hours/week saved",
    getTools: (input) => {
      if (input.industry === "development") {
        return toolsDatabase.filter((t) => t.slug === "make");
      }
      return toolsDatabase.filter((t) => ["zapier", "make"].includes(t.slug));
    },
    getPriority: () => "high",
  },

  // ─── Too Many Tools ───
  {
    frictionArea: "too_many_tools",
    category: "consolidation",
    title: "Consolidate your tool stack",
    getProblem: (input) => {
      const toolCount = input.currentTools.filter((t) => t !== "none").length;
      return `You're using ${toolCount} different tools, and they likely have overlapping features. This creates data silos, subscription waste, and constant context switching between interfaces. Each tool switch costs ~23 minutes of refocusing time.`;
    },
    getSolution: (input) => {
      const hasPM = input.currentTools.some((t) => ["trello", "asana", "monday", "clickup"].includes(t));
      if (hasPM) {
        return "Audit your stack for overlap. Identify which tools can be replaced by features in your primary platform. For example, ClickUp can replace standalone time tracking, docs, and goal-setting tools. Aim to cut your tool count by 30-50% within 30 days.";
      }
      return "Choose one platform as your central hub and evaluate every other tool against it. If a feature exists in your hub tool, consolidate there. This reduces context switching and subscription costs while improving data connectivity.";
    },
    getImpact: (input) => {
      const toolCount = input.currentTools.filter((t) => t !== "none").length;
      const savings = Math.max(2, Math.floor(toolCount * 0.3)) * 15;
      return `~$${savings}/mo saved + 2-3 hours/week less context switching`;
    },
    getTools: () => {
      return toolsDatabase.filter((t) => ["clickup", "notion"].includes(t.slug));
    },
    getPriority: (input) => {
      const toolCount = input.currentTools.filter((t) => t !== "none").length;
      return toolCount >= 6 ? "high" : "medium";
    },
  },

  // ─── Time Tracking ───
  {
    frictionArea: "time_tracking",
    category: "time_tracking",
    title: "Implement proper time tracking",
    getProblem: () => {
      return "Without tracking your time, you can't accurately price projects, identify where hours disappear, or prove value to clients. Most freelancers and small teams underestimate admin time by 30-50%.";
    },
    getSolution: (input) => {
      if (input.role === "freelancer") {
        return "Start tracking every working hour with a one-click timer. Categorize time by client and project. After 2 weeks of data, you'll see exactly where your time goes and can adjust pricing, eliminate time sinks, and set realistic deadlines.";
      }
      return "Roll out time tracking across the team with clear categories. Use reports to identify bottlenecks, balance workloads, and improve project estimates. The goal isn't surveillance — it's visibility.";
    },
    getImpact: () => "Better pricing + ~2 hours/week saved on estimates",
    getTools: () => {
      return toolsDatabase.filter((t) => ["toggl", "harvest"].includes(t.slug));
    },
    getPriority: (input) => input.role === "freelancer" ? "high" : "medium",
  },

  // ─── Invoicing ───
  {
    frictionArea: "invoicing",
    category: "invoicing",
    title: "Automate your invoicing and billing",
    getProblem: () => {
      return "Manual invoicing leads to late invoices, missed payments, and hours spent on admin work that should be automated. Every day an invoice is late costs you cash flow.";
    },
    getSolution: () => {
      return "Set up automated invoicing triggered by project milestones or recurring schedules. Connect it to your time tracking so billable hours flow directly into invoices. Enable online payments to reduce collection time from weeks to days.";
    },
    getImpact: () => "~2 hours/week saved + faster payments",
    getTools: () => {
      return toolsDatabase.filter((t) => ["freshbooks", "quickbooks", "harvest"].includes(t.slug));
    },
    getPriority: () => "medium",
  },

  // ─── Focus ───
  {
    frictionArea: "focus",
    category: "productivity",
    title: "Reduce interruptions and protect deep work",
    getProblem: () => {
      return "Constant notifications, open office chats, and unstructured days are killing your ability to do focused work. Research shows it takes 23 minutes to refocus after each interruption.";
    },
    getSolution: () => {
      return "Implement time blocking: schedule 2-3 hour deep work blocks with notifications off. Use async communication tools for non-urgent messages. Set 'office hours' for real-time availability. Batch similar tasks (all emails at 10am and 3pm, all meetings on Tuesdays and Thursdays).";
    },
    getImpact: () => "~4-6 hours/week of recovered deep work",
    getTools: () => {
      return toolsDatabase.filter((t) => ["loom", "calendly"].includes(t.slug));
    },
    getPriority: () => "medium",
  },

  // ─── File Management ───
  {
    frictionArea: "file_management",
    category: "file_management",
    title: "Organize your files and documents",
    getProblem: () => {
      return "Document chaos — files scattered across local drives, email attachments, multiple cloud services, and desktop folders. You waste time searching for files and risk working on outdated versions.";
    },
    getSolution: () => {
      return "Centralize all files in one cloud platform with a clear folder structure: Client/Project/Phase. Use naming conventions (YYYY-MM-DD_ClientName_Document_v1). Set up your project management tool to link directly to relevant files so everything is findable from your task board.";
    },
    getImpact: () => "~2-3 hours/week saved on file searching",
    getTools: () => {
      return toolsDatabase.filter((t) => ["notion", "clickup"].includes(t.slug));
    },
    getPriority: () => "medium",
  },

  // ─── Remote Setup ───
  {
    frictionArea: "remote_setup",
    category: "remote_setup",
    title: "Optimize your remote work environment",
    getProblem: () => {
      return "A poor remote work setup — bad ergonomics, unreliable tech, or a distracting environment — quietly drains productivity. Physical workspace quality directly impacts focus, energy, and output quality.";
    },
    getSolution: () => {
      return "Start with the basics: a proper laptop stand or external monitor at eye height, a quality webcam and microphone for meetings, and a dedicated workspace. Then optimize your digital setup: a reliable internet backup plan, proper lighting for video calls, and a noise management strategy.";
    },
    getImpact: () => "Significant long-term productivity and health improvement",
    getTools: () => {
      return toolsDatabase.filter((t) => ["loom", "calendly"].includes(t.slug));
    },
    getPriority: () => "low",
  },

  // ─── Email Marketing (always added for solopreneurs) ───
  {
    frictionArea: "_always",
    category: "email_marketing",
    title: "Build an email marketing foundation",
    getProblem: () => {
      return "Without an email list, you're dependent on platforms you don't control for client acquisition. Email is the highest-ROI marketing channel and the only audience you truly own.";
    },
    getSolution: () => {
      return "Set up an email platform with a simple lead magnet (checklist, template, or free resource related to your expertise). Create a 5-email welcome sequence that builds trust and positions your services. Even sending one valuable email per week compounds into a powerful client acquisition channel.";
    },
    getImpact: () => "Long-term client acquisition + recurring revenue potential",
    getTools: () => {
      return toolsDatabase.filter((t) => ["convertkit", "activecampaign"].includes(t.slug));
    },
    getPriority: () => "low",
  },

  // ─── Scheduling (always added for consultants/freelancers) ───
  {
    frictionArea: "_always_scheduling",
    category: "scheduling",
    title: "Automate your scheduling",
    getProblem: () => {
      return "Every meeting requires 3-5 back-and-forth emails to find a time. Multiply that by 10+ meetings per week and you're spending hours just scheduling.";
    },
    getSolution: () => {
      return "Set up a booking link with your availability rules. Share it in your email signature, website, and proposals. Add buffer time between meetings automatically. Use different meeting types (15-min intro, 30-min check-in, 60-min deep dive) with appropriate durations.";
    },
    getImpact: () => "~1-2 hours/week saved on scheduling",
    getTools: () => {
      return toolsDatabase.filter((t) => t.slug === "calendly");
    },
    getPriority: () => "medium",
  },
];

export function generateRecommendations(input: DiagnosticInput): RecommendationOutput[] {
  const recommendations: RecommendationOutput[] = [];

  // Process friction-area-based rules
  for (const rule of problemRules) {
    const shouldInclude =
      rule.frictionArea.startsWith("_")
        ? (rule.frictionArea === "_always" && (input.role === "solopreneur" || input.role === "freelancer")) ||
          (rule.frictionArea === "_always_scheduling" && (input.role === "freelancer" || input.industry === "consulting"))
        : input.frictionAreas.includes(rule.frictionArea);

    if (shouldInclude) {
      recommendations.push({
        priority: rule.getPriority(input),
        category: rule.category,
        title: rule.title,
        problem: rule.getProblem(input),
        solution: rule.getSolution(input),
        impact: rule.getImpact(input),
        tools: rule.getTools(input),
        isPremium: false,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Mark items beyond the first 3 as premium
  recommendations.forEach((rec, i) => {
    if (i >= 3) rec.isPremium = true;
  });

  return recommendations;
}

export function calculateHealthScore(input: DiagnosticInput): number {
  let score = 100;

  // Deduct for each friction area
  score -= input.frictionAreas.length * 8;

  // Deduct for low productivity self-assessment
  score -= (5 - input.productivityScore) * 6;

  // Deduct for tool fragmentation
  const toolCount = input.currentTools.filter((t) => t !== "none").length;
  if (toolCount > 8) score -= 15;
  else if (toolCount > 5) score -= 8;
  else if (toolCount === 0) score -= 10;

  // Deduct for no automation tools
  const hasAutomation = input.currentTools.some((t) => ["zapier", "make"].includes(t));
  if (!hasAutomation && input.frictionAreas.includes("automation")) score -= 10;

  // Deduct for no CRM when doing client work
  const hasCRM = input.currentTools.some((t) => ["hubspot", "pipedrive"].includes(t));
  if (!hasCRM && input.frictionAreas.includes("client_work")) score -= 8;

  return Math.max(10, Math.min(100, score));
}
