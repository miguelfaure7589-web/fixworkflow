import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — FixWorkFlow",
  description: "FixWorkFlow Pro subscription cancellation and refund policy.",
};

export default function RefundPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "var(--font-outfit, var(--font-geist-sans)), sans-serif" }}>
      <nav style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-default)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #4361ee, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L4.5 14H12l-1 8L19.5 10H12l1-8z"/></svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>FixWorkFlow</span>
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px" }}>Refund & Cancellation Policy</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 32px", fontStyle: "italic" }}>Last updated: February 2026</p>

        <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-default)", padding: "32px 28px" }}>
          <Section title="Cancellation">
            FixWorkFlow Pro subscriptions can be cancelled at any time from your account settings. Upon cancellation, you retain access to all Pro features until the end of your current billing period. No further charges will be made after cancellation.
          </Section>

          <Section title="Refunds">
            We do not offer partial refunds for unused time on your subscription. Your Pro access continues through the end of the billing cycle you already paid for.
          </Section>

          <Section title="Billing Errors">
            If you believe you were charged in error — for example, a duplicate charge or a charge after successful cancellation — please contact us at{" "}
            <a href="mailto:support@fixworkflow.com" style={{ color: "#4361ee", textDecoration: "none" }}>support@fixworkflow.com</a>{" "}
            and we will investigate and resolve it promptly.
          </Section>

          <Section title="Free Plan" last>
            The FixWorkFlow Free plan is always free with no credit card required. You can use it indefinitely and upgrade to Pro at any time.
          </Section>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", marginTop: 32 }}>
          Need help?{" "}
          <a href="mailto:support@fixworkflow.com" style={{ color: "#4361ee", textDecoration: "none" }}>support@fixworkflow.com</a>
        </p>
      </main>
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 28, paddingBottom: last ? 0 : 28, borderBottom: last ? "none" : "1px solid var(--border-light)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{children}</p>
    </div>
  );
}
