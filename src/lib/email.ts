export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "noreply@fixworkflow.com",
        to: email,
        subject: "Reset your password",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Click the link below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #4361ee; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reset Password
            </a>
            <p style="color: #666; font-size: 13px; margin-top: 24px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("Failed to send email via Resend:", await res.text());
    }
  } else {
    console.log(`\n[DEV] Password reset link for ${email}:\n${resetUrl}\n`);
  }
}
