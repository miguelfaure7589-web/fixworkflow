import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — FixWorkFlow",
  description: "Get in touch with the FixWorkFlow team.",
};

export default function ContactPage() {
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
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px" }}>Contact Us</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: "0 0 32px", lineHeight: 1.6 }}>
          Have a question, issue, or just want to say hi? We&apos;d love to hear from you.
        </p>

        <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-default)", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
          <ContactRow
            label="General Support"
            email="support@fixworkflow.com"
            desc="Billing, account issues, feature questions, or bug reports."
          />
          <div style={{ borderTop: "1px solid var(--border-light)" }} />
          <ContactRow
            label="Privacy & Data Requests"
            email="privacy@fixworkflow.com"
            desc="Data export, deletion requests, or privacy concerns."
          />
          <div style={{ borderTop: "1px solid var(--border-light)" }} />
          <ContactRow
            label="Partnerships"
            email="fixworkflows@gmail.com"
            desc="Affiliate programs, integrations, or business inquiries."
          />
        </div>

        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", marginTop: 32, lineHeight: 1.6 }}>
          We typically respond within 24 hours on business days.
        </p>
      </main>
    </div>
  );
}

function ContactRow({ label, email, desc }: { label: string; email: string; desc: string }) {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>{label}</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 8px" }}>{desc}</p>
      <a
        href={`mailto:${email}`}
        style={{ display: "inline-block", fontSize: 15, color: "#4361ee", textDecoration: "none", fontWeight: 600 }}
      >
        {email}
      </a>
    </div>
  );
}
