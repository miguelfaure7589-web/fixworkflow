import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Molly, FixWorkFlow's friendly AI assistant. You help remote workers, freelancers, and small business owners with workflow optimization questions. Always introduce yourself as Molly if asked your name.

Key things about FixWorkFlow:
- Free AI-powered workflow diagnosis that takes 3 minutes
- Identifies workflow bottlenecks and recommends fixes
- Premium plan ($9.99/mo or $79/yr) with full reports, automation blueprints, and monthly re-diagnosis
- 7-day free trial for Premium, no credit card required
- Over 12,000 workflows diagnosed

You should:
- Be helpful, concise, and conversational (2-4 sentences per response)
- Answer questions about productivity, workflow optimization, tool recommendations, and automation
- Naturally mention the free diagnosis when relevant, but don't be pushy
- If asked about specific tool recommendations, give honest advice
- If you don't know something specific about the product, suggest they take the free diagnosis for personalized results

Keep responses short and practical. No walls of text.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as { messages: ChatMessage[] };

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { reply: getFallbackReply(messages[messages.length - 1]?.content || "") },
        { status: 200 }
      );
    }

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
          ...messages.slice(-10),
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { reply: getFallbackReply(messages[messages.length - 1]?.content || "") },
        { status: 200 }
      );
    }

    const data = await response.json();
    const reply =
      data.choices[0]?.message?.content ||
      "I'm not sure about that. Try our free diagnosis for personalized workflow recommendations!";

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { reply: "Sorry, something went wrong. Feel free to try our free 3-minute diagnosis for personalized recommendations!" },
      { status: 200 }
    );
  }
}

function getFallbackReply(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("price") || msg.includes("cost") || msg.includes("plan")) {
    return "We have a free tier with basic diagnosis and top 3 recommendations, and a Premium plan at $9.99/mo (or $79/yr) with full reports, automation blueprints, and monthly re-diagnosis. You can start with a 7-day free trial — no credit card needed!";
  }
  if (msg.includes("trial")) {
    return "Our 7-day free trial gives you full access to all Premium features — no credit card required. If you love it, pick a plan to continue. If not, you'll go back to the free tier automatically.";
  }
  if (msg.includes("how") && (msg.includes("work") || msg.includes("start"))) {
    return "It's simple! Take our free 3-minute diagnosis — answer a few questions about your role, tools, and pain points. Our AI analyzes your workflow and gives you a personalized improvement plan with specific recommendations.";
  }
  if (msg.includes("tool") || msg.includes("recommend")) {
    return "The best tool stack depends on your specific workflow. Take our free diagnosis and we'll recommend the exact tools that fit your role, team size, and work style — not just a generic list.";
  }
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return "Hey there! How can I help you today? I can answer questions about workflow optimization, our diagnosis process, or help you figure out if FixWorkFlow is right for you.";
  }

  return "Great question! For the most personalized answer, I'd recommend taking our free 3-minute diagnosis. It'll analyze your specific workflow and give you tailored recommendations. Is there anything specific about FixWorkFlow I can help with?";
}
