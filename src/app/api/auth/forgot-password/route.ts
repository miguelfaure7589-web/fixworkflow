import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(`forgot:${ip}`, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ message: "If an account exists with that email, a reset link has been sent." });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "If an account exists with that email, a reset link has been sent." });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ message: "If an account exists with that email, a reset link has been sent." });
  }

  // Always return same response (prevent email enumeration)
  const genericResponse = NextResponse.json({
    message: "If an account exists with that email, a reset link has been sent.",
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericResponse;

  // Generate 32-byte random token
  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store hashed token in VerificationToken
  // Delete any existing tokens for this email first
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  await sendPasswordResetEmail(email, resetUrl);

  return genericResponse;
}
