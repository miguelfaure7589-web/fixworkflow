export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  layer: 1 | 2 | 3;
  type: "single" | "multi" | "scale" | "tools";
  question: string;
  subtitle?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  dependsOn?: { questionId: string; values: string[] };
}

export const questions: Question[] = [
  // ─── Layer 1: Role & Context ───
  {
    id: "role",
    layer: 1,
    type: "single",
    question: "What best describes your role?",
    subtitle: "This helps us tailor recommendations to your situation.",
    options: [
      { value: "freelancer", label: "Freelancer / Consultant", description: "Independent work with multiple clients" },
      { value: "solopreneur", label: "Solo Entrepreneur", description: "Running your own business solo" },
      { value: "remote_employee", label: "Remote Employee", description: "Working remotely for a company" },
      { value: "team_lead", label: "Small Team Lead", description: "Managing a team of 2-15 people" },
    ],
  },
  {
    id: "industry",
    layer: 1,
    type: "single",
    question: "What type of work do you do?",
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
