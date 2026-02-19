import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — FixWorkFlow",
  description: "FixWorkFlow terms of service, acceptable use, and account policies.",
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f8", fontFamily: "var(--font-outfit, var(--font-geist-sans)), sans-serif" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e6e9ef" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #4361ee, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L4.5 14H12l-1 8L19.5 10H12l1-8z"/></svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#1b2434" }}>FixWorkFlow</span>
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1b2434", margin: "0 0 8px" }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: "#8d95a3", margin: "0 0 32px", fontStyle: "italic" }}>Last updated: February 2026</p>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e6e9ef", padding: "32px 28px" }}>
          <Section title="1. Account Creation">
            By creating an account on FixWorkFlow, you agree to provide accurate information and maintain the security of your login credentials. You are responsible for all activity under your account. You must be at least 18 years old to create an account.
          </Section>

          <Section title="2. Acceptable Use">
            You agree to use FixWorkFlow for lawful business purposes only. You may not attempt to reverse-engineer the scoring algorithm, scrape data, or use automated tools to access the service. You may not share your account credentials with others or create multiple accounts.
          </Section>

          <Section title="3. Intellectual Property">
            All content, scoring algorithms, playbook templates, and recommendations are the intellectual property of FixWorkFlow. Your business data remains your property. You grant FixWorkFlow a limited license to process your data for the purpose of providing the service.
          </Section>

          <Section title="4. Limitation of Liability">
            FixWorkFlow provides business insights and recommendations for informational purposes. We do not guarantee specific revenue outcomes. The Revenue Health Score and playbooks are advisory tools and should not be considered financial, legal, or professional advice. FixWorkFlow is not liable for business decisions made based on our recommendations.
          </Section>

          <Section title="5. Termination">
            You may delete your account at any time through Settings. FixWorkFlow reserves the right to suspend or terminate accounts that violate these terms. Upon termination, your data will be permanently deleted within 30 days.
          </Section>

          <Section title="6. Changes to Terms">
            We may update these terms from time to time. Material changes will be communicated via email or in-app notification. Continued use of the service after changes constitutes acceptance of the updated terms.
          </Section>

          <Section title="7. Affiliate Disclosure">
            FixWorkFlow participates in affiliate programs. Some tool and resource recommendations on the dashboard include affiliate links. When you click these links and make a purchase or sign up, FixWorkFlow may earn a commission at no additional cost to you. All recommendations are selected based on relevance to your business profile — we only recommend products we believe will genuinely help your business. Affiliate relationships do not influence your Revenue Health Score or pillar calculations.
          </Section>

          <Section title="8. Credit Partner Disclosure" last>
            The credit assessment recommendation is provided through our partner Optimum Credit Solutions. If you request an assessment, your contact information (name, email, phone) is shared with Optimum Credit Solutions solely for the purpose of providing you with a credit consultation. This is entirely optional and opt-in.
          </Section>
        </div>

        <p style={{ fontSize: 13, color: "#8d95a3", textAlign: "center", marginTop: 32 }}>
          Questions? Contact us at{" "}
          <a href="mailto:support@fixworkflow.com" style={{ color: "#4361ee", textDecoration: "none" }}>support@fixworkflow.com</a>
        </p>
      </main>
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 28, paddingBottom: last ? 0 : 28, borderBottom: last ? "none" : "1px solid #f0f2f6" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1b2434", margin: "0 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 15, color: "#5a6578", lineHeight: 1.7, margin: 0 }}>{children}</p>
    </div>
  );
}
