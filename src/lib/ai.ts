import { type DiagnosticInput, type RecommendationOutput } from "./recommendation-engine";

const SYSTEM_PROMPT = `You are FixWorkflow's AI diagnostic assistant. You help remote workers, freelancers, and small business owners optimize their workflows and productivity.

Your role is to take structured recommendation data and enhance it with personalized, conversational explanations. You should:
- Be direct and practical, not generic
- Reference the user's specific situation (their role, tools, team size)
- Explain WHY each recommendation matters for their case
- Be honest — if a tool isn't the best fit, say so
- Keep language conversational but professional

You are NOT selling tools. You are diagnosing workflow problems and recommending solutions. Some solutions involve tools, others are process changes.

Important: Keep responses concise. Each recommendation summary should be 2-3 sentences max.`;

export async function enhanceRecommendations(
  input: DiagnosticInput,
  recommendations: RecommendationOutput[]
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  // If no API key, return a structured summary without AI enhancement
  if (!apiKey) {
    return generateFallbackSummary(input, recommendations);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate a brief personalized workflow diagnosis summary for this user. Be concise — 3-4 sentences max covering the overall situation.

User Profile:
- Role: ${input.role}
- Industry: ${input.industry}
- Team Size: ${input.teamSize}
- Work Environment: ${input.workEnvironment}
- Productivity Self-Score: ${input.productivityScore}/5
- Friction Areas: ${input.frictionAreas.join(", ")}
- Current Tools: ${input.currentTools.join(", ")}

Top Recommendations: ${recommendations.slice(0, 3).map((r) => r.title).join(", ")}

Write the summary addressing the user directly ("You..."). Focus on the core problem pattern you see and the biggest opportunity.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return generateFallbackSummary(input, recommendations);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || generateFallbackSummary(input, recommendations);
  } catch {
    return generateFallbackSummary(input, recommendations);
  }
}

function generateFallbackSummary(
  input: DiagnosticInput,
  recommendations: RecommendationOutput[]
): string {
  const roleLabels: Record<string, string> = {
    freelancer: "a freelancer",
    solopreneur: "a solo entrepreneur",
    remote_employee: "a remote worker",
    team_lead: "a team lead",
  };

  const highPriority = recommendations.filter((r) => r.priority === "high");
  const totalImpact = recommendations.length * 3;

  return `As ${roleLabels[input.role] || "a professional"} in ${input.industry}, your workflow has ${input.frictionAreas.length} key friction points that are holding you back. ${highPriority.length > 0 ? `Your most urgent issues are in ${highPriority.map((r) => r.category.replace(/_/g, " ")).join(" and ")}.` : ""} Based on your current setup, we estimate you could save ${totalImpact}+ hours per week by implementing the changes below. Start with the high-priority recommendations — they'll have the biggest immediate impact.`;
}
