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

// ── Core send helper ──

interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOpts) {
  const client = getResend();

  if (client) {
    try {
      const { error } = await client.emails.send({
        from: FROM,
        to,
        subject,
        html,
      });
      if (error) {
        console.error("[EMAIL] Resend error:", error);
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
<body style="margin:0;padding:0;background:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f8;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e9ef;">
<!-- Header -->
<tr><td style="padding:32px 40px 24px;border-bottom:1px solid #f0f0f0;">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="width:32px;height:32px;background:linear-gradient(135deg,#4361ee,#6366f1);border-radius:8px;text-align:center;vertical-align:middle;">
      <span style="color:#fff;font-size:16px;font-weight:700;">⚡</span>
    </td>
    <td style="padding-left:10px;font-size:18px;font-weight:700;color:#1b2434;">FixWorkFlow</td>
  </tr></table>
</td></tr>
<!-- Body -->
<tr><td style="padding:32px 40px;">
${body}
</td></tr>
<!-- Footer -->
<tr><td style="padding:24px 40px;background:#fafafa;border-top:1px solid #f0f0f0;">
  <p style="margin:0;font-size:12px;color:#8d95a3;line-height:1.6;">
    You're receiving this because you have a FixWorkFlow account.<br>
    <a href="${BASE_URL()}/settings" style="color:#4361ee;text-decoration:none;">Manage notification preferences</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
  <a href="${url}" style="display:inline-block;padding:14px 28px;background:#4361ee;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
    ${text}
  </a>
</td></tr></table>`;
}

// ── Email Templates ──

// a. Welcome email — sent after signup
export async function sendWelcomeEmail(to: string, name?: string | null) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1b2434;">Welcome to FixWorkFlow</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#5a6578;line-height:1.6;">
      ${greeting}
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#5a6578;line-height:1.6;">
      You just took the first step toward finding where your business is leaking money. Here's what happens next:
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
      <tr><td style="padding:8px 0;font-size:14px;color:#5a6578;line-height:1.5;">
        <strong style="color:#4361ee;">1.</strong> Complete a 2-minute diagnosis to tell us about your business
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#5a6578;line-height:1.5;">
        <strong style="color:#4361ee;">2.</strong> Get your Revenue Health Score — a 0-100 rating across 5 pillars
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#5a6578;line-height:1.5;">
        <strong style="color:#4361ee;">3.</strong> Unlock a personalized playbook with step-by-step fixes
      </td></tr>
    </table>
    ${button("Complete Your Score →", `${BASE_URL()}/diagnosis`)}
    <p style="margin:0;font-size:13px;color:#8d95a3;">
      It only takes 2 minutes. No credit card required.
    </p>
  `);

  await sendEmail({
    to,
    subject:
      "Welcome to FixWorkFlow — let's find where your business is leaking money",
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
  const pillarLabels: Record<string, string> = {
    revenue: "Revenue",
    profitability: "Profitability",
    retention: "Retention",
    acquisition: "Acquisition",
    ops: "Operations",
  };
  const pillarLabel = pillarLabels[weakestPillar] || weakestPillar;

  const scoreColor =
    score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1b2434;">Your Revenue Health Score is ready</h1>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
      <td style="width:80px;height:80px;border-radius:50%;background:${scoreColor};text-align:center;vertical-align:middle;">
        <span style="font-size:32px;font-weight:800;color:#ffffff;">${score}</span>
      </td>
      <td style="padding-left:20px;">
        <p style="margin:0 0 4px;font-size:13px;color:#8d95a3;">OUT OF 100</p>
        <p style="margin:0;font-size:15px;color:#5a6578;">
          Your weakest area: <strong style="color:#1b2434;">${pillarLabel}</strong>
        </p>
      </td>
    </tr></table>
    <div style="padding:16px;background:#f8f9fb;border-radius:8px;border:1px solid #e6e9ef;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#5a6578;line-height:1.5;">
        <strong style="color:#1b2434;">Top recommendation:</strong> ${recommendation}
      </p>
    </div>
    ${button("See Your Full Dashboard →", `${BASE_URL()}/dashboard`)}
    <p style="margin:0;font-size:13px;color:#8d95a3;">
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
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1b2434;">Reset your password</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#5a6578;line-height:1.6;">
      We received a request to reset the password for your FixWorkFlow account. Click the button below to choose a new password.
    </p>
    <p style="margin:0 0 8px;font-size:14px;color:#8d95a3;">
      This link expires in 1 hour.
    </p>
    ${button("Reset Password →", resetUrl)}
    <p style="margin:0;font-size:13px;color:#8d95a3;">
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
) {
  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1b2434;">Your credit assessment request is confirmed</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#5a6578;line-height:1.6;">
      We've received your request. A credit specialist will contact you within 24 hours at <strong style="color:#1b2434;">${phone}</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#5a6578;line-height:1.6;">
      In the meantime, keep working on your playbook — every improvement helps your Revenue Health Score.
    </p>
    ${button("Back to Dashboard →", `${BASE_URL()}/dashboard`)}
  `);

  await sendEmail({
    to,
    subject: "Your credit assessment request is confirmed",
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
  const delta = score - previousScore;
  const deltaStr =
    delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "no change";
  const deltaColor =
    delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : "#8d95a3";

  const pillarRows = pillarChanges
    .map((p) => {
      const pDelta = p.delta > 0 ? `+${p.delta}` : p.delta < 0 ? `${p.delta}` : "—";
      const pColor = p.delta > 0 ? "#22c55e" : p.delta < 0 ? "#ef4444" : "#8d95a3";
      return `<tr>
        <td style="padding:8px 0;font-size:14px;color:#5a6578;border-bottom:1px solid #f0f0f0;">${p.name}</td>
        <td style="padding:8px 0;font-size:14px;color:#1b2434;font-weight:600;text-align:center;border-bottom:1px solid #f0f0f0;">${p.score}</td>
        <td style="padding:8px 0;font-size:14px;color:${pColor};font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">${pDelta}</td>
      </tr>`;
    })
    .join("");

  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1b2434;">Weekly Score Update</h1>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
      <td>
        <p style="margin:0 0 4px;font-size:13px;color:#8d95a3;">YOUR REVENUE HEALTH SCORE</p>
        <p style="margin:0;font-size:40px;font-weight:800;color:#1b2434;line-height:1;">${score}</p>
      </td>
      <td style="padding-left:20px;vertical-align:bottom;">
        <span style="display:inline-block;padding:6px 12px;background:${deltaColor}15;color:${deltaColor};font-size:14px;font-weight:700;border-radius:20px;">
          ${deltaStr} from last week
        </span>
      </td>
    </tr></table>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <th style="padding:8px 0;font-size:12px;color:#8d95a3;text-align:left;border-bottom:2px solid #e6e9ef;">PILLAR</th>
        <th style="padding:8px 0;font-size:12px;color:#8d95a3;text-align:center;border-bottom:2px solid #e6e9ef;">SCORE</th>
        <th style="padding:8px 0;font-size:12px;color:#8d95a3;text-align:right;border-bottom:2px solid #e6e9ef;">CHANGE</th>
      </tr>
      ${pillarRows}
    </table>
    ${button("View Dashboard →", `${BASE_URL()}/dashboard`)}
  `);

  await sendEmail({
    to,
    subject: `Weekly Update: Your Revenue Health Score is ${score} (${deltaStr})`,
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
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "fixworkflows@gmail.com";

  const detailRows = [
    `<tr><td style="padding:6px 12px;font-size:13px;color:#8d95a3;white-space:nowrap;">Name</td><td style="padding:6px 12px;font-size:14px;color:#1b2434;font-weight:600;">${referral.name}</td></tr>`,
    `<tr><td style="padding:6px 12px;font-size:13px;color:#8d95a3;white-space:nowrap;">Email</td><td style="padding:6px 12px;font-size:14px;color:#1b2434;">${referral.email}</td></tr>`,
    `<tr><td style="padding:6px 12px;font-size:13px;color:#8d95a3;white-space:nowrap;">Phone</td><td style="padding:6px 12px;font-size:14px;color:#1b2434;font-weight:600;">${referral.phone}</td></tr>`,
    referral.bestTimeToCall
      ? `<tr><td style="padding:6px 12px;font-size:13px;color:#8d95a3;white-space:nowrap;">Best time</td><td style="padding:6px 12px;font-size:14px;color:#1b2434;">${referral.bestTimeToCall}</td></tr>`
      : "",
    referral.notes
      ? `<tr><td style="padding:6px 12px;font-size:13px;color:#8d95a3;white-space:nowrap;">Notes</td><td style="padding:6px 12px;font-size:14px;color:#5a6578;">${referral.notes}</td></tr>`
      : "",
  ].join("");

  const html = layout(`
    <h1 style="margin:0 0 16px;font-size:24px;color:#1b2434;">New Credit Referral</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#5a6578;line-height:1.6;">
      A new credit assessment request has been submitted. Please forward to Optimum.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8f9fb;border-radius:8px;border:1px solid #e6e9ef;margin-bottom:24px;">
      ${detailRows}
    </table>
    ${button("View in Admin →", `${BASE_URL()}/admin`)}
  `);

  await sendEmail({
    to: adminEmail,
    subject: `[FixWorkFlow] New Credit Referral: ${referral.name}`,
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
