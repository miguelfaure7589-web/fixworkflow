import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(`reset:${ip}`, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body: { token?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { token, email, password } = body;

  if (!token || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const hashedToken = createHash("sha256").update(token).digest("hex");

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email.toLowerCase(),
      token: hashedToken,
    },
  });

  if (!verificationToken) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  if (new Date() > verificationToken.expires) {
    // Clean up expired token
    await prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase(), token: hashedToken },
    });
    return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
  }

  // Update password
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { password: hash },
  });

  // Delete used token
  await prisma.verificationToken.deleteMany({
    where: { identifier: email.toLowerCase(), token: hashedToken },
  });

  return NextResponse.json({ success: true });
}
