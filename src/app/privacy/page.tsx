import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — FixWorkFlow",
  description: "How FixWorkFlow collects, uses, and protects your data.",
};

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px" }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 32px", fontStyle: "italic" }}>Last updated: February 2026</p>

        <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-default)", padding: "32px 28px" }}>
          <Section title="Data We Collect">
            We collect the information you provide during account creation and onboarding: name, email address, business type, revenue range, and optional metrics such as margins, conversion rate, and traffic. We also collect usage data including page views, feature interactions, and session duration.
          </Section>

          <Section title="How We Use Your Data">
            Your business metrics are used to calculate your Revenue Health Score, generate personalized playbooks, and match tool recommendations. Usage data helps us improve the product and identify common pain points. We may use aggregated, anonymized data for benchmarking.
          </Section>

          <Section title="Third-Party Sharing">
            We do not sell your personal information. Affiliate partners receive click data only (which tool was clicked, from which page) — never your personal information or business metrics without your explicit consent. If you opt into the credit assessment, your contact information is shared with Optimum Credit Solutions solely for that purpose.
          </Section>

          <Section title="Data Retention & Deletion">
            Your data is retained for as long as your account is active. When you delete your account, all personal data and business metrics are permanently removed within 30 days. Anonymized aggregate data may be retained for analytics.
          </Section>

          <Section title="Cookies">
            We use essential cookies for authentication and session management. We use analytics cookies to understand usage patterns. You can control cookie settings in your browser.
          </Section>

          <Section title="Contact" last>
            For privacy concerns or data requests, contact us at{" "}
            <a href="mailto:privacy@fixworkflow.com" style={{ color: "#4361ee", textDecoration: "none" }}>privacy@fixworkflow.com</a>.
          </Section>
        </div>
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
