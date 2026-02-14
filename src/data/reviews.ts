export interface Review {
  name: string;
  role: string;
  rating: number;
  quote: string;
  date: string;
  avatar: string;
  avatarColor: string;
  tag: string;
  metric: string;
  metricLabel: string;
}

export const reviews: Review[] = [
  {
    name: "Sarah K.",
    role: "Freelance Brand Designer",
    rating: 5,
    quote:
      "ok so I was mass one of those people with like 9 tabs open at all times, bouncing between Trello and Asana (yes both lol) and google sheets for tracking stuff. took the quiz mostly out of curiosity and it straight up told me I was overcomplicating everything. switched to just ClickUp + Slack, set up two zaps and deleted the rest. its been 3 weeks and I genuinely cannot believe how much calmer my workdays are. also saving like $130/mo in random subscriptions I forgot I was even paying for",
    date: "2026-01-28",
    avatar: "SK",
    avatarColor: "from-pink-500 to-rose-500",
    tag: "Tool Stack",
    metric: "4 tools cut",
    metricLabel: "Saved ~$130/mo",
  },
  {
    name: "James R.",
    role: "Marketing Consultant",
    rating: 5,
    quote:
      "Not gonna lie I was skeptical. Another \"AI tool\" promising to fix my life. But I tried it because its free and I was procrastinating anyway lmao. It recommended Make.com for automating my client onboarding which I'd never even heard of. Spent a sunday afternoon connecting my typeform to my project board and setting up auto welcome emails. Genuinely saved me like 6-7 hrs a week of copy pasting and manual setup. My only complaint is I didnt find this sooner honestly",
    date: "2026-01-25",
    avatar: "JR",
    avatarColor: "from-blue-500 to-cyan-500",
    tag: "Automation",
    metric: "~7 hrs/week saved",
    metricLabel: "3 automations built",
  },
  {
    name: "Priya M.",
    role: "Etsy Shop Owner",
    rating: 5,
    quote:
      "my score came back as 34 and I literally said \"that can't be right\" out loud. But then I read the breakdown and... yeah. no task system, files all over the place, doing everything manually. it was kind of a gut punch but in a helpful way? I went through the recs over the next month, one at a time (didn't try to change everything at once which I think was key). retook it last week — 82. I finish work by 5:30 most days now instead of 9pm. my husband noticed before I even told him lol",
    date: "2026-01-20",
    avatar: "PM",
    avatarColor: "from-violet-500 to-purple-500",
    tag: "Full Diagnosis",
    metric: "Score: 34 to 82",
    metricLabel: "Over ~30 days",
  },
  {
    name: "David L.",
    role: "Video Production, Small Agency",
    rating: 4,
    quote:
      "I'll be honest the diagnosis told me things I already kinda knew but was ignoring. Like the fact that I was making invoices in google docs, emailing PDFs, and tracking payments in a spreadsheet like its 2009. Switched to FreshBooks, set up recurring invoices, turned on auto reminders. Clients can pay in one click now. Went from net-45 to getting paid in like 5 days. The cash flow difference alone made this worth it. Only reason its not 5 stars is some of the tool suggestions weren't super relevant to video production specifically but the invoicing stuff was spot on",
    date: "2026-01-18",
    avatar: "DL",
    avatarColor: "from-emerald-500 to-teal-500",
    tag: "Cash Flow",
    metric: "~4 hrs/week freed",
    metricLabel: "Paid way faster",
  },
  {
    name: "Maria C.",
    role: "Independent Real Estate Agent",
    rating: 5,
    quote:
      "three years. THREE YEARS I gave clients my personal number. They'd call at 10pm, text on sundays, I could never fully shut off. FixWorkFlow flagged it immediately and was like \"why are you doing this to yourself.\" Got OpenPhone set up in maybe 10 min — now I have a real business number on the same phone, with business hours so it goes to voicemail after 6pm. I sleep better. not exaggerating. Such a simple fix and I just never thought to do it",
    date: "2026-01-15",
    avatar: "MC",
    avatarColor: "from-amber-500 to-orange-500",
    tag: "Infrastructure",
    metric: "Work-life boundary",
    metricLabel: "10 min setup",
  },
  {
    name: "Tyler W.",
    role: "Freelance Dev (React/Node)",
    rating: 5,
    quote:
      "so the diagnosis asked about security and I had this moment of like... oh no. same password on basically everything. bank, github, client portals, email, everything. I'm a developer I should know better lmao. Downloaded Bitwarden (free) that afternoon and just started going through everything. 40+ accounts with the same password. also turned on 2FA everywhere. Took maybe 3 hours total but considering one breach could literally end my career it felt pretty important. Thanks for the wake up call I guess",
    date: "2026-01-12",
    avatar: "TW",
    avatarColor: "from-red-500 to-rose-500",
    tag: "Security",
    metric: "40+ passwords fixed",
    metricLabel: "One afternoon",
  },
  {
    name: "Angela T.",
    role: "Self-Employed Bookkeeper",
    rating: 5,
    quote:
      "The irony of being a bookkeeper with messy personal finances is not lost on me lol. Everything was in one Chase checking account — personal, business, taxes all mixed together. The diagnosis recommended separating into dedicated accounts and setting up a profit-first system. Went with Relay because it lets you make multiple accounts for free. Now I have operating, tax reserve, and profit buckets that auto-transfer. I actually know what I make now which is... both terrifying and empowering",
    date: "2026-01-08",
    avatar: "AT",
    avatarColor: "from-teal-500 to-emerald-500",
    tag: "Finances",
    metric: "Finances separated",
    metricLabel: "Profit First running",
  },
  {
    name: "Marcus J.",
    role: "Brand Consultant, Solo Practice",
    rating: 5,
    quote:
      "was stuck at 6 clients for like a year. not because I didn't want more work, I physically couldn't take on more. The diagnosis showed me I was spending 12+ hrs/week on scheduling, proposals, follow ups, organizing files — stuff that wasn't actually consulting. Hired a part time VA off upwork, gave her the delegation checklist from the report, and she was productive in like 3 days. I'm at 10 clients now working fewer hours. The section about \"you're the bottleneck\" was a hard read but accurate",
    date: "2026-01-05",
    avatar: "MJ",
    avatarColor: "from-indigo-500 to-blue-500",
    tag: "Scaling",
    metric: "6 to 10 clients",
    metricLabel: "Fewer hours too",
  },
  {
    name: "Rachel S.",
    role: "Virtual Assistant",
    rating: 4,
    quote:
      "I was paying $89/mo for my phone plan PLUS $49 for a second line through my carrier and my internet still dropped every other zoom call. FixWorkFlow rec'd switching to a VoIP number for $15/mo and getting a tmobile 5g box as backup internet. Saves me over $100/mo and I haven't dropped a single call in 2 months. knocked off a star only because I wish the quiz had more questions about remote work setups specifically but the infrastructure recs were solid",
    date: "2025-12-30",
    avatar: "RS",
    avatarColor: "from-cyan-500 to-blue-500",
    tag: "Infrastructure",
    metric: "$100+/mo saved",
    metricLabel: "No more dropped calls",
  },
  {
    name: "Chris D.",
    role: "Freelance Copywriter",
    rating: 5,
    quote:
      "you know those \"10 best tools for freelancers\" posts that all recommend the exact same stuff? yeah this isn't that. It actually asked about my specific situation — solo writer, mostly B2B, dealing with scope creep and bad follow up habits. The recs made sense FOR ME not for some hypothetical freelancer. Also randomly recommended the book Buy Back Your Time and I'm halfway through it, its genuinely changing how I think about my time. Small detail but it shows they actually thought this through",
    date: "2025-12-28",
    avatar: "CD",
    avatarColor: "from-orange-500 to-red-500",
    tag: "Full Diagnosis",
    metric: "Personalized plan",
    metricLabel: "Not generic advice",
  },
];

export function getAverageRating(): number {
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

export function getRatingDistribution(): Record<number, number> {
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => dist[r.rating]++);
  return dist;
}
