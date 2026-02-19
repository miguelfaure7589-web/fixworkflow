import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const VALID_TYPES = ["bug", "feature", "general"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as Record<string, unknown>).id as string;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = String(body.type || "general").toLowerCase();
  const message = String(body.message || "").trim();
  const pageUrl = body.pageUrl ? String(body.pageUrl).slice(0, 500) : null;

  if (!message || message.length < 3) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: { userId, type, message: message.slice(0, 2000), pageUrl },
  });

  // Email admin (fire-and-forget)
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "fixworkflows@gmail.com";
    const userEmail = session.user.email || "unknown";
    const { Resend } = await import("resend");
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const from = process.env.EMAIL_FROM || "FixWorkFlow <onboarding@resend.dev>";
      resend.emails.send({
        from,
        to: adminEmail,
        subject: `[Feedback] ${type}: ${message.slice(0, 60)}`,
        html: `<p><strong>From:</strong> ${userEmail}</p><p><strong>Type:</strong> ${type}</p><p><strong>Page:</strong> ${pageUrl || "N/A"}</p><hr><p>${message.replace(/\n/g, "<br>")}</p>`,
      }).catch((err) => console.error("[FEEDBACK EMAIL] Failed:", err));
    }
  } catch (err) {
    console.error("[FEEDBACK EMAIL] Error:", err);
  }

  return NextResponse.json({ ok: true, id: feedback.id }, { status: 201 });
}
