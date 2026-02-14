import { toolsDatabase, type ToolData } from "@/data/tools";
import { getToolTips } from "@/data/tool-tips";

export interface DiagnosticInput {
  role: string;
  industry: string;
  teamSize: string;
  workEnvironment: string;
  productivityScore: number;
  moraleScore?: number;
  frictionAreas: string[];
  currentTools: string[];
  goals?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detailedAnswers: Record<string, any>;
}

export interface ToolOptimization {
  toolSlug: string;
  toolName: string;
  generalTips: string[];
  premiumTips: string[];
  premiumSummary: string;
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
  toolOptimizations?: ToolOptimization[];
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

  // ─── Team Morale ───
  {
    frictionArea: "morale",
    category: "team_morale",
    title: "Address team morale and prevent burnout",
    getProblem: (input) => {
      const details = input.detailedAnswers.morale_detail;
      const moraleIssues = Array.isArray(details) ? details : [];
      const issueLabels: Record<string, string> = {
        burnout: "burnout and overwork",
        unclear_roles: "unclear roles and ownership",
        no_recognition: "lack of recognition",
        no_growth: "limited growth opportunities",
        poor_leadership: "leadership gaps",
        isolation: "team isolation and disconnection",
        micromanagement: "micromanagement",
        toxic_culture: "negative workplace culture",
      };
      if (moraleIssues.length > 0) {
        const named = moraleIssues.slice(0, 3).map((i) => issueLabels[i] || i).join(", ");
        return `Your team is experiencing low morale driven by ${named}. This isn't just a "soft" problem — low morale directly reduces output quality, increases turnover risk, and makes every other workflow problem harder to fix. Teams with low morale are 18% less productive and 3x more likely to lose key people.`;
      }
      return "Your team morale is low, which silently undermines every other part of your workflow. Disengaged teams produce lower quality work, miss more deadlines, and resist adopting new processes — making it harder to fix the other issues in your diagnosis.";
    },
    getSolution: (input) => {
      const details = input.detailedAnswers.morale_detail;
      const moraleIssues = Array.isArray(details) ? details : [];
      const solutions: string[] = [];

      if (moraleIssues.includes("burnout")) {
        solutions.push("Implement 'No Meeting Wednesdays' and enforce a hard stop time. Burnout usually comes from lack of recovery, not too much work. Build buffer days into project timelines so deadlines don't require overtime.");
      }
      if (moraleIssues.includes("unclear_roles")) {
        solutions.push("Create a simple RACI chart (Responsible, Accountable, Consulted, Informed) for your top 5 recurring processes. When everyone knows their role, friction drops and ownership increases.");
      }
      if (moraleIssues.includes("no_recognition")) {
        solutions.push("Start a weekly 'wins' ritual — 5 minutes at the start of a meeting where people share one thing they're proud of from the past week. Small consistent recognition compounds into strong team culture.");
      }
      if (moraleIssues.includes("no_growth")) {
        solutions.push("Dedicate 10% of work hours to learning and growth. This could be a 'Learning Friday' afternoon, a conference budget, or rotating team members through different project roles.");
      }
      if (moraleIssues.includes("poor_leadership")) {
        solutions.push("Establish a weekly leadership cadence: Monday planning (15 min), Wednesday check-in (10 min), Friday retro (15 min). Consistency from leadership creates psychological safety for the team.");
      }
      if (moraleIssues.includes("isolation")) {
        solutions.push("Create informal connection rituals: virtual coffee chats, a non-work Slack channel, or monthly team events. For remote teams, consider a quarterly in-person meetup — even one day together builds months of goodwill.");
      }
      if (moraleIssues.includes("micromanagement")) {
        solutions.push("Shift from task-level oversight to outcome-based management. Define clear deliverables and deadlines, then give your team autonomy on how they get there. Trust is the highest-leverage management tool.");
      }
      if (moraleIssues.includes("toxic_culture")) {
        solutions.push("Start with psychological safety: run anonymous team pulse surveys monthly, address issues transparently, and model vulnerability from the top. Replace blame-focused post-mortems with 'what can we learn' retrospectives.");
      }

      if (solutions.length === 0) {
        solutions.push("Start with a simple anonymous pulse survey to understand what's actually driving low morale. Then pick the top issue and address it visibly within 2 weeks. Quick action builds trust faster than a perfect plan.");
      }

      return solutions.join("\n\n");
    },
    getImpact: (input) => {
      const moraleScore = input.moraleScore || 3;
      if (moraleScore <= 2) return "Critical — addresses burnout risk, ~15-25% productivity recovery";
      return "High — improved engagement, retention, and team output quality";
    },
    getTools: () => [],
    getPriority: (input) => {
      const moraleScore = input.moraleScore || 3;
      return moraleScore <= 2 ? "high" : "medium";
    },
  },

  // ─── Internal Operations (always added for teams) ───
  {
    frictionArea: "_always_team_ops",
    category: "internal_ops",
    title: "Strengthen your internal operations",
    getProblem: (input) => {
      if (input.teamSize === "small") {
        return "Small teams often skip internal structure because 'everyone just knows what's going on.' But as you grow even slightly, tribal knowledge becomes a bottleneck. Undocumented processes, unclear decision-making, and reactive management are silently limiting your capacity.";
      }
      if (input.teamSize === "medium" || input.teamSize === "larger") {
        return "At your team size, informal processes start breaking down. Information doesn't flow naturally anymore, decisions take too long, and new hires take weeks to become productive. You need lightweight systems that create clarity without bureaucracy.";
      }
      return "Your internal operations could benefit from more structure. Without clear processes, you're relying on memory and improvisation, which limits your ability to grow, delegate, or take time off.";
    },
    getSolution: (input) => {
      if (input.teamSize === "small") {
        return "Document your top 5 recurring processes as simple checklists (not novels). Set up a weekly 15-minute team sync with a fixed agenda: wins, blockers, priorities. Create a shared decision log so nothing gets lost. These three things take 2 hours to set up and save dozens of hours per month.";
      }
      return "Build a lightweight operating system: (1) Weekly team sync with a written agenda and action items, (2) Monthly retrospective to surface what's working and what isn't, (3) A living 'How We Work' doc covering decision-making, communication norms, and escalation paths. Keep it simple — a one-page doc beats a 50-page handbook that nobody reads.";
    },
    getImpact: () => "Better team alignment, faster onboarding, and reduced management overhead",
    getTools: () => [],
    getPriority: () => "medium",
  },

  // ─── Personal Sustainability (always added for solopreneurs/freelancers) ───
  {
    frictionArea: "_always_sustainability",
    category: "sustainability",
    title: "Build a sustainable work rhythm",
    getProblem: (input) => {
      const moraleScore = input.moraleScore || 3;
      if (moraleScore <= 2) {
        return "Your self-rated morale is critically low. For solo operators, this is a red flag — there's no team to pick up slack if you burn out. Without boundaries and recovery rituals, you're heading toward a crash that could sideline your business for weeks.";
      }
      return "As a solo operator, your energy IS your business. Without intentional recovery and boundary-setting, the always-on nature of freelance/solo work gradually erodes your output quality, creativity, and motivation.";
    },
    getSolution: () => {
      return "Build three non-negotiable boundaries: (1) A hard start and stop time — protect your evenings like you'd protect a client meeting. (2) One full day off per week with zero work communication. (3) A quarterly 'CEO Day' where you step back from delivery work and review your business strategy, finances, and personal goals. Also consider batching client work into 3-4 focused days and keeping 1-2 days for admin, growth, and recovery.";
    },
    getImpact: () => "Sustained productivity, better work quality, and long-term business health",
    getTools: () => [],
    getPriority: (input) => {
      const moraleScore = input.moraleScore || 3;
      return moraleScore <= 2 ? "high" : "low";
    },
  },

  // ─── Business Finances ───
  {
    frictionArea: "finances",
    category: "business_finances",
    title: "Get your business finances under control",
    getProblem: (input) => {
      const details = input.detailedAnswers.finance_detail;
      const issues = Array.isArray(details) ? details : [];
      const issueLabels: Record<string, string> = {
        cash_flow: "cash flow gaps from inconsistent income and slow-paying clients",
        no_business_banking: "mixing personal and business finances, making it impossible to see true business profitability",
        need_credit: "limited access to business credit or funding when you need capital for growth",
        bookkeeping_mess: "disorganized bookkeeping that leaves you blind to your real financial position",
        expense_tracking: "no clear system for tracking expenses, leading to missed deductions and budget surprises",
        tax_prep: "chaotic tax preparation that costs you time, stress, and potentially money in missed deductions",
      };
      if (issues.length > 0) {
        const named = issues.slice(0, 3).map((i) => issueLabels[i] || i).join("; ");
        return `Your business finances need attention: ${named}. Financial disorganization doesn't just cost money — it creates constant low-level stress that affects every other part of your work.`;
      }
      return "Your business finances lack the structure needed to make confident decisions. Without clear financial systems, you're guessing at profitability, missing deductions, and making growth decisions without real data.";
    },
    getSolution: (input) => {
      const details = input.detailedAnswers.finance_detail;
      const issues = Array.isArray(details) ? details : [];
      const solutions: string[] = [];

      if (issues.includes("no_business_banking") || issues.includes("expense_tracking")) {
        solutions.push("Open a dedicated business bank account immediately — this is step one for every freelancer and business owner. Modern no-fee business banking platforms let you create multiple accounts for different purposes (operating, taxes, savings) so money is automatically organized.");
      }
      if (issues.includes("cash_flow") || issues.includes("need_credit")) {
        solutions.push("Set up a business line of credit BEFORE you desperately need one. Having access to credit smooths out cash flow gaps between projects. Also consider invoice financing — you can get paid on outstanding invoices within 24 hours instead of waiting 30-60 days.");
      }
      if (issues.includes("bookkeeping_mess") || issues.includes("tax_prep")) {
        solutions.push("Either automate your bookkeeping with software that connects to your bank, or hire a done-for-you bookkeeping service. The cost pays for itself in saved time, reduced tax-season stress, and deductions you'd otherwise miss. Most freelancers miss $5K-15K in deductions annually.");
      }
      if (issues.includes("expense_tracking")) {
        solutions.push("Get a business credit card with built-in expense categorization and accounting integrations. Every purchase is automatically tracked, categorized, and synced to your books — no more shoebox of receipts.");
      }

      if (solutions.length === 0) {
        solutions.push("Start with the financial fundamentals: (1) Separate business and personal banking, (2) Set up a 'profit first' system where you automatically set aside taxes and profit before spending, (3) Connect your bank to accounting software for automatic transaction categorization. These three steps give you financial clarity within 30 days.");
      }

      return solutions.join("\n\n");
    },
    getImpact: (input) => {
      const details = input.detailedAnswers.finance_detail;
      const issues = Array.isArray(details) ? details : [];
      if (issues.includes("cash_flow") || issues.includes("need_credit")) {
        return "Improved cash flow stability + access to growth capital";
      }
      return "~3-5 hours/month saved on financial admin + better tax outcomes";
    },
    getTools: (input) => {
      const details = input.detailedAnswers.finance_detail;
      const issues = Array.isArray(details) ? details : [];
      const tools: ToolData[] = [];

      // Banking
      if (issues.includes("no_business_banking") || issues.includes("expense_tracking")) {
        const banking = toolsDatabase.filter((t) => t.category === "business_banking");
        if (input.role === "freelancer" || input.teamSize === "solo") {
          tools.push(...banking.filter((t) => ["relay", "novo"].includes(t.slug)));
        } else {
          tools.push(...banking.filter((t) => ["mercury", "bluevine"].includes(t.slug)));
        }
      }

      // Credit/Lending
      if (issues.includes("cash_flow") || issues.includes("need_credit")) {
        const lending = toolsDatabase.filter((t) => t.category === "business_lending" || t.category === "business_credit");
        if (input.teamSize === "solo" || input.role === "freelancer") {
          tools.push(...lending.filter((t) => ["fundbox"].includes(t.slug)));
        } else {
          tools.push(...lending.filter((t) => ["ramp", "brex", "kabbage"].includes(t.slug)));
        }
      }

      // Bookkeeping
      if (issues.includes("bookkeeping_mess") || issues.includes("tax_prep")) {
        const bookkeeping = toolsDatabase.filter((t) => t.category === "bookkeeping");
        tools.push(...bookkeeping);
        // Also recommend accounting software
        const accounting = toolsDatabase.filter((t) => ["freshbooks", "quickbooks"].includes(t.slug));
        tools.push(...accounting.filter((t) => !tools.some((existing) => existing.slug === t.slug)));
      }

      // Expense tracking via corporate cards
      if (issues.includes("expense_tracking") && !tools.some((t) => t.category === "business_credit")) {
        tools.push(...toolsDatabase.filter((t) => ["ramp"].includes(t.slug)));
      }

      // Default if nothing specific
      if (tools.length === 0) {
        tools.push(...toolsDatabase.filter((t) => ["relay", "freshbooks"].includes(t.slug)));
      }

      return tools.slice(0, 4);
    },
    getPriority: (input) => {
      const details = input.detailedAnswers.finance_detail;
      const issues = Array.isArray(details) ? details : [];
      if (issues.includes("cash_flow") || issues.includes("no_business_banking")) return "high";
      return "medium";
    },
  },

  // ─── Phone / Internet ───
  {
    frictionArea: "phone_internet",
    category: "phone_internet",
    title: "Upgrade your business phone and internet setup",
    getProblem: (input) => {
      const details = input.detailedAnswers.phone_internet_detail;
      const issues = Array.isArray(details) ? details : [];
      const issueLabels: Record<string, string> = {
        no_business_phone: "using your personal phone number for business, which looks unprofessional and means you can never truly 'clock out'",
        bad_internet: "dealing with unreliable internet that drops during client calls and slows down your work",
        high_phone_costs: "overpaying for phone and calling services that don't match your actual usage",
        need_call_system: "lacking a proper call system for sales or support — no routing, no tracking, no professional greeting",
        no_voicemail_pro: "missing calls and lacking professional voicemail management, which costs you leads and client trust",
      };
      if (issues.length > 0) {
        const named = issues.slice(0, 3).map((i) => issueLabels[i] || i).join("; ");
        return `Your phone and internet setup is hurting your business: ${named}. In a remote-first world, your connection and communication infrastructure are as important as your office used to be.`;
      }
      return "Your business communication infrastructure needs an upgrade. An unreliable connection or unprofessional phone setup silently costs you clients and credibility every week.";
    },
    getSolution: (input) => {
      const details = input.detailedAnswers.phone_internet_detail;
      const issues = Array.isArray(details) ? details : [];
      const solutions: string[] = [];

      if (issues.includes("no_business_phone") || issues.includes("no_voicemail_pro")) {
        solutions.push("Get a dedicated business phone number that works on your existing phone — no second device needed. Modern VoIP apps give you a professional number with custom greetings, call routing, voicemail transcription, and business hours settings so calls don't ring at midnight.");
      }
      if (issues.includes("bad_internet")) {
        solutions.push("If your cable/fiber is unreliable, add a backup connection. 5G business internet is now a viable primary or backup option in most areas — no technician visit needed, just plug in and go. For truly remote locations, satellite internet has gotten fast enough for video calls.");
      }
      if (issues.includes("need_call_system")) {
        solutions.push("Set up a proper business phone system with auto-attendant, call routing, and analytics. Modern VoIP platforms include CRM integration so every call is logged automatically, plus features like call recording, AI transcription, and real-time coaching for sales teams.");
      }
      if (issues.includes("high_phone_costs")) {
        solutions.push("Switch to a VoIP-based phone system — most businesses cut their phone bill by 40-60% compared to traditional carriers. Modern plans include unlimited calling, texting, and international rates that are a fraction of traditional carriers.");
      }

      if (solutions.length === 0) {
        solutions.push("Audit your current phone and internet setup. A dedicated business phone number (VoIP) costs as little as $15/month and instantly makes you look more professional. For internet, ensure you have a reliable primary connection and consider a backup for critical calls.");
      }

      return solutions.join("\n\n");
    },
    getImpact: (input) => {
      const details = input.detailedAnswers.phone_internet_detail;
      const issues = Array.isArray(details) ? details : [];
      if (issues.includes("bad_internet")) return "Eliminated dropped calls + reliable work connection";
      if (issues.includes("need_call_system")) return "Better call management + ~2-3 hours/week saved";
      return "Professional image + potential 40-60% savings on phone costs";
    },
    getTools: (input) => {
      const details = input.detailedAnswers.phone_internet_detail;
      const issues = Array.isArray(details) ? details : [];
      const tools: ToolData[] = [];

      // Phone services
      if (issues.includes("no_business_phone") || issues.includes("no_voicemail_pro") || issues.includes("high_phone_costs")) {
        if (input.teamSize === "solo" || input.role === "freelancer") {
          tools.push(...toolsDatabase.filter((t) => ["openphone", "grasshopper"].includes(t.slug)));
        } else {
          tools.push(...toolsDatabase.filter((t) => ["openphone", "ringcentral"].includes(t.slug)));
        }
      }

      // Call/sales system
      if (issues.includes("need_call_system")) {
        if (input.teamSize === "solo" || input.teamSize === "small") {
          tools.push(...toolsDatabase.filter((t) => ["dialpad", "openphone"].includes(t.slug)));
        } else {
          tools.push(...toolsDatabase.filter((t) => ["ringcentral", "nextiva", "dialpad"].includes(t.slug)));
        }
      }

      // Internet
      if (issues.includes("bad_internet")) {
        tools.push(...toolsDatabase.filter((t) => ["tmobile_business", "starlink_business"].includes(t.slug)));
      }

      // Dedupe
      const seen = new Set<string>();
      const unique = tools.filter((t) => {
        if (seen.has(t.slug)) return false;
        seen.add(t.slug);
        return true;
      });

      if (unique.length === 0) {
        return toolsDatabase.filter((t) => ["openphone", "grasshopper"].includes(t.slug));
      }

      return unique.slice(0, 4);
    },
    getPriority: (input) => {
      const details = input.detailedAnswers.phone_internet_detail;
      const issues = Array.isArray(details) ? details : [];
      if (issues.includes("bad_internet") || issues.includes("need_call_system")) return "high";
      return "medium";
    },
  },

  // ─── Payment Processing ───
  {
    frictionArea: "payments",
    category: "payment_processing",
    title: "Optimize your payment processing",
    getProblem: (input) => {
      const details = input.detailedAnswers.payments_detail;
      const issues = Array.isArray(details) ? details : [];
      const issueLabels: Record<string, string> = {
        high_fees: "you're losing too much revenue to processing fees — even a 0.5% difference adds up to thousands per year",
        slow_payouts: "waiting days to access your money, which creates unnecessary cash flow pressure",
        no_online_payments: "you can't accept online payments easily, which means friction for every client who wants to pay you",
        need_pos: "you need a way to accept card payments in person but don't have a reliable system",
        recurring_billing: "you're manually charging clients each month instead of automating recurring payments",
      };
      if (issues.length > 0) {
        const named = issues.slice(0, 3).map((i) => issueLabels[i] || i).join("; ");
        return `Your payment processing needs work: ${named}. Every barrier to getting paid costs you money — both in fees and in clients who give up or delay payment.`;
      }
      return "Your payment processing setup is either too expensive, too slow, or too limited. Modern payment platforms can save you money, speed up payouts, and make it easier for clients to pay you.";
    },
    getSolution: (input) => {
      const details = input.detailedAnswers.payments_detail;
      const issues = Array.isArray(details) ? details : [];
      const solutions: string[] = [];

      if (issues.includes("high_fees")) {
        solutions.push("Compare your current processing rates against interchange-plus pricing. Flat-rate processors (2.9% + $0.30) are simple but expensive at volume. If you process over $5K/month, switching to interchange-plus or a subscription-based processor can save you hundreds to thousands per year.");
      }
      if (issues.includes("no_online_payments") || issues.includes("recurring_billing")) {
        solutions.push("Set up an online payment platform that integrates with your invoicing. Enable payment links you can embed in emails and proposals so clients can pay in one click. For recurring clients, set up automatic billing so payments happen without either party thinking about it.");
      }
      if (issues.includes("need_pos")) {
        solutions.push("Get a modern POS system with a card reader that handles tap, chip, and swipe. Look for platforms that unify your in-person and online payments so all transactions flow into one dashboard and one set of reports.");
      }
      if (issues.includes("slow_payouts")) {
        solutions.push("Switch to a processor that offers next-day or instant payouts. Some platforms offer same-day deposits for a small fee — worth it when cash flow is tight. Also enable multiple payment methods (cards, bank transfer, digital wallets) to reduce payment delays from clients.");
      }

      if (solutions.length === 0) {
        solutions.push("Review your current payment processing fees and compare against modern options. Set up online payment links and recurring billing to reduce the time between 'work done' and 'money received.' The easier you make it to pay you, the faster you get paid.");
      }

      return solutions.join("\n\n");
    },
    getImpact: (input) => {
      const details = input.detailedAnswers.payments_detail;
      const issues = Array.isArray(details) ? details : [];
      if (issues.includes("high_fees")) return "Potential savings of $500-5,000+/year on processing fees";
      if (issues.includes("no_online_payments")) return "Faster payments + ~2 hours/week saved on payment admin";
      return "Faster payouts + reduced payment friction";
    },
    getTools: (input) => {
      const details = input.detailedAnswers.payments_detail;
      const issues = Array.isArray(details) ? details : [];
      const tools: ToolData[] = [];

      if (issues.includes("need_pos")) {
        tools.push(...toolsDatabase.filter((t) => ["square", "helcim"].includes(t.slug)));
      }

      if (issues.includes("high_fees")) {
        tools.push(...toolsDatabase.filter((t) => ["helcim", "fattmerchant"].includes(t.slug)));
      }

      if (issues.includes("no_online_payments") || issues.includes("recurring_billing")) {
        if (input.industry === "development" || input.industry === "ecommerce") {
          tools.push(...toolsDatabase.filter((t) => ["stripe", "helcim"].includes(t.slug)));
        } else {
          tools.push(...toolsDatabase.filter((t) => ["square", "stripe", "paypal_business"].includes(t.slug)));
        }
      }

      if (issues.includes("slow_payouts")) {
        tools.push(...toolsDatabase.filter((t) => ["square", "stripe"].includes(t.slug)));
      }

      // Dedupe
      const seen = new Set<string>();
      const unique = tools.filter((t) => {
        if (seen.has(t.slug)) return false;
        seen.add(t.slug);
        return true;
      });

      if (unique.length === 0) {
        return toolsDatabase.filter((t) => ["stripe", "square"].includes(t.slug));
      }

      return unique.slice(0, 4);
    },
    getPriority: (input) => {
      const details = input.detailedAnswers.payments_detail;
      const issues = Array.isArray(details) ? details : [];
      if (issues.includes("high_fees") || issues.includes("no_online_payments")) return "high";
      return "medium";
    },
  },

  // ─── Business Banking (always for solopreneurs/freelancers without finance friction) ───
  {
    frictionArea: "_always_finance",
    category: "business_banking_tip",
    title: "Separate and optimize your business banking",
    getProblem: () => {
      return "Many freelancers and small business owners still mix personal and business finances, or use traditional banks with high fees and no integrations. This makes tax prep harder, hides your true profitability, and costs you in fees and lost interest.";
    },
    getSolution: () => {
      return "Switch to a modern, no-fee business banking platform that integrates with your accounting software. Set up automatic transfers: when income hits, immediately move 25-30% to a tax reserve account and 10% to profit. This 'profit first' approach ensures you always know your real available cash and never get surprised at tax time.";
    },
    getImpact: () => "Better financial clarity + potential savings on fees and tax prep",
    getTools: (input) => {
      if (input.teamSize === "solo" || input.role === "freelancer") {
        return toolsDatabase.filter((t) => ["relay", "novo"].includes(t.slug));
      }
      return toolsDatabase.filter((t) => ["mercury", "relay"].includes(t.slug));
    },
    getPriority: () => "low",
  },

  // ─── Sales / Lead Generation ───
  {
    frictionArea: "sales_leads",
    category: "sales_leads",
    title: "Build a reliable sales and lead generation system",
    getProblem: (input) => {
      const detail = input.detailedAnswers.sales_leads_detail;
      const problems: Record<string, string> = {
        no_pipeline: "Leads are coming in but you have no structured pipeline to track them. Without a system, promising prospects fall through the cracks and revenue opportunities vanish silently.",
        not_enough_leads: "You're struggling to generate enough leads to sustain or grow your business. Without a repeatable lead generation strategy, income stays unpredictable and growth stalls.",
        bad_follow_up: "Leads go cold because follow-up is manual and inconsistent. Research shows 80% of sales require 5+ follow-ups, but most people give up after 1-2 — leaving money on the table every week.",
        no_crm: "You're tracking prospects in spreadsheets, sticky notes, or your head. Without a proper CRM, you lose context on conversations, forget follow-ups, and can't see your sales pipeline at a glance.",
      };
      return problems[detail] || "Your sales and lead generation process lacks the structure needed to consistently convert prospects into clients. Without a system, revenue stays unpredictable.";
    },
    getSolution: (input) => {
      const detail = input.detailedAnswers.sales_leads_detail;
      if (detail === "not_enough_leads") {
        return "Build a simple lead generation engine: (1) Create a valuable lead magnet (checklist, template, or free tool), (2) Set up a landing page with email capture, (3) Share it consistently on 1-2 channels where your ideal clients hang out, (4) Nurture leads with a 5-email welcome sequence. Focus on one channel and master it before expanding.";
      }
      if (detail === "bad_follow_up") {
        return "Automate your follow-up sequence so it happens without you thinking about it. Set up a CRM with automatic reminders at day 1, 3, 7, 14, and 30 after first contact. Create email templates for each touchpoint so following up takes 30 seconds instead of 10 minutes.";
      }
      if (input.role === "freelancer" || input.teamSize === "solo") {
        return "Set up a lightweight CRM to track every prospect from first contact to close. Create a simple pipeline: Lead → Contacted → Proposal Sent → Negotiating → Won/Lost. Even tracking 3-4 fields (name, status, next action, follow-up date) transforms your sales from reactive to systematic.";
      }
      return "Implement a sales CRM with pipeline stages that match your sales process. Automate lead capture from your website, set up follow-up sequences, and create a weekly pipeline review ritual. The goal is that no lead ever gets forgotten and every prospect has a clear next step.";
    },
    getImpact: () => "More consistent revenue + 20-40% better lead conversion",
    getTools: (input) => {
      if (input.industry === "marketing" || input.industry === "consulting") {
        return toolsDatabase.filter((t) => ["gohighlevel", "pipedrive"].includes(t.slug));
      }
      if (input.role === "freelancer" || input.teamSize === "solo") {
        return toolsDatabase.filter((t) => ["pipedrive", "hubspot"].includes(t.slug));
      }
      return toolsDatabase.filter((t) => ["hubspot", "pipedrive", "gohighlevel"].includes(t.slug));
    },
    getPriority: (input) => {
      const detail = input.detailedAnswers.sales_leads_detail;
      return detail === "not_enough_leads" || detail === "no_pipeline" ? "high" : "medium";
    },
  },

  // ─── Hiring / Delegation ───
  {
    frictionArea: "hiring_delegation",
    category: "hiring_delegation",
    title: "Build a system for hiring and delegation",
    getProblem: (input) => {
      const detail = input.detailedAnswers.hiring_detail;
      const problems: Record<string, string> = {
        cant_find_talent: "You're struggling to find reliable people to help. Without a sourcing strategy, you waste hours on bad fits and end up doing everything yourself — which is the real bottleneck.",
        afraid_to_delegate: "You know you need help but can't let go. The fear of 'they won't do it as well as me' keeps you doing $15/hour tasks when your time is worth 10x that. This is the #1 growth ceiling for solopreneurs.",
        no_budget: "You feel you can't afford help, but the math usually says otherwise. If you spend 10 hours/week on tasks worth $20/hour, that's $800/month in low-value work. Hiring a VA for $500/month gives you 10 hours back for higher-value activities.",
        no_process: "You don't have a clear system for what to delegate or how. Without documented processes and clear handoff procedures, delegation feels chaotic and unreliable.",
      };
      return problems[detail] || "You're carrying too much yourself because you lack a reliable system for finding help and delegating effectively. This limits your growth and leads to burnout.";
    },
    getSolution: (input) => {
      const detail = input.detailedAnswers.hiring_detail;
      if (detail === "afraid_to_delegate") {
        return "Start with the 'delegation ladder': (1) List every task you did this week, (2) Sort by value — what only YOU can do vs. what anyone trained could do, (3) Pick the 3 lowest-value recurring tasks, (4) Document each as a simple checklist with screenshots, (5) Hand them off one at a time with a 2-week training period. Start small, build trust, then expand.";
      }
      if (detail === "no_budget") {
        return "Start with project-based freelancers instead of full-time hires. Platforms like Upwork or Fiverr let you hire for specific tasks starting at $5-15/hour. Calculate your effective hourly rate, then outsource anything that costs less than half that rate. Reinvest the freed time into revenue-generating activities.";
      }
      if (detail === "cant_find_talent") {
        return "Create a hiring template: write a clear job description with specific deliverables (not vague requirements), post on 2-3 platforms, give a small paid test project before committing. For ongoing work, build a bench of 2-3 reliable freelancers so you're never dependent on one person.";
      }
      return "Document your top 5 repeatable processes as step-by-step checklists with screenshots. Use screen recording to create training videos for each. This 'delegation playbook' means anyone you hire can start producing quality work within days, not weeks.";
    },
    getImpact: () => "~10-15 hours/week freed up for higher-value work",
    getTools: (input) => {
      const tools: ToolData[] = [];
      // Project management for delegation
      if (input.teamSize === "solo" || input.role === "freelancer") {
        tools.push(...toolsDatabase.filter((t) => ["clickup", "notion"].includes(t.slug)));
      } else {
        tools.push(...toolsDatabase.filter((t) => ["clickup", "monday"].includes(t.slug)));
      }
      // Loom for training videos
      const loom = toolsDatabase.find((t) => t.slug === "loom");
      if (loom) tools.push(loom);
      return tools.slice(0, 3);
    },
    getPriority: (input) => {
      const detail = input.detailedAnswers.hiring_detail;
      return detail === "afraid_to_delegate" || detail === "cant_find_talent" ? "high" : "medium";
    },
  },

  // ─── Training / Onboarding ───
  {
    frictionArea: "training_onboarding",
    category: "training_onboarding",
    title: "Systematize your training and onboarding",
    getProblem: (input) => {
      const detail = input.detailedAnswers.training_detail;
      const problems: Record<string, string> = {
        no_documentation: "Nothing is documented — all your processes live in people's heads. When someone leaves or goes on vacation, critical knowledge walks out the door. Every new hire requires weeks of hand-holding because there's nothing to reference.",
        takes_too_long: "New people take far too long to become productive. Without a structured onboarding path, they're stuck asking questions, making avoidable mistakes, and waiting for guidance. This drains your time and theirs.",
        inconsistent_quality: "Everyone does things differently because there are no standards. This creates inconsistent client experiences, rework, and frustration. Quality depends on who does the work rather than the process.",
        high_turnover: "People leave before they're fully trained, creating a costly revolving door. Poor onboarding is the #1 reason for early turnover — people who feel lost and unsupported don't stick around.",
      };
      return problems[detail] || "Your training and onboarding process is inefficient. Without documented procedures and structured learning paths, every new person costs you weeks of lost productivity.";
    },
    getSolution: (input) => {
      const detail = input.detailedAnswers.training_detail;
      if (detail === "no_documentation") {
        return "Start a 'document as you work' habit. For your next 10 tasks, record a quick Loom video while you do them. Then convert each into a simple checklist. Store everything in a 'Playbook' wiki (Notion works great for this). In 2 weeks you'll have documented your core processes without any extra effort.";
      }
      if (detail === "high_turnover") {
        return "Create a structured 30-60-90 day onboarding plan: Week 1 is orientation and culture, Weeks 2-4 are core skills with mentorship, Month 2 is independent work with check-ins, Month 3 is full autonomy with performance review. Add regular 1-on-1s and a buddy system. People stay when they feel invested in.";
      }
      if (input.teamSize === "solo") {
        return "Build a contractor onboarding kit: a welcome document explaining how you work, standard operating procedures (SOPs) for their tasks, links to all relevant tools and logins, and a FAQ. This turns a 2-week ramp-up into a 2-day one. Use screen recordings for anything visual.";
      }
      return "Create a centralized knowledge base with SOPs for every recurring process. Use a template for each SOP: what it is, when to use it, step-by-step instructions, common mistakes, and who to ask for help. Pair this with a structured onboarding checklist that guides new hires through their first 30 days.";
    },
    getImpact: () => "50-70% faster onboarding + consistent quality output",
    getTools: () => {
      const tools: ToolData[] = [];
      // Notion for knowledge base
      tools.push(...toolsDatabase.filter((t) => ["notion", "loom"].includes(t.slug)));
      return tools;
    },
    getPriority: (input) => {
      const detail = input.detailedAnswers.training_detail;
      return detail === "no_documentation" || detail === "high_turnover" ? "high" : "medium";
    },
  },

  // ─── Security / Privacy ───
  {
    frictionArea: "security_privacy",
    category: "security_privacy",
    title: "Strengthen your security and privacy practices",
    getProblem: () => {
      return "Your business data and client information may be at risk. Weak passwords, shared logins, no backups, and unsecured communication are common in small businesses — and a single breach can cost you your reputation and thousands in damages. 43% of cyberattacks target small businesses.";
    },
    getSolution: (input) => {
      if (input.teamSize === "solo") {
        return "Implement the security basics: (1) Use a password manager for unique, strong passwords on every account, (2) Enable two-factor authentication on all critical tools — email, banking, and cloud storage, (3) Set up automated cloud backups for your important files, (4) Use a VPN when working on public Wi-Fi. These 4 steps eliminate 90% of common vulnerabilities in under an hour.";
      }
      return "Roll out team security essentials: (1) Deploy a password manager with shared vaults for team credentials — no more passwords in Slack or spreadsheets, (2) Mandate 2FA on all business tools, (3) Set up automated backups with versioning, (4) Create an offboarding checklist that revokes access within 24 hours when someone leaves. Review access permissions quarterly.";
    },
    getImpact: () => "Risk reduction + client trust + compliance readiness",
    getTools: () => {
      return toolsDatabase.filter((t) => ["notion"].includes(t.slug)).slice(0, 1);
    },
    getPriority: () => "medium",
  },

  // ─── Scaling / Growth ───
  {
    frictionArea: "scaling",
    category: "scaling",
    title: "Remove bottlenecks and build systems that scale",
    getProblem: (input) => {
      const detail = input.detailedAnswers.scaling_detail;
      const problems: Record<string, string> = {
        bottleneck_me: "Everything runs through you — every decision, every client touchpoint, every approval. You ARE the bottleneck. This means your business can only grow as fast as your personal bandwidth allows, and taking a vacation would shut everything down.",
        systems_breaking: "The systems that worked when you had 5 clients or 3 team members are breaking at your current size. Manual processes, verbal agreements, and ad-hoc communication don't scale — they create chaos that compounds with growth.",
        cant_take_more: "You're at capacity but turning away work. Without systems to increase throughput, growing means either working more hours (unsustainable) or cloning yourself (impossible). The answer is systemization and delegation.",
        no_recurring_revenue: "Your income resets to zero each month. Without recurring revenue streams, you're always hustling for the next project. This creates feast-or-famine cycles that make growth feel impossible and financial planning a guessing game.",
      };
      return problems[detail] || "Your business is hitting a growth ceiling. The way you work now doesn't support the scale you want — processes that worked before are becoming bottlenecks.";
    },
    getSolution: (input) => {
      const detail = input.detailedAnswers.scaling_detail;
      if (detail === "bottleneck_me") {
        return "Apply the 'Only I Can Do' filter to every task this week. Sort your work into 3 buckets: (1) Only I can do this (strategy, key client relationships), (2) Someone could do this with training (most delivery work), (3) Anyone could do this (admin, scheduling, data entry). Start delegating bucket 3 immediately and build SOPs for bucket 2. Your goal: spend 80% of time on bucket 1 within 90 days.";
      }
      if (detail === "no_recurring_revenue") {
        return "Design a recurring revenue offer: retainer packages, monthly subscriptions, maintenance plans, or membership programs. Even converting 20% of one-time clients to a $200-500/month retainer creates predictable baseline revenue. Start by offering your 5 best past clients a monthly package.";
      }
      if (detail === "cant_take_more") {
        return "Increase throughput without increasing hours: (1) Template and automate your most common deliverables, (2) Create a referral system with trusted partners for overflow work, (3) Hire a part-time specialist for your most time-consuming task, (4) Raise prices by 15-20% — some clients will leave but you'll earn more from fewer projects with less stress.";
      }
      return "Audit your current processes for manual steps that break at scale. Replace them with automated workflows, documented procedures, and clear ownership. Build a dashboard that shows your key business metrics so you can spot problems before they become crises.";
    },
    getImpact: (input) => {
      const detail = input.detailedAnswers.scaling_detail;
      if (detail === "no_recurring_revenue") return "Predictable monthly revenue + reduced hustle";
      if (detail === "bottleneck_me") return "10-20 hours/week freed from low-value tasks";
      return "Increased capacity without increased hours";
    },
    getTools: (input) => {
      const tools: ToolData[] = [];
      if (input.teamSize === "solo" || input.role === "freelancer") {
        tools.push(...toolsDatabase.filter((t) => ["clickup", "zapier"].includes(t.slug)));
      } else {
        tools.push(...toolsDatabase.filter((t) => ["clickup", "monday", "make"].includes(t.slug)));
      }
      return tools.slice(0, 3);
    },
    getPriority: (input) => {
      const detail = input.detailedAnswers.scaling_detail;
      return detail === "bottleneck_me" || detail === "systems_breaking" ? "high" : "medium";
    },
  },

  // ─── Marketing / Visibility ───
  {
    frictionArea: "marketing",
    category: "marketing_visibility",
    title: "Increase your marketing and online visibility",
    getProblem: () => {
      return "Your business isn't getting enough exposure. Without a consistent marketing strategy, you're relying on referrals and word of mouth — which is great but unpredictable. You need a system that generates awareness and inbound interest even when you're not actively networking.";
    },
    getSolution: (input) => {
      if (input.role === "freelancer" || input.role === "solopreneur") {
        return "Build a simple content engine: pick one platform where your ideal clients spend time (LinkedIn, Instagram, YouTube, etc.) and commit to posting 3x per week for 90 days. Share case studies, tips, and behind-the-scenes of your work. Pair this with an email newsletter to capture and nurture your audience. Consistency beats perfection — a decent post published beats a perfect post in drafts.";
      }
      return "Create a marketing system, not just campaigns: (1) Define your ideal client profile clearly, (2) Build a content calendar with weekly themes, (3) Set up email marketing with automated welcome and nurture sequences, (4) Track what generates actual leads (not just likes). Focus on 2 channels maximum until you've mastered them. Add marketing automation to turn one piece of content into multiple formats across platforms.";
    },
    getImpact: () => "Increased inbound leads + stronger brand presence",
    getTools: (input) => {
      const tools: ToolData[] = [];
      // Email marketing
      tools.push(...toolsDatabase.filter((t) => ["convertkit", "activecampaign"].includes(t.slug)));
      // CRM for lead capture
      if (input.industry === "marketing") {
        tools.push(...toolsDatabase.filter((t) => ["gohighlevel"].includes(t.slug)));
      }
      return tools.slice(0, 3);
    },
    getPriority: () => "medium",
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
          (rule.frictionArea === "_always_scheduling" && (input.role === "freelancer" || input.industry === "consulting")) ||
          (rule.frictionArea === "_always_team_ops" && input.teamSize !== "solo") ||
          (rule.frictionArea === "_always_sustainability" && (input.role === "solopreneur" || input.role === "freelancer")) ||
          (rule.frictionArea === "_always_finance" && (input.role === "solopreneur" || input.role === "freelancer" || input.role === "agency_owner") && !input.frictionAreas.includes("finances"))
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

  // Attach tool optimization tips when user already uses recommended tools
  for (const rec of recommendations) {
    const optimizations: ToolOptimization[] = [];
    for (const tool of rec.tools) {
      if (input.currentTools.includes(tool.slug)) {
        const tips = getToolTips(tool.slug);
        if (tips) {
          optimizations.push({
            toolSlug: tips.slug,
            toolName: tips.name,
            generalTips: tips.generalTips,
            premiumTips: tips.premiumTips,
            premiumSummary: tips.premiumSummary,
          });
        }
      }
    }
    // Also check for tools the user has that relate to this category
    for (const userTool of input.currentTools) {
      const toolData = toolsDatabase.find((t) => t.slug === userTool);
      if (
        toolData &&
        toolData.category === rec.category &&
        !optimizations.some((o) => o.toolSlug === userTool)
      ) {
        const tips = getToolTips(userTool);
        if (tips) {
          optimizations.push({
            toolSlug: tips.slug,
            toolName: tips.name,
            generalTips: tips.generalTips,
            premiumTips: tips.premiumTips,
            premiumSummary: tips.premiumSummary,
          });
        }
      }
    }
    if (optimizations.length > 0) {
      rec.toolOptimizations = optimizations;
    }
  }

  // Also generate standalone optimization recs for tools the user has that aren't covered above
  const coveredTools = new Set(
    recommendations.flatMap((r) => r.toolOptimizations?.map((o) => o.toolSlug) || [])
  );
  for (const userTool of input.currentTools) {
    if (coveredTools.has(userTool) || userTool === "none") continue;
    const tips = getToolTips(userTool);
    const toolData = toolsDatabase.find((t) => t.slug === userTool);
    if (tips && toolData) {
      recommendations.push({
        priority: "medium",
        category: "tool_optimization",
        title: `Get more out of ${tips.name}`,
        problem: `You're already using ${tips.name}, but most users only tap into 20-30% of its capabilities. There are features and workflows you're likely not using that could significantly reduce your manual workload.`,
        solution: tips.generalTips.join(" ") + " These are just the basics — there's much more you can do.",
        impact: "~2-3 hours/week saved with better tool usage",
        tools: [toolData],
        isPremium: false,
        toolOptimizations: [{
          toolSlug: tips.slug,
          toolName: tips.name,
          generalTips: tips.generalTips,
          premiumTips: tips.premiumTips,
          premiumSummary: tips.premiumSummary,
        }],
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Cap at 6 total recommendations
  const capped = recommendations.slice(0, 6);

  // Mark items beyond the first 3 as premium
  capped.forEach((rec, i) => {
    if (i >= 3) rec.isPremium = true;
  });

  return capped;
}

export function calculateHealthScore(input: DiagnosticInput): number {
  let score = 100;

  // Deduct for each friction area
  score -= input.frictionAreas.length * 8;

  // Deduct for low productivity self-assessment
  score -= (5 - input.productivityScore) * 6;

  // Deduct for low morale
  const moraleScore = input.moraleScore || 3;
  score -= (5 - moraleScore) * 5;

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
