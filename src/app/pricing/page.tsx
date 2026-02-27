"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Zap, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import UserAvatarDropdown from "@/components/UserAvatarDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/useMediaQuery";

const freeFeatures = [
  "Revenue Health Score",
  "5-pillar breakdown",
  "Top 2 pillar insights",
  "2 playbook steps",
  "1 tool recommendation",
  "Weekly score updates with integrations",
];

const proFeatures = [
  "Everything in Free",
  "AI Business Summary",
  "Full 5-step playbooks",
  "All tool recommendations with reasoning",
  "Deep reasoning on every insight",
  "Score projections",
  "Progress tracking over time",
  "All resource recommendations (courses, templates)",
  "Priority support",
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from Settings. You keep Pro access until the end of your billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit cards via Stripe.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan is unlimited — use it as long as you want. Upgrade when you need deeper insights.",
  },
  {
    q: "Can I switch plans?",
    a: "Upgrade or downgrade anytime from Settings.",
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const isPremium = !!(session?.user as Record<string, unknown> | undefined)?.isPremium;
  const isLoggedIn = !!session?.user;
  const isAdmin = !!(session?.user as Record<string, unknown> | undefined)?.isAdmin;
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const isMobile = useIsMobile();

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "var(--font-outfit, var(--font-geist-sans)), sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-default)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "12px 16px" : "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, background: "linear-gradient(135deg, #4361ee, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap style={{ width: isMobile ? 16 : 20, height: isMobile ? 16 : 20, color: "#fff" }} />
            </div>
            <span style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: "var(--text-primary)" }}>FixWorkFlow</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>Dashboard</Link>
                {isAdmin && (
                  <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>
                    Admin
                    <span style={{ fontSize: 9, fontWeight: 800, background: "#7c3aed", color: "#fff", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>ADMIN</span>
                  </Link>
                )}
                <ThemeToggle />
                <UserAvatarDropdown user={session.user!} />
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link
                  href="/signup"
                  style={{ padding: "8px 20px", borderRadius: 9, background: "linear-gradient(135deg, #4361ee, #6366f1)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  Get Your Score
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: isMobile ? "32px 16px" : "64px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? 28 : 48 }}>
          <h1 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 12px", letterSpacing: -0.5 }}>
            Simple pricing. Powerful results.
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 17, color: "var(--text-secondary)", margin: 0 }}>
            Start free. Upgrade when you want the full picture.
          </p>
        </div>

        {/* Plan Cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 24 }}>
          {/* Free Plan */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 16, padding: isMobile ? 24 : 32, order: isMobile ? 2 : 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>Free</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px" }}>Everything you need to get started</p>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: "var(--text-primary)" }}>$0</span>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}> /forever</span>
            </div>
            {isLoggedIn && !isPremium ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "12px 24px", borderRadius: 10,
                background: "var(--bg-subtle)", color: "var(--text-muted)",
                fontSize: 14, fontWeight: 600, marginBottom: 32,
              }}>
                Current Plan
              </div>
            ) : !isLoggedIn ? (
              <Link
                href="/signup"
                style={{
                  display: "block", textAlign: "center",
                  padding: "12px 24px", borderRadius: 10,
                  background: "var(--bg-subtle)", color: "var(--text-primary)",
                  fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 32,
                  transition: "background 0.15s",
                }}
              >
                Get Started
              </Link>
            ) : (
              <div style={{ marginBottom: 32 }} />
            )}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {freeFeatures.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                  <Check style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div style={{ background: "var(--bg-card)", border: "2px solid #4361ee", borderRadius: 16, padding: isMobile ? 24 : 32, position: "relative", order: isMobile ? 1 : 2 }}>
            <div style={{
              position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
              padding: "4px 14px", borderRadius: 20,
              background: "linear-gradient(135deg, #4361ee, #6366f1)",
              color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
            }}>
              MOST POPULAR
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>Pro</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px" }}>The full revenue intelligence suite</p>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: "var(--text-primary)" }}>$19.99</span>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}> /month</span>
            </div>
            {isPremium ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "12px 24px", borderRadius: 10,
                background: "rgba(16,185,129,0.08)", color: "#10b981",
                fontSize: 14, fontWeight: 600, marginBottom: 32,
              }}>
                <Check style={{ width: 14, height: 14 }} />
                Current Plan
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "12px 24px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #4361ee, #6366f1)",
                  color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  marginBottom: 32, opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? "Redirecting..." : "Upgrade to Pro"}
                {!loading && <ArrowRight style={{ width: 16, height: 16 }} />}
              </button>
            )}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {proFeatures.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                  <Check style={{ width: 16, height: 16, color: "#4361ee", flexShrink: 0, marginTop: 2 }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: isMobile ? "32px auto 0" : "64px auto 0" }}>
          <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "var(--text-primary)", textAlign: "center", margin: isMobile ? "0 0 20px" : "0 0 32px" }}>
            Frequently asked questions
          </h2>
          <div>
            {faqs.map((faq, i) => (
              <div key={faq.q} style={{ borderBottom: "1px solid var(--border-default)" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "16px 0", border: "none", background: "none",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{faq.q}</span>
                  <ChevronDown
                    style={{
                      width: 18, height: 18, color: "var(--text-muted)", flexShrink: 0,
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
                {openFaq === i && (
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.6 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: isMobile ? 32 : 64 }}>
          <p style={{ fontSize: isMobile ? 15 : 17, color: "var(--text-secondary)", margin: "0 0 20px" }}>
            Start with the free plan and upgrade when you are ready.
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 10,
              background: "linear-gradient(135deg, #4361ee, #6366f1)",
              color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none",
            }}
          >
            Get Your Free Score
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
