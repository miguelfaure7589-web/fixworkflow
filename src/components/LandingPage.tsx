'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ScorePreviewCard, { ScoreRing, PillarBars } from './landing/ScorePreviewCard';
import UserAvatarDropdown from './UserAvatarDropdown';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { Menu, X } from 'lucide-react';

const gradient = 'linear-gradient(135deg, #4361ee, #6366f1)';
const tint = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const painPoints = [
  { emoji: '📉', title: 'Revenue is flat or unpredictable', desc: "You're busy but income doesn't grow. No system to identify your highest-leverage revenue stream." },
  { emoji: '💸', title: 'Margins are shrinking', desc: 'Revenue looks fine but you keep less each month. Costs creep up without visibility.' },
  { emoji: '🚪', title: "Customers don't stick around", desc: 'Always chasing new customers because existing ones quietly leave. Acquisition costs climb.' },
  { emoji: '👻', title: 'Traffic but no conversions', desc: "People visit but don't buy. Can't tell if it's the offer, the funnel, or the pricing." },
  { emoji: '🔥', title: 'Operations eating your time', desc: "You're the bottleneck. Manual processes, no delegation, everything runs through you." },
  { emoji: '🎯', title: 'No idea what to fix first', desc: "You know something's wrong but you're guessing. Generic advice doesn't fit your situation." },
];

const howSteps = [
  { num: '01', accent: '#4361ee', title: 'Answer a few questions', desc: 'Tell us your business type, where you feel friction, and a few key metrics. Takes about 3 minutes.' },
  { num: '02', accent: '#8b5cf6', title: 'Get your Revenue Health Score', desc: "We score 5 pillars — Revenue, Profitability, Retention, Acquisition, Operations — to find where you're losing money." },
  { num: '03', accent: '#10b981', title: 'Follow your personalized playbook', desc: 'Step-by-step actions matched to your weakest pillar, with reasoning for every recommendation.' },
];

const reviewData = [
  { name: 'Marcus J.', role: 'Freelance Brand Strategist', type: 'Service', initials: 'MJ', color: '#4361ee',
    quote: 'I was spending $2k/mo on ads thinking I needed more traffic. FixWorkFlow showed me my conversion rate was the actual problem. Followed the playbook, fixed my checkout flow, and conversion went up 1.8% in three weeks. Same traffic, more revenue.',
    result: 'Conversion up 1.8% in 3 weeks' },
  { name: 'Sarah K.', role: 'Agency Owner 4-person team', type: 'Agency', initials: 'SK', color: '#8b5cf6',
    quote: 'The score was a wake-up call — 42 out of 100. My Operations pillar was dragging everything down. The playbook gave me specific steps to delegate. Six weeks later we went from $8k to $13.5k/mo and I work fewer hours.',
    result: '$8k → $13.5k/mo in 6 weeks' },
  { name: 'David R.', role: 'E-commerce Store Owner', type: 'E-commerce', initials: 'DR', color: '#10b981',
    quote: "Every business tool gives the same generic advice. This one actually used MY numbers — my margins, my conversion rate, my AOV — and showed me I was bleeding $3,200/mo in margin leaks I didn't know about.",
    result: 'Found $3,200/mo in margin leaks' },
];

const playbookSteps = [
  { label: 'Audit your current revenue streams', time: 'Day 1–2', done: true },
  { label: 'Identify your highest-margin offering', time: 'Day 3–5', done: false },
  { label: 'Create an upsell sequence', time: 'Day 6–10', done: false },
  { label: 'Test a price optimization', time: 'Day 11–15', done: false },
  { label: 'Launch a reactivation campaign', time: 'Day 16–30', done: false },
];

const avatars = [
  { initials: 'MJ', color: '#4361ee' }, { initials: 'SK', color: '#10b981' },
  { initials: 'DR', color: '#8b5cf6' }, { initials: 'AL', color: '#f59e0b' },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isSmall = isMobile || isTablet;
  const isLoggedIn = !!session?.user;
  const isAdmin = !!(session?.user as Record<string, unknown> | undefined)?.isAdmin;

  useEffect(() => {
    setVisible(true);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change or resize
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  const px = isMobile ? 16 : isTablet ? 24 : 40;

  return (
    <div style={{ fontFamily: 'var(--font-outfit, var(--font-geist-sans)), sans-serif', color: '#1b2434' }}>
      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, padding: `0 ${px}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrollY > 20 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrollY > 20 ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L4.5 14H12l-1 8L19.5 10H12l1-8z"/></svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#1b2434' }}>FixWorkFlow</span>
        </Link>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link href="/pricing" style={{ fontSize: 14, color: '#5a6578', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/blog" style={{ fontSize: 14, color: '#5a6578', textDecoration: 'none' }}>Blog</Link>
            <a href="#reviews" style={{ fontSize: 14, color: '#5a6578', textDecoration: 'none' }}>Reviews</a>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" style={{ fontSize: 14, color: '#5a6578', textDecoration: 'none' }}>Dashboard</Link>
                {isAdmin && (
                  <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>
                    Admin
                    <span style={{ fontSize: 9, fontWeight: 800, background: '#7c3aed', color: '#fff', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>ADMIN</span>
                  </Link>
                )}
                <UserAvatarDropdown user={session!.user!} />
              </>
            ) : (
              <>
                <Link href="/signup" style={{ fontSize: 13, color: '#4361ee', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
                <Link href="/signup" style={{ padding: '8px 18px', borderRadius: 9, background: gradient, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Get Your Score</Link>
              </>
            )}
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: '#1b2434' }}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </nav>

      {/* Mobile menu overlay */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, bottom: 0, zIndex: 99, background: '#fff', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          <Link href="/pricing" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 12px', fontSize: 16, color: '#1b2434', textDecoration: 'none', borderRadius: 10, fontWeight: 500 }}>Pricing</Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 12px', fontSize: 16, color: '#1b2434', textDecoration: 'none', borderRadius: 10, fontWeight: 500 }}>Blog</Link>
          <a href="#reviews" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 12px', fontSize: 16, color: '#1b2434', textDecoration: 'none', borderRadius: 10, fontWeight: 500 }}>Reviews</a>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 12px', fontSize: 16, color: '#1b2434', textDecoration: 'none', borderRadius: 10, fontWeight: 500 }}>Dashboard</Link>
              <Link href="/settings" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 12px', fontSize: 16, color: '#1b2434', textDecoration: 'none', borderRadius: 10, fontWeight: 500 }}>Settings</Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 12px', fontSize: 16, color: '#7c3aed', textDecoration: 'none', borderRadius: 10, fontWeight: 600 }}>Admin</Link>
              )}
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 12px', fontSize: 16, color: '#1b2434', textDecoration: 'none', borderRadius: 10, fontWeight: 500 }}>Sign In</Link>
              <div style={{ marginTop: 8 }}>
                <Link href="/signup" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 0', borderRadius: 11, background: gradient, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>Get Your Free Score</Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* HERO */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e6e9ef', paddingTop: isMobile ? 80 : 120, paddingBottom: isMobile ? 48 : 80, minHeight: isMobile ? 'auto' : '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: `0 ${px}px`, display: 'flex', flexDirection: isSmall ? 'column' : 'row', gap: isMobile ? 32 : 70, alignItems: 'center' }}>
          <div style={{ flex: 1, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s, transform 0.8s', textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>Free — no credit card required</span>
            </div>
            <h1 style={{ fontSize: isMobile ? 32 : isTablet ? 40 : 50, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.08, margin: '0 0 20px' }}>
              Your business is<br /><span style={{ color: '#4361ee' }}>leaking money.</span><br />We&apos;ll show you where.
            </h1>
            <p style={{ fontSize: isMobile ? 15 : 17, color: '#5a6578', maxWidth: isMobile ? undefined : 440, margin: isMobile ? '0 auto 28px' : '0 0 28px', lineHeight: 1.6 }}>
              Get a Revenue Health Score based on your real metrics. See which of 5 pillars is holding you back. Follow a step-by-step playbook to fix it.
            </p>
            <Link href="/signup" style={{ display: 'inline-block', padding: isMobile ? '14px 28px' : '16px 32px', borderRadius: 12, background: gradient, color: '#fff', fontSize: isMobile ? 15 : 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(67,97,238,0.25)' }}>
              Get Your Free Score →
            </Link>
            <p style={{ fontSize: 12, color: '#b4bac5', marginTop: 12 }}>Takes 3 minutes · Personalized playbook · No credit card</p>
            <div style={{ paddingTop: 24, borderTop: '1px solid #f0f2f6', marginTop: 32, display: 'flex', alignItems: 'center', gap: 12, justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex' }}>
                {avatars.map((a, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: a.color, border: '2px solid #fff', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{a.initials}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 2 }}>{[...Array(5)].map((_, i) => <span key={i} style={{ color: '#facc15', fontSize: 14 }}>★</span>)}</div>
              <span style={{ fontSize: 12, color: '#8d95a3' }}>Trusted by 850+ businesses</span>
            </div>
          </div>
          {!isMobile && (
            <div style={{ flex: isTablet ? '0 0 300px' : '0 0 360px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s 0.3s, transform 0.8s 0.3s' }}>
              <ScorePreviewCard />
            </div>
          )}
        </div>
      </section>

      {/* PAIN POINTS */}
      <section style={{ background: '#fafbfd', padding: `${isMobile ? 60 : 100}px ${px}px` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, letterSpacing: -0.8, margin: '0 0 10px' }}>
            Most business owners don&apos;t know where they&apos;re losing money.
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 15, color: '#8d95a3', maxWidth: 500, margin: '0 auto 40px' }}>
            These are the 5 areas where small businesses bleed profit without realizing it.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 14 }}>
            {painPoints.map((p, i) => (
              <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                style={{ background: '#fff', borderRadius: 14, border: '1px solid #e6e9ef', padding: isMobile ? '20px 18px' : '24px 22px', textAlign: 'left', cursor: 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  transform: hovered === i ? 'translateY(-2px)' : 'none',
                  boxShadow: hovered === i ? '0 8px 24px rgba(0,0,0,0.05)' : 'none' }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{p.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: '#5a6578', lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 15, color: '#5a6578', marginTop: 36 }}>
            Your Revenue Health Score pinpoints exactly which area is costing you the most.
          </p>
          <Link href="/signup" style={{ display: 'inline-block', marginTop: 16, padding: '14px 28px', borderRadius: 11, background: gradient, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Find Your Score →
          </Link>
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section style={{ background: '#fff', borderTop: '1px solid #f0f2f6', borderBottom: '1px solid #f0f2f6', padding: `${isMobile ? 48 : 80}px ${px}px` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 900, margin: '0 0 10px' }}>This is what you&apos;ll see in 3 minutes.</h2>
          <p style={{ fontSize: isMobile ? 14 : 15, color: '#5a6578', margin: '0 0 36px' }}>Not a vague report. A specific score, your weakest pillar, and a playbook to fix it.</p>
          <div style={{ background: '#fafbfd', borderRadius: isMobile ? 14 : 18, border: '1px solid #e6e9ef', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', padding: isMobile ? '20px 16px' : '28px 32px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 20 : 28, textAlign: 'left' }}>
            <div style={{ flex: isMobile ? undefined : '0 0 260px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <ScoreRing size={isMobile ? 90 : 110} score={66} />
              </div>
              <PillarBars barHeight={4} />
              <div style={{ marginTop: 14, padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.05)', fontSize: 12, color: '#ef4444' }}>
                ⚠ Primary risk: Operations (45)
              </div>
            </div>
            <div style={{ flex: 1, borderLeft: isMobile ? 'none' : '1px solid #e6e9ef', borderTop: isMobile ? '1px solid #e6e9ef' : 'none', paddingLeft: isMobile ? 0 : 28, paddingTop: isMobile ? 20 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: '#8d95a3', textTransform: 'uppercase' as const }}>Your Playbook</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(67,97,238,0.08)', color: '#4361ee' }}>REVENUE</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Revenue Surge Sprint</div>
              <div style={{ fontSize: 12, color: '#8d95a3', marginBottom: 16 }}>5 steps · 10–25% revenue increase in 30 days</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {playbookSteps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: s.done ? '#10b981' : '#f0f2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: s.done ? '#8d95a3' : '#1b2434', textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#b4bac5' }}>{s.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: '8px 10px', borderRadius: 8, background: 'rgba(67,97,238,0.05)', fontSize: 12, color: '#4361ee' }}>
                ↗ Expected: $1,200–3,100/mo additional revenue
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#fafbfd', padding: `${isMobile ? 60 : 100}px ${px}px` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 900, margin: '0 0 10px' }}>Three minutes to clarity.</h2>
          <p style={{ fontSize: isMobile ? 14 : 15, color: '#8d95a3', margin: '0 0 40px' }}>No consultants. No guesswork. Just your numbers and a plan.</p>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
            {howSteps.map((s) => (
              <div key={s.num} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#fff', borderRadius: 14, border: '1px solid #e6e9ef', padding: isMobile ? '22px 20px' : '28px 24px', textAlign: 'left' }}>
                <div style={{ position: 'absolute', top: -10, right: -6, fontSize: 76, fontWeight: 900, color: 'rgba(0,0,0,0.025)', lineHeight: 1 }}>{s.num}</div>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: tint(s.accent, 0.08), border: `1px solid ${tint(s.accent, 0.15)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: s.accent, marginBottom: 14 }}>{s.num}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#5a6578', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section id="reviews" style={{ background: '#fff', borderTop: '1px solid #f0f2f6', padding: `${isMobile ? 48 : 80}px ${px}px` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 20 : 52, marginBottom: 48 }}>
            {[
              { n: '850+', l: 'Businesses scored' },
              { n: '4.9/5', l: 'Average rating', star: true },
              { n: '$2.4M', l: 'Revenue unlocked' },
              { n: '89%', l: 'Improved their score' },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, letterSpacing: -0.5 }}>
                  {s.n}{s.star && <span style={{ color: '#facc15' }}> ★</span>}
                </div>
                <div style={{ fontSize: 11, color: '#8d95a3', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <h2 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, margin: '0 0 28px' }}>Real businesses. Real results.</h2>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
            {reviewData.map((r) => (
              <div key={r.initials} style={{ flex: 1, background: '#fafbfd', borderRadius: 14, border: '1px solid #e6e9ef', padding: isMobile ? 18 : 22, textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                  {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#facc15', fontSize: 13 }}>★</span>)}
                </div>
                <p style={{ fontSize: 13, color: '#5a6578', lineHeight: 1.7, margin: '0 0 14px' }}>
                  &ldquo;{r.quote}&rdquo;
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.06)', fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 14 }}>
                  ↗ {r.result}
                </div>
                <div style={{ borderTop: '1px solid #e6e9ef', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{r.initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#8d95a3' }}>{r.role}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: tint(r.color, 0.06), color: r.color, flexShrink: 0 }}>{r.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ background: '#fafbfd', borderTop: '1px solid #e6e9ef', padding: `${isMobile ? 60 : 80}px ${px}px` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, letterSpacing: -0.8, margin: '0 0 12px', textAlign: 'center' }}>
            About FixWorkFlow
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 15, color: '#8d95a3', textAlign: 'center', margin: '0 0 40px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Built for business owners who are tired of guessing.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ borderLeft: '4px solid #4361ee', paddingLeft: isMobile ? 16 : 24, paddingTop: 2, paddingBottom: 2 }}>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#1b2434', marginBottom: 8 }}>What is FixWorkFlow?</div>
              <p style={{ fontSize: isMobile ? 14 : 15, color: '#5a6578', lineHeight: 1.7, margin: 0 }}>
                FixWorkFlow is a revenue diagnostics platform for small businesses. We score five core pillars of your business — Revenue, Profitability, Retention, Acquisition, and Operations — to pinpoint exactly where you&apos;re losing money. Then we give you a step-by-step playbook to fix it.
              </p>
            </div>
            <div style={{ borderLeft: '4px solid #4361ee', paddingLeft: isMobile ? 16 : 24, paddingTop: 2, paddingBottom: 2 }}>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#1b2434', marginBottom: 8 }}>Who is it for?</div>
              <p style={{ fontSize: isMobile ? 14 : 15, color: '#5a6578', lineHeight: 1.7, margin: 0 }}>
                Freelancers, agency owners, e-commerce sellers, coaches, and any small business owner doing $5K–$100K/month who knows something is off but can&apos;t figure out what. If you&apos;ve ever Googled &ldquo;how to grow my business&rdquo; and gotten useless generic advice, this is for you.
              </p>
            </div>
            <div style={{ borderLeft: '4px solid #4361ee', paddingLeft: isMobile ? 16 : 24, paddingTop: 2, paddingBottom: 2 }}>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#1b2434', marginBottom: 8 }}>Why it works</div>
              <p style={{ fontSize: isMobile ? 14 : 15, color: '#5a6578', lineHeight: 1.7, margin: 0 }}>
                We don&apos;t give cookie-cutter advice. Your Revenue Health Score is calculated from your real numbers — your margins, your conversion rate, your churn. Every recommendation is matched to your weakest pillar, your business type, and your revenue stage. That&apos;s why our users see results in weeks, not months.
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/signup" style={{ display: 'inline-block', padding: isMobile ? '14px 28px' : '16px 32px', borderRadius: 12, background: gradient, color: '#fff', fontSize: isMobile ? 15 : 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(67,97,238,0.25)' }}>
              Get Your Free Score →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e6e9ef', padding: `${isMobile ? 24 : 32}px ${px}px`, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M13 2L4.5 14H12l-1 8L19.5 10H12l1-8z"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#8d95a3' }}>FixWorkFlow</span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/terms" style={{ fontSize: 13, color: '#8d95a3', textDecoration: 'none' }}>Terms</Link>
          <Link href="/privacy" style={{ fontSize: 13, color: '#8d95a3', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/refund-policy" style={{ fontSize: 13, color: '#8d95a3', textDecoration: 'none' }}>Refund Policy</Link>
          <a href="mailto:support@fixworkflow.com" style={{ fontSize: 13, color: '#8d95a3', textDecoration: 'none' }}>Contact</a>
        </div>
        <span style={{ fontSize: 12, color: '#b4bac5' }}>© 2026 FixWorkFlow</span>
      </footer>
    </div>
  );
}
