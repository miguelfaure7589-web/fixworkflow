export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  layer: 1 | 2 | 3;
  type: "single" | "multi" | "scale" | "tools" | "text";
  question: string;
  subtitle?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  maxLength?: number;
  dependsOn?: { questionId: string; values: string[] };
}

export const questions: Question[] = [
  // ─── Layer 1: Role & Context ───
  {
    id: "role",
    layer: 1,
    type: "multi",
    question: "What best describes your role?",
    subtitle: "Select all that apply.",
    options: [
      { value: "freelancer", label: "Freelancer / Consultant", description: "Independent work with multiple clients" },
      { value: "solopreneur", label: "Solo Entrepreneur", description: "Running your own business solo" },
      { value: "remote_employee", label: "Remote Employee", description: "Working remotely for a company" },
      { value: "team_lead", label: "Small Team Lead", description: "Managing a team of 2-15 people" },
      { value: "agency_owner", label: "Agency Owner", description: "Running an agency with clients and staff" },
      { value: "creator", label: "Content Creator", description: "YouTube, podcasts, writing, or social media" },
      { value: "executive", label: "Executive / Founder", description: "Leading a company or startup" },
      { value: "virtual_assistant", label: "Virtual Assistant", description: "Supporting multiple clients remotely" },
      { value: "other", label: "Other", description: "Something else not listed here" },
    ],
  },
  {
    id: "industry",
    layer: 1,
    type: "multi",
    question: "What type of work do you do?",
    subtitle: "Select all that apply.",
    options: [
      { value: "creative", label: "Creative / Design" },
      { value: "development", label: "Software / Development" },
      { value: "consulting", label: "Consulting / Coaching" },
      { value: "ecommerce", label: "E-commerce / Retail" },
      { value: "services", label: "Professional Services" },
      { value: "marketing", label: "Marketing / Agency" },
      { value: "content", label: "Content Creation" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "teamSize",
    layer: 1,
    type: "single",
    question: "How many people are on your team?",
    options: [
      { value: "solo", label: "Just me" },
      { value: "small", label: "2-5 people" },
      { value: "medium", label: "6-15 people" },
      { value: "larger", label: "15+ people" },
    ],
  },
  {
    id: "workEnvironment",
    layer: 1,
    type: "single",
    question: "What's your primary work environment?",
    options: [
      { value: "fully_remote", label: "Fully Remote" },
      { value: "hybrid", label: "Hybrid" },
      { value: "onsite", label: "On-site / Office" },
    ],
  },
  {
    id: "productivityScore",
    layer: 1,
    type: "scale",
    question: "How would you rate your current productivity?",
    subtitle: "1 = constantly struggling, 5 = running smoothly",
    min: 1,
    max: 5,
  },
  {
    id: "moraleScore",
    layer: 1,
    type: "scale",
    question: "How would you rate your (or your team's) morale right now?",
    subtitle: "1 = burned out / disengaged, 5 = energized and motivated",
    min: 1,
    max: 5,
  },

  // ─── Layer 2: Problem Identification ───
  {
    id: "frictionAreas",
    layer: 2,
    type: "multi",
    question: "Where do you feel the most friction?",
    subtitle: "Select all that apply.",
    options: [
      { value: "task_management", label: "Task Management", description: "Losing track of tasks, missed deadlines" },
      { value: "communication", label: "Communication", description: "Messages falling through cracks" },
      { value: "client_work", label: "Client Work", description: "Onboarding, feedback, deliverables" },
      { value: "file_management", label: "File Chaos", description: "Can't find documents, version confusion" },
      { value: "time_tracking", label: "Time Tracking", description: "Not tracking hours, poor estimates" },
      { value: "too_many_tools", label: "Too Many Tools", description: "Tool overload, nothing connects" },
      { value: "automation", label: "No Automation", description: "Manual repetitive work" },
      { value: "focus", label: "Focus / Distractions", description: "Interruptions, context switching" },
      { value: "invoicing", label: "Invoicing / Billing", description: "Late payments, manual invoicing" },
      { value: "remote_setup", label: "Remote Setup", description: "Poor workspace, tech issues" },
      { value: "morale", label: "Team Morale / Energy", description: "Burnout, low motivation, disengagement" },
      { value: "finances", label: "Business Finances", description: "Cash flow, banking, credit, bookkeeping" },
      { value: "phone_internet", label: "Phone / Internet", description: "Bad connection, no business phone, high costs" },
      { value: "payments", label: "Payment Processing", description: "High fees, slow payouts, clunky checkout" },
      { value: "sales_leads", label: "Sales / Lead Generation", description: "Not enough leads, no sales pipeline" },
      { value: "hiring_delegation", label: "Hiring / Delegation", description: "Can't find help, afraid to delegate" },
      { value: "training_onboarding", label: "Training / Onboarding", description: "New hires or contractors ramp up too slowly" },
      { value: "security_privacy", label: "Security / Privacy", description: "Worried about data breaches, weak passwords" },
      { value: "scaling", label: "Scaling / Growth", description: "Systems breaking as you grow" },
      { value: "marketing", label: "Marketing / Visibility", description: "Not getting enough exposure or traffic" },
    ],
  },

  // ─── Layer 2 Drill-downs ───
  {
    id: "task_detail",
    layer: 2,
    type: "single",
    question: "What's your biggest task management challenge?",
    dependsOn: { questionId: "frictionAreas", values: ["task_management"] },
    options: [
      { value: "no_system", label: "No real system", description: "Using sticky notes, memory, or scattered lists" },
      { value: "too_complex", label: "System is too complex", description: "Tool has features we don't use" },
      { value: "no_visibility", label: "No visibility", description: "Can't see what everyone is working on" },
      { value: "missed_deadlines", label: "Missed deadlines", description: "Tasks slip through regularly" },
    ],
  },
  {
    id: "communication_detail",
    layer: 2,
    type: "single",
    question: "What's your biggest communication issue?",
    dependsOn: { questionId: "frictionAreas", values: ["communication"] },
    options: [
      { value: "too_many_channels", label: "Too many channels", description: "Slack, email, text, DMs everywhere" },
      { value: "sync_overload", label: "Too many meetings", description: "Calendar is packed, no time to work" },
      { value: "messages_lost", label: "Messages get lost", description: "Important info buried in threads" },
      { value: "no_async", label: "No async norms", description: "Everything feels urgent all the time" },
    ],
  },
  {
    id: "client_detail",
    layer: 2,
    type: "single",
    question: "Where does client work break down?",
    dependsOn: { questionId: "frictionAreas", values: ["client_work"] },
    options: [
      { value: "onboarding", label: "Client onboarding", description: "No consistent process for new clients" },
      { value: "feedback", label: "Feedback loops", description: "Revisions and approvals take forever" },
      { value: "tracking", label: "Tracking deliverables", description: "Losing track of what's owed" },
      { value: "communication", label: "Client communication", description: "Scattered across email, chat, calls" },
    ],
  },
  {
    id: "automation_detail",
    layer: 2,
    type: "single",
    question: "What kind of manual work takes the most time?",
    dependsOn: { questionId: "frictionAreas", values: ["automation"] },
    options: [
      { value: "data_entry", label: "Data entry / copying", description: "Manually moving info between tools" },
      { value: "follow_ups", label: "Follow-ups", description: "Manually sending reminders and check-ins" },
      { value: "reporting", label: "Reporting", description: "Building reports from scratch each time" },
      { value: "onboarding_steps", label: "Onboarding steps", description: "Repeating the same setup for each client/project" },
    ],
  },
  {
    id: "morale_detail",
    layer: 2,
    type: "multi",
    question: "What's dragging down morale the most?",
    subtitle: "Select all that apply.",
    dependsOn: { questionId: "frictionAreas", values: ["morale"] },
    options: [
      { value: "burnout", label: "Burnout / overwork", description: "Working too many hours, no recovery time" },
      { value: "unclear_roles", label: "Unclear roles & ownership", description: "No one knows who's responsible for what" },
      { value: "no_recognition", label: "Lack of recognition", description: "Good work goes unnoticed or unappreciated" },
      { value: "no_growth", label: "No growth or learning", description: "Feeling stuck, no development opportunities" },
      { value: "poor_leadership", label: "Leadership gaps", description: "Missing direction, inconsistent decisions" },
      { value: "isolation", label: "Isolation / disconnection", description: "Feeling disconnected from team or purpose" },
      { value: "micromanagement", label: "Micromanagement", description: "Too much oversight, not enough trust" },
      { value: "toxic_culture", label: "Negative culture", description: "Blame, gossip, or lack of psychological safety" },
    ],
  },

  {
    id: "finance_detail",
    layer: 2,
    type: "multi",
    question: "What's your biggest financial challenge?",
    subtitle: "Select all that apply.",
    dependsOn: { questionId: "frictionAreas", values: ["finances"] },
    options: [
      { value: "cash_flow", label: "Cash flow gaps", description: "Inconsistent income, waiting on payments" },
      { value: "no_business_banking", label: "No dedicated business banking", description: "Mixing personal and business finances" },
      { value: "need_credit", label: "Need business credit or funding", description: "Need capital for growth or expenses" },
      { value: "bookkeeping_mess", label: "Bookkeeping chaos", description: "Receipts everywhere, no organized books" },
      { value: "expense_tracking", label: "Can't track expenses", description: "No clear picture of where money goes" },
      { value: "tax_prep", label: "Tax prep nightmare", description: "Scrambling every tax season" },
    ],
  },

  {
    id: "phone_internet_detail",
    layer: 2,
    type: "multi",
    question: "What phone or internet issues do you deal with?",
    subtitle: "Select all that apply.",
    dependsOn: { questionId: "frictionAreas", values: ["phone_internet"] },
    options: [
      { value: "no_business_phone", label: "No business phone line", description: "Using personal number for business calls" },
      { value: "bad_internet", label: "Unreliable internet", description: "Drops during calls, slow speeds" },
      { value: "high_phone_costs", label: "High phone/call costs", description: "Expensive plans, international call fees" },
      { value: "need_call_system", label: "Need a call/sales system", description: "Outbound calling, call routing, auto-attendant" },
      { value: "no_voicemail_pro", label: "No professional voicemail", description: "Missing calls, no call management" },
    ],
  },
  {
    id: "payments_detail",
    layer: 2,
    type: "multi",
    question: "What's your biggest payment processing frustration?",
    subtitle: "Select all that apply.",
    dependsOn: { questionId: "frictionAreas", values: ["payments"] },
    options: [
      { value: "high_fees", label: "Processing fees too high", description: "Losing too much to transaction fees" },
      { value: "slow_payouts", label: "Slow payouts", description: "Waiting days to access your money" },
      { value: "no_online_payments", label: "Can't accept online payments", description: "Still doing checks, cash, or bank transfers" },
      { value: "need_pos", label: "Need in-person payments", description: "Need card reader or POS system" },
      { value: "recurring_billing", label: "No recurring billing", description: "Manually charging clients each month" },
    ],
  },
  {
    id: "sales_leads_detail",
    layer: 2,
    type: "single",
    question: "What's your biggest challenge with sales and leads?",
    dependsOn: { questionId: "frictionAreas", values: ["sales_leads"] },
    options: [
      { value: "no_pipeline", label: "No sales pipeline", description: "Leads come in but there's no system to track them" },
      { value: "not_enough_leads", label: "Not enough leads", description: "Struggling to find new clients or customers" },
      { value: "bad_follow_up", label: "Poor follow-up", description: "Leads go cold because I forget to follow up" },
      { value: "no_crm", label: "No CRM or tracking", description: "Using spreadsheets or memory to track prospects" },
    ],
  },
  {
    id: "hiring_detail",
    layer: 2,
    type: "single",
    question: "What's your biggest challenge with hiring or delegation?",
    dependsOn: { questionId: "frictionAreas", values: ["hiring_delegation"] },
    options: [
      { value: "cant_find_talent", label: "Can't find good people", description: "Hard to find reliable freelancers or hires" },
      { value: "afraid_to_delegate", label: "Afraid to let go", description: "Worried they won't do it right" },
      { value: "no_budget", label: "Can't afford help yet", description: "Need help but not sure how to fund it" },
      { value: "no_process", label: "No delegation process", description: "Don't know what to hand off or how" },
    ],
  },
  {
    id: "training_detail",
    layer: 2,
    type: "single",
    question: "What makes training or onboarding difficult?",
    dependsOn: { questionId: "frictionAreas", values: ["training_onboarding"] },
    options: [
      { value: "no_documentation", label: "Nothing is documented", description: "Processes live in people's heads" },
      { value: "takes_too_long", label: "Takes too long to ramp up", description: "New people need weeks to be useful" },
      { value: "inconsistent_quality", label: "Inconsistent quality", description: "Everyone does things differently" },
      { value: "high_turnover", label: "High turnover", description: "People leave before they're fully trained" },
    ],
  },
  {
    id: "scaling_detail",
    layer: 2,
    type: "single",
    question: "Where does your business hit scaling walls?",
    dependsOn: { questionId: "frictionAreas", values: ["scaling"] },
    options: [
      { value: "bottleneck_me", label: "I'm the bottleneck", description: "Everything runs through me" },
      { value: "systems_breaking", label: "Systems are breaking", description: "What worked for 5 clients doesn't work for 20" },
      { value: "cant_take_more", label: "Can't take on more work", description: "At capacity but want to grow" },
      { value: "no_recurring_revenue", label: "No recurring revenue", description: "Income resets to zero each month" },
    ],
  },

  // ─── Layer 2: Goals ───
  {
    id: "goals",
    layer: 2,
    type: "text",
    question: "What are you looking to accomplish?",
    subtitle: "Describe your main goals or challenges in your own words. This helps us personalize your results.",
    maxLength: 500,
  },

  // ─── Layer 3: Current Stack ───
  {
    id: "currentTools",
    layer: 3,
    type: "tools",
    question: "What tools do you currently use?",
    subtitle: "Select all that apply. This helps us recommend integrations.",
    options: [
      { value: "gmail", label: "Gmail" },
      { value: "outlook", label: "Outlook" },
      { value: "slack", label: "Slack" },
      { value: "teams", label: "Microsoft Teams" },
      { value: "zoom", label: "Zoom" },
      { value: "trello", label: "Trello" },
      { value: "asana", label: "Asana" },
      { value: "monday", label: "Monday.com" },
      { value: "clickup", label: "ClickUp" },
      { value: "notion", label: "Notion" },
      { value: "google_docs", label: "Google Docs/Drive" },
      { value: "dropbox", label: "Dropbox" },
      { value: "hubspot", label: "HubSpot" },
      { value: "pipedrive", label: "Pipedrive" },
      { value: "quickbooks", label: "QuickBooks" },
      { value: "freshbooks", label: "FreshBooks" },
      { value: "zapier", label: "Zapier" },
      { value: "make", label: "Make (Integromat)" },
      { value: "canva", label: "Canva" },
      { value: "figma", label: "Figma" },
      { value: "loom", label: "Loom" },
      { value: "toggl", label: "Toggl" },
      { value: "calendly", label: "Calendly" },
      { value: "stripe", label: "Stripe" },
      { value: "square", label: "Square" },
      { value: "paypal", label: "PayPal Business" },
      { value: "ringcentral", label: "RingCentral" },
      { value: "grasshopper", label: "Grasshopper" },
      { value: "spreadsheets", label: "Spreadsheets (Excel/Sheets)" },
      { value: "none", label: "Not using any specific tools" },
    ],
  },
  {
    id: "toolPainPoint",
    layer: 3,
    type: "single",
    question: "What's your #1 frustration with your current tools?",
    options: [
      { value: "dont_connect", label: "They don't connect", description: "Data is siloed between tools" },
      { value: "too_expensive", label: "Paying too much", description: "Overlapping subscriptions" },
      { value: "too_complicated", label: "Too complicated", description: "Features I don't use, steep learning curve" },
      { value: "missing_features", label: "Missing features", description: "My tools can't do what I need" },
      { value: "no_tools", label: "I barely use tools", description: "Doing most things manually" },
    ],
  },
];

export function getVisibleQuestions(answers: Record<string, string | string[] | number>): Question[] {
  return questions.filter((q) => {
    if (!q.dependsOn) return true;
    const parentAnswer = answers[q.dependsOn.questionId];
    if (Array.isArray(parentAnswer)) {
      return q.dependsOn.values.some((v) => parentAnswer.includes(v));
    }
    return q.dependsOn.values.includes(String(parentAnswer));
  });
}
