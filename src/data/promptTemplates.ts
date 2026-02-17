/**
 * Prompt Template seed data — 10 templates matching dashboard content.
 * Each template uses {{placeholder}} syntax filled at render time.
 */

export interface PromptTemplateSeed {
  slug: string;
  title: string;
  category: string;
  visibility: "FREE" | "PREMIUM";
  template: string;
}

export const promptTemplates: PromptTemplateSeed[] = [
  {
    slug: "ops_sop_builder",
    title: "Build an SOP for a Key Process",
    category: "ops",
    visibility: "FREE",
    template: `You are a business operations consultant. I run a {{businessType}} business.

Context:
- Monthly revenue: {{monthlyRevenue}}
- Ops hours/week: {{opsHoursPerWeek}}
- Support tickets/week: {{supportTicketsPerWeek}}
- Health score: {{healthScore}}/100
- Primary risk: {{primaryRisk}}

I want to create a Standard Operating Procedure (SOP) for: {{selectedItemTitle}}
Category: {{selectedItemCategory}}
{{selectedItemDescription}}

Please provide:
1. **Reasoning**: Why this SOP matters given my metrics
2. **Assumptions**: What you're assuming about my business
3. **3 Options**: Three different approaches to this SOP (simple, balanced, advanced)
4. **7-Day Plan**: Step-by-step implementation schedule
5. **Metrics Used**: Which of my numbers influenced your advice

Important: Do not claim any integrations or automations that don't already exist. Focus on practical, manual-first processes I can implement immediately.`,
  },
  {
    slug: "ops_automation_plan",
    title: "Automation Roadmap for Operations",
    category: "ops",
    visibility: "PREMIUM",
    template: `You are an operations automation strategist. I run a {{businessType}} business.

Context:
- Monthly revenue: {{monthlyRevenue}}
- Gross margin: {{grossMargin}}%
- Ops hours/week: {{opsHoursPerWeek}}
- Support tickets/week: {{supportTicketsPerWeek}}
- Fulfillment days: {{fulfillmentDays}}
- Health score: {{healthScore}}/100
- Pillar scores: {{pillarScoresJson}}
- Fastest lever: {{fastestLever}}

I want to automate or optimize: {{selectedItemTitle}}
Category: {{selectedItemCategory}}
{{selectedItemDescription}}

Please provide:
1. **Reasoning**: Why automation here matters most given my pillar scores
2. **Assumptions**: What you're assuming about my current workflow
3. **3 Options**: Three automation approaches (no-code, low-code, custom) with estimated time savings
4. **7-Day Plan**: Day-by-day setup and testing schedule
5. **Metrics Used**: Which numbers drove this recommendation

Important: Only suggest tools and integrations that are commonly available. Do not claim integrations that don't exist.`,
  },
  {
    slug: "revenue_offer_design",
    title: "Design a New Revenue Offer",
    category: "revenue",
    visibility: "FREE",
    template: `You are a revenue strategist. I run a {{businessType}} business.

Context:
- Monthly revenue: {{monthlyRevenue}}
- Average order value: {{aov}}
- Conversion rate: {{conversionRate}}%
- Monthly traffic: {{traffic}}
- Health score: {{healthScore}}/100
- Primary risk: {{primaryRisk}}

I want help with: {{selectedItemTitle}}
Category: {{selectedItemCategory}}
{{selectedItemDescription}}

Please provide:
1. **Reasoning**: Why this offer design matters for my revenue pillar
2. **Assumptions**: What you're assuming about my customers and pricing
3. **3 Options**: Three offer designs (quick-launch, optimized, premium)
4. **7-Day Plan**: Launch timeline from concept to live
5. **Metrics Used**: Which of my numbers shaped this advice

Important: Do not assume any specific tools or integrations I have. Keep recommendations tool-agnostic.`,
  },
  {
    slug: "revenue_promo_campaign",
    title: "Plan a Promotional Campaign",
    category: "revenue",
    visibility: "PREMIUM",
    template: `You are a revenue growth consultant. I run a {{businessType}} business.

Context:
- Monthly revenue: {{monthlyRevenue}}
- Gross margin: {{grossMargin}}%
- Net profit: {{netProfitMonthly}}/mo
- AOV: {{aov}}
- CAC: {{cac}}, LTV: {{ltv}}
- Traffic: {{traffic}}/mo
- Conversion rate: {{conversionRate}}%
- Health score: {{healthScore}}/100
- Pillar scores: {{pillarScoresJson}}
- Fastest lever: {{fastestLever}}

I want to plan: {{selectedItemTitle}}
Category: {{selectedItemCategory}}
{{selectedItemDescription}}

Please provide:
1. **Reasoning**: Why a promo campaign is the right move given my margins and unit economics
2. **Assumptions**: Margin constraints, audience size, and channel assumptions
3. **3 Options**: Conservative (margin-safe), balanced, aggressive campaigns with projected ROI
4. **7-Day Plan**: Day-by-day campaign build and launch schedule
5. **Metrics Used**: Which numbers drove the recommendation

Important: Do not claim any integrations or platform features that don't exist.`,
  },
  {
    slug: "acquisition_funnel_audit",
    title: "Audit Your Acquisition Funnel",
    category: "acquisition",
    visibility: "FREE",
    template: `You are a growth marketing consultant. I run a {{businessType}} business.

Context:
- Monthly traffic: {{traffic}}
- Conversion rate: {{conversionRate}}%
- CAC: {{cac}}
- Health score: {{healthScore}}/100
- Primary risk: {{primaryRisk}}

I want to audit: {{selectedItemTitle}}
Category: {{selectedItemCategory}}
{{selectedItemDescription}}

Please provide:
1. **Reasoning**: Why a funnel audit matters given my acquisition metrics
2. **Assumptions**: What you're assuming about my funnel stages
3. **3 Options**: Quick audit (1 day), thorough audit (3 days), full overhaul (7 days)
4. **7-Day Plan**: Step-by-step audit and fix schedule
5. **Metrics Used**: Which numbers informed this audit plan

Important: Do not claim integrations or analytics tools that don't exist. Focus on what I can check manually.`,
  },
  {
    slug: "acquisition_landing_copy",
    title: "Write High-Converting Landing Copy",
    category: "acquisition",
    visibility: "PREMIUM",
    template: `You are a conversion copywriting expert. I run a {{businessType}} business.

Context:
- Monthly traffic: {{traffic}}
- Conversion rate: {{conversionRate}}%
- AOV: {{aov}}
- CAC: {{cac}}, LTV: {{ltv}}
- Health score: {{healthScore}}/100
- Pillar scores: {{pillarScoresJson}}

I need copy for: {{selectedItemTitle}}
Category: {{selectedItemCategory}}
{{selectedItemDescription}}

Please provide:
1. **Reasoning**: Why better landing copy is critical given my conversion rate and traffic
2. **Assumptions**: Target audience, value prop, and positioning assumptions
3. **3 Options**: Three headline + CTA variations (benefit-led, urgency-led, social-proof-led)
4. **7-Day Plan**: Copy creation, review, A/B test setup, and measurement schedule
5. **Metrics Used**: Which numbers shaped the copy strategy

Important: Do not reference specific A/B testing tools. Keep copy framework-agnostic.`,
  },
  {
    slug: "retention_reduce_churn",
    title: "Build a Churn Reduction Plan",
    category: "retention",
    visibility: "PREMIUM",
    template: `You are a customer retention strategist. I run a {{businessType}} business.

Context:
- Monthly churn: {{churn}}%
- LTV: {{ltv}}
- CAC: {{cac}}
- Monthly revenue: {{monthlyRevenue}}
- Support tickets/week: {{supportTicketsPerWeek}}
- Health score: {{healthScore}}/100
- Pillar scores: {{pillarScoresJson}}
- Primary risk: {{primaryRisk}}

I want to reduce churn via: {{selectedItemTitle}}
Category: {{selectedItemCategory}}
{{selectedItemDescription}}

Please provide:
1. **Reasoning**: Why churn reduction is critical given my LTV:CAC ratio and retention score
2. **Assumptions**: Customer lifecycle, churn triggers, and engagement assumptions
3. **3 Options**: Quick-win (email sequences), medium (onboarding overhaul), deep (product changes)
4. **7-Day Plan**: Implementation schedule prioritizing highest-impact actions first
5. **Metrics Used**: Which numbers drove this plan

Important: Do not assume any specific CRM or email tool. Keep recommendations tool-agnostic.`,
  },
  {
    slug: "pricing_aov_increase",
    title: "Increase Average Order Value",
    category: "profitability",
    visibility: "PREMIUM",
    template: `You are a pricing and monetization strategist. I run a {{businessType}} business.

Context:
- Monthly revenue: {{monthlyRevenue}}
- AOV: {{aov}}
- Gross margin: {{grossMargin}}%
- Conversion rate: {{conversionRate}}%
- Traffic: {{traffic}}/mo
- LTV: {{ltv}}
- Health score: {{healthScore}}/100
- Pillar scores: {{pillarScoresJson}}

I want to increase AOV through: {{selectedItemTitle}}
Category: {{selectedItemCategory}}
{{selectedItemDescription}}

Please provide:
1. **Reasoning**: Why AOV improvement is the right lever given my margins and conversion rate
2. **Assumptions**: Product mix, pricing elasticity, and customer behavior assumptions
3. **3 Options**: Bundling strategy, tiered pricing, and upsell/cross-sell approach with projected AOV lift
4. **7-Day Plan**: Test and rollout schedule
5. **Metrics Used**: Which numbers shaped the pricing strategy

Important: Do not claim any specific checkout or payment integrations.`,
  },
  {
    slug: "tool_compare",
    title: "Compare Tools for Your Business",
    category: "tools",
    visibility: "FREE",
    template: `You are a business tools advisor. I run a {{businessType}} business.

Context:
- Monthly revenue: {{monthlyRevenue}}
- Health score: {{healthScore}}/100
- Primary risk: {{primaryRisk}}
- Fastest lever: {{fastestLever}}

I'm evaluating: {{selectedItemTitle}}
Category: {{selectedItemCategory}}
{{selectedItemDescription}}

Please provide:
1. **Reasoning**: Why this tool category matters for my business right now
2. **Assumptions**: What you're assuming about my current tool stack and needs
3. **3 Options**: Three alternatives in this category with pros/cons and price ranges
4. **7-Day Plan**: Evaluation and decision framework (trial, test, decide)
5. **Metrics Used**: Which of my numbers suggest I need this type of tool

Important: Only mention real, commonly available tools. Do not claim specific integrations between tools unless they are well-known. Do not fabricate features.`,
  },
  {
    slug: "weekly_focus_plan",
    title: "Generate a Custom Weekly Focus Plan",
    category: "planning",
    visibility: "PREMIUM",
    template: `You are a business execution coach. I run a {{businessType}} business.

Context:
- Monthly revenue: {{monthlyRevenue}}
- Gross margin: {{grossMargin}}%
- Net profit: {{netProfitMonthly}}/mo
- Runway: {{runwayMonths}} months
- Churn: {{churn}}%
- Conversion rate: {{conversionRate}}%
- Traffic: {{traffic}}/mo
- AOV: {{aov}}
- CAC: {{cac}}, LTV: {{ltv}}
- Ops hours/week: {{opsHoursPerWeek}}
- Health score: {{healthScore}}/100
- Pillar scores: {{pillarScoresJson}}
- Primary risk: {{primaryRisk}}
- Fastest lever: {{fastestLever}}

I want a weekly plan focused on: {{selectedItemTitle}}
Category: {{selectedItemCategory}}
{{selectedItemDescription}}

Please provide:
1. **Reasoning**: Why this focus area matters most this week based on my pillar scores
2. **Assumptions**: Time availability, resource constraints, and priority assumptions
3. **3 Options**: Light (2 hrs/day), balanced (4 hrs/day), intensive (full week) plans
4. **7-Day Plan**: Detailed day-by-day schedule with specific deliverables
5. **Metrics Used**: Every number that influenced the weekly plan

Important: Do not claim any integrations or tools that don't exist. Focus on actionable steps I can take manually.`,
  },
];
