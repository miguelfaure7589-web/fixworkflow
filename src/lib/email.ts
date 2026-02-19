import { Resend } from "resend";

// ── Resend client (lazy init) ──

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM =
  process.env.EMAIL_FROM || "FixWorkFlow <onboarding@resend.dev>";

const BASE_URL = () =>
  process.env.NEXTAUTH_URL || "http://localhost:3000";

// ── Brand tokens ──

const C = {
  primary: "#4361ee",
  primaryGradient: "linear-gradient(135deg, #6366f1, #4361ee)",
  textDark: "#1b2434",
  textMid: "#5a6578",
  textMuted: "#8d95a3",
  bg: "#f4f5f8",
  surface: "#ffffff",
  border: "#e6e9ef",
  green: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
  font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

// ── Core send helper ──

interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOpts) {
  console.log(`[EMAIL] Sending "${subject}" to ${to} | RESEND_API_KEY set: ${!!process.env.RESEND_API_KEY}`);
  const client = getResend();

  if (client) {
    try {
      const { data, error } = await client.emails.send({
        from: FROM,
        to,
        subject,
        html,
      });
      if (error) {
        console.error("[EMAIL] Resend error:", error);
      } else {
        console.log("[EMAIL] Sent successfully, id:", data?.id);
      }
    } catch (err) {
      console.error("[EMAIL] Failed to send:", err);
    }
  } else {
    console.log(
      `\n[DEV EMAIL] To: ${to}\nSubject: ${subject}\n---\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500)}\n`,
    );
  }
}

// ── Shared layout ──

function layout(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${C.font};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${C.surface};border-radius:12px;overflow:hidden;border:1px solid ${C.border};">
<!-- Header -->
<tr><td style="padding:28px 32px 20px;border-bottom:1px solid ${C.border};">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="width:36px;height:36px;background:${C.primaryGradient};border-radius:8px;text-align:center;vertical-align:middle;line-height:36px;">
      <span style="color:#fff;font-size:18px;">&#9889;</span>
    </td>
    <td style="padding-left:12px;font-size:18px;font-weight:800;color:${C.textDark};letter-spacing:-0.3px;">FixWorkFlow</td>
  </tr></table>
</td></tr>
<!-- Body -->
<tr><td style="padding:32px;">
${body}
</td></tr>
<!-- Footer -->
<tr><td style="padding:20px 32px;background:${C.bg};border-top:1px solid ${C.border};">
  <p style="margin:0;font-size:12px;color:${C.textMuted};line-height:1.6;font-family:${C.font};">
    You're receiving this because you have a FixWorkFlow account.<br>
    <a href="${BASE_URL()}/settings" style="color:${C.primary};text-decoration:none;">Manage notification preferences</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
  <a href="${url}" style="display:inline-block;padding:14px 28px;background:${C.primary};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;font-family:${C.font};">
    ${text}
  </a>
</td></tr></table>`;
}

function stepCircle(num: number): string {
  return `<td style="width:24px;height:24px;background:${C.primary};color:#fff;border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;line-height:24px;font-family:${C.font};">${num}</td>`;
}

// ── Email Templates ──

// a. Welcome email — sent after signup
export async function sendWelcomeEmail(to: string, name?: string | null) {
  console.log("[EMAIL] sendWelcomeEmail called for:", to, "name:", name);
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${C.textDark};font-family:${C.font};">Welcome to FixWorkFlow</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${C.textMid};line-height:1.7;font-family:${C.font};">
      ${greeting}
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:${C.textMid};line-height:1.7;font-family:${C.font};">
      You just took the first step toward finding where your business is leaking money. Here's what happens next:
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;">
      <tr>
        ${stepCircle(1)}
        <td style="padding:10px 0 10px 12px;font-size:15px;color:${C.textMid};line-height:1.5;font-family:${C.font};">
          Complete a 2-minute diagnosis to tell us about your business
        </td>
      </tr>
      <tr>
        ${stepCircle(2)}
        <td style="padding:10px 0 10px 12px;font-size:15px;color:${C.textMid};line-height:1.5;font-family:${C.font};">
          Get your Revenue Health Score &mdash; a 0&ndash;100 rating across 5 pillars
        </td>
      </tr>
      <tr>
        ${stepCircle(3)}
        <td style="padding:10px 0 10px 12px;font-size:15px;color:${C.textMid};line-height:1.5;font-family:${C.font};">
          Unlock a personalized playbook with step-by-step fixes
        </td>
      </tr>
    </table>
    ${btn("Complete Your Score \u2192", `${BASE_URL()}/diagnosis`)}
    <p style="margin:0;font-size:13px;color:${C.textMuted};font-family:${C.font};">
      It only takes 2 minutes. No credit card required.
    </p>
  `);

  await sendEmail({
    to,
    subject: "Welcome to FixWorkFlow \u2014 let\u2019s find where your business is leaking money",
    html,
  });
}

// b. Score ready email — sent after first onboarding score
export async function sendScoreReadyEmail(
  to: string,
  score: number,
  weakestPillar: string,
  recommendation: string,
) {
  console.log("[EMAIL] sendScoreReadyEmail called for:", to, "score:", score);
  const pillarLabels: Record<string, string> = {
    revenue: "Revenue",
    profitability: "Profitability",
    retention: "Retention",
    acquisition: "Acquisition",
    ops: "Operations",
  };
  const pillarLabel = pillarLabels[weakestPillar] || weakestPillar;

  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${C.textDark};font-family:${C.font};">Your Revenue Health Score is ready</h1>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
      <td style="width:80px;height:80px;border-radius:50%;background:${C.primary};text-align:center;vertical-align:middle;line-height:80px;">
        <span style="font-size:32px;font-weight:900;color:#ffffff;font-family:${C.font};">${score}</span>
      </td>
      <td style="padding-left:20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.textMuted};letter-spacing:0.5px;font-family:${C.font};">OUT OF 100</p>
        <p style="margin:0;font-size:15px;color:${C.textMid};font-family:${C.font};">
          Your weakest area: <strong style="color:${C.textDark};">${pillarLabel}</strong>
        </p>
      </td>
    </tr></table>
    <div style="padding:14px 18px;background:#f8f9fc;border-radius:8px;border-left:3px solid ${C.primary};margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:${C.textMid};line-height:1.6;font-family:${C.font};">
        <strong style="color:${C.textDark};">Top recommendation:</strong> ${recommendation}
      </p>
    </div>
    ${btn("See Your Full Dashboard \u2192", `${BASE_URL()}/dashboard`)}
    <p style="margin:0;font-size:13px;color:${C.textMuted};font-family:${C.font};">
      Your dashboard includes playbooks, tool recommendations, and AI-powered insights.
    </p>
  `);

  await sendEmail({
    to,
    subject: `Your Revenue Health Score: ${score}/100`,
    html,
  });
}

// c. Password reset email
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
) {
  console.log("[EMAIL] sendPasswordResetEmail called for:", to);
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${C.textDark};font-family:${C.font};">Reset your password</h1>
    <p style="margin:0 0 20px;font-size:15px;color:${C.textMid};line-height:1.7;font-family:${C.font};">
      We received a request to reset the password for your FixWorkFlow account. Click the button below to choose a new password.
    </p>
    ${btn("Reset Password \u2192", resetUrl)}
    <p style="margin:0 0 8px;font-size:13px;color:${C.textMuted};font-family:${C.font};">
      This link expires in 1 hour.
    </p>
    <p style="margin:0;font-size:13px;color:${C.textMuted};font-family:${C.font};">
      If you didn't request this, you can safely ignore this email. Your password won't change.
    </p>
  `);

  await sendEmail({
    to,
    subject: "Reset your FixWorkFlow password",
    html,
  });
}

// d. Credit referral confirmation email
export async function sendCreditReferralConfirmationEmail(
  to: string,
  phone: string,
  name?: string | null,
) {
  console.log("[EMAIL] sendCreditReferralConfirmationEmail called for:", to);
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${C.textDark};font-family:${C.font};">Your credit assessment request has been submitted</h1>
    <p style="margin:0 0 8px;font-size:15px;color:${C.textMid};line-height:1.7;font-family:${C.font};">
      ${greeting}
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:${C.textMid};line-height:1.7;font-family:${C.font};">
      We have your phone on file: <strong style="color:${C.textDark};">${phone}</strong>
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:${C.textMid};line-height:1.7;font-family:${C.font};">
      A credit specialist from <strong style="color:${C.textDark};">Optimum Credit Solutions</strong> will reach out within 24 hours.
    </p>
    <div style="padding:18px 20px;background:#f8f9fc;border-radius:8px;border:1px solid ${C.border};margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${C.textMuted};letter-spacing:0.5px;font-family:${C.font};">WHAT HAPPENS NEXT</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          ${stepCircle(1)}
          <td style="padding:6px 0 6px 10px;font-size:14px;color:${C.textMid};line-height:1.5;font-family:${C.font};">A specialist reviews your profile</td>
        </tr>
        <tr>
          ${stepCircle(2)}
          <td style="padding:6px 0 6px 10px;font-size:14px;color:${C.textMid};line-height:1.5;font-family:${C.font};">They call you at <strong style="color:${C.textDark};">${phone}</strong></td>
        </tr>
        <tr>
          ${stepCircle(3)}
          <td style="padding:6px 0 6px 10px;font-size:14px;color:${C.textMid};line-height:1.5;font-family:${C.font};">You get a free credit assessment with no obligation</td>
        </tr>
      </table>
    </div>
    ${btn("View Your Dashboard \u2192", `${BASE_URL()}/dashboard`)}
  `);

  await sendEmail({
    to,
    subject: "Your credit assessment request has been submitted",
    html,
  });
}

// e. Weekly score update email
export async function sendWeeklyScoreUpdateEmail(
  to: string,
  score: number,
  previousScore: number,
  pillarChanges: { name: string; score: number; delta: number }[],
) {
  console.log("[EMAIL] sendWeeklyScoreUpdateEmail called for:", to, "score:", score);
  const delta = score - previousScore;
  const deltaIcon = delta > 0 ? "\u2191" : delta < 0 ? "\u2193" : "\u2014";
  const deltaText = delta > 0 ? `${deltaIcon}${delta} points from last week` : delta < 0 ? `${deltaIcon}${Math.abs(delta)} points from last week` : `${deltaIcon} No change`;
  const deltaColor = delta > 0 ? C.green : delta < 0 ? C.red : C.textMuted;
  const deltaSubject = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "no change";

  // Find weakest pillar
  const weakest = pillarChanges.length > 0
    ? pillarChanges.reduce((min, p) => (p.score < min.score ? p : min), pillarChanges[0])
    : null;

  const pillarLine = pillarChanges
    .map((p) => `${p.name}: ${p.score}`)
    .join(" | ");

  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${C.textDark};font-family:${C.font};">Weekly Score Update</h1>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr>
      <td style="width:64px;height:64px;border-radius:50%;background:${C.primary};text-align:center;vertical-align:middle;line-height:64px;">
        <span style="font-size:26px;font-weight:900;color:#ffffff;font-family:${C.font};">${score}</span>
      </td>
      <td style="padding-left:16px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.textMuted};letter-spacing:0.5px;font-family:${C.font};">REVENUE HEALTH SCORE</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:${deltaColor};font-family:${C.font};">
          ${deltaText}
        </p>
      </td>
    </tr></table>
    <div style="padding:14px 18px;background:#f8f9fc;border-radius:8px;border:1px solid ${C.border};margin-bottom:16px;">
      <p style="margin:0;font-size:13px;color:${C.textMuted};line-height:1.8;font-family:${C.font};">
        ${pillarLine}
      </p>
    </div>
    ${weakest ? `<p style="margin:0 0 20px;font-size:15px;color:${C.textMid};line-height:1.7;font-family:${C.font};">Your biggest opportunity this week: <strong style="color:${C.textDark};">${weakest.name}</strong></p>` : ""}
    ${btn("See Full Dashboard \u2192", `${BASE_URL()}/dashboard`)}
  `);

  await sendEmail({
    to,
    subject: `Your FixWorkFlow Weekly Update \u2014 Score: ${score}/100 (${deltaSubject})`,
    html,
  });
}

// ── Admin notification for credit referrals ──

export async function sendAdminCreditReferralNotification(referral: {
  name: string;
  email: string;
  phone: string;
  bestTimeToCall?: string | null;
  notes?: string | null;
  score?: number | null;
  businessType?: string | null;
}) {
  console.log("[EMAIL] sendAdminCreditReferralNotification called for referral:", referral.name);
  const adminEmail = process.env.ADMIN_EMAIL || "fixworkflows@gmail.com";

  const rows = [
    ["Name", referral.name],
    ["Email", referral.email],
    ["Phone", referral.phone],
    ...(referral.bestTimeToCall ? [["Best time", referral.bestTimeToCall]] : []),
    ...(referral.notes ? [["Notes", referral.notes]] : []),
    ...(referral.score != null ? [["Score", `${referral.score}/100`]] : []),
    ...(referral.businessType ? [["Business type", referral.businessType]] : []),
  ];

  const detailRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;font-size:13px;color:${C.textMuted};white-space:nowrap;border-bottom:1px solid ${C.border};font-family:${C.font};">${label}</td><td style="padding:8px 12px;font-size:14px;color:${C.textDark};font-weight:600;border-bottom:1px solid ${C.border};font-family:${C.font};">${value}</td></tr>`,
    )
    .join("");

  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${C.textDark};font-family:${C.font};">New Credit Referral</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${C.textMid};line-height:1.7;font-family:${C.font};">
      A new credit assessment request has been submitted. Please forward to Optimum Credit Solutions.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8f9fc;border-radius:8px;border:1px solid ${C.border};margin-bottom:24px;">
      ${detailRows}
    </table>
    ${btn("View in Admin \u2192", `${BASE_URL()}/admin/referrals`)}
  `);

  await sendEmail({
    to: adminEmail,
    subject: `New Credit Referral: ${referral.name}`,
    html,
  });
}

// ── Notification preference check helper ──

export async function shouldSendEmail(
  userId: string,
  prefKey: string,
): Promise<boolean> {
  // Lazy import to avoid circular deps
  const { prisma } = await import("@/lib/prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true },
  });

  if (!user) return false;

  const prefs =
    (user.notificationPrefs as Record<string, boolean> | null) || {};

  // Default to true if the pref has never been set
  return prefs[prefKey] !== false;
}
