'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Lock, Star } from 'lucide-react';
import type { ScoredProduct } from '@/lib/recommendations';
import LogoImg, { faviconUrl } from '@/components/ui/LogoImg';
import BookCover from '@/components/ui/BookCover';
import { useCreditReferral } from './CreditReferralContext';

interface Props {
  books: ScoredProduct[];
  courses: ScoredProduct[];
  templates: ScoredProduct[];
  isPremium: boolean;
  businessType: string;
  revenueRange: string;
  usesPersonalCredit?: string | null;
}

const tabs = [
  { key: 'book' as const, label: 'Books' },
  { key: 'course' as const, label: 'Courses' },
  { key: 'template' as const, label: 'Templates' },
];

const ctaLabel: Record<string, string> = {
  book: 'View on Amazon \u2197',
  course: 'Start Course \u2197',
  template: 'Get Free Template \u2197',
};

function formatBizType(bt: string): string {
  const m: Record<string, string> = { ecommerce: 'e-commerce', saas: 'SaaS', service_agency: 'service/agency', creator: 'creator', local_business: 'local business' };
  return m[bt] || bt;
}

function TemplateLogo({ size = 48 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: 'linear-gradient(135deg, #4361ee, #6366f1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4.5 14H12l-1 8L19.5 10H12l1-8z" fill="white" />
      </svg>
    </div>
  );
}

function ResourceCover({ item }: { item: ScoredProduct }) {
  if (item.type === 'book' && item.isbn) {
    return <BookCover isbn={item.isbn} fallbackEmoji={item.logo} />;
  }
  if (item.type === 'course' && item.domain) {
    return <LogoImg src={faviconUrl(item.domain, 64)} fallbackEmoji={item.logo} size={48} radius={10} />;
  }
  if (item.type === 'template' || item.isTemplate) {
    return <TemplateLogo size={48} />;
  }
  return (
    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
      {item.logo}
    </div>
  );
}

/** Pinned credit card inside the resource shelf — shares state with the featured CreditRepairCard */
function ShelfCreditCard() {
  const cr = useCreditReferral();

  if (cr.hidden && !cr.submitted) return null;

  if (cr.submitted) {
    return (
      <div
        style={{
          flex: '0 0 290px', padding: 18, borderRadius: 12,
          background: 'var(--bg-elevated)', border: '1px solid rgba(16,185,129,0.25)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>You&apos;re all set!</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flex: 1 }}>
          A credit specialist will reach out within 24 hours
          {cr.submittedPhone ? ` at ${cr.submittedPhone}` : ''}. No cost, no obligation.
        </p>
        <Link
          href="/settings"
          style={{ marginTop: 10, fontSize: 11, color: '#4361ee', textDecoration: 'underline' }}
        >
          Update my contact info
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: '0 0 290px', padding: 18, borderRadius: 12,
        background: 'var(--bg-elevated)', border: '1px solid rgba(67,97,238,0.2)',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4361ee'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(67,97,238,0.2)'; }}
    >
      {/* Icon + title */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          background: 'linear-gradient(135deg, #4361ee, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Your Credit May Be Costing Your Business</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: 'rgba(67,97,238,0.08)', color: '#4361ee', display: 'inline-block', marginTop: 4 }}>
            Financial Health
          </span>
        </div>
      </div>

      {/* Free badge row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: '#10b981' }}>Free</span>
        <span style={{ color: 'var(--border-default)' }}>&middot;</span>
        <span style={{ color: 'var(--text-muted)' }}>No obligation</span>
      </div>

      {/* Body */}
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flex: 1 }}>
        A credit specialist can review your profile and find ways to lower your rates and separate personal from business credit.
      </p>

      {cr.apiError && (
        <div style={{
          marginTop: 8, padding: '6px 10px', borderRadius: 6,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
          fontSize: 11, color: '#ef4444',
        }}>
          {cr.apiError}
        </div>
      )}

      {cr.needsPhone ? (
        /* Inline phone capture */
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
            We need your phone number so a specialist can reach you.
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="tel"
              value={cr.phoneInput}
              onChange={(e) => cr.setPhoneInput(e.target.value)}
              placeholder="(555) 123-4567"
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 7,
                border: `1px solid ${cr.phoneError ? '#ef4444' : 'var(--border-default)'}`,
                fontSize: 12, color: 'var(--text-primary)', outline: 'none',
                minWidth: 0,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4361ee'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = cr.phoneError ? '#ef4444' : 'var(--border-default)'; }}
            />
            <button
              onClick={cr.handlePhoneSubmit}
              disabled={cr.submitting}
              style={{
                padding: '8px 14px', borderRadius: 7,
                background: cr.submitting ? '#8d95a3' : '#4361ee',
                color: '#fff', fontSize: 11, fontWeight: 700,
                border: 'none', cursor: cr.submitting ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cr.submitting ? '...' : 'Submit'}
            </button>
          </div>
          {cr.phoneError && (
            <span style={{ fontSize: 10, color: '#ef4444', marginTop: 3, display: 'block' }}>{cr.phoneError}</span>
          )}
        </div>
      ) : (
        /* Primary + dismiss */
        <div style={{ marginTop: 12 }}>
          <button
            onClick={cr.handlePrimaryClick}
            disabled={cr.submitting}
            style={{
              padding: '8px 14px', borderRadius: 8,
              background: cr.submitting ? '#8d95a3' : '#4361ee',
              color: '#fff', fontSize: 12, fontWeight: 700,
              border: 'none', cursor: cr.submitting ? 'default' : 'pointer',
              alignSelf: 'flex-start',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!cr.submitting) e.currentTarget.style.background = '#3451de'; }}
            onMouseLeave={(e) => { if (!cr.submitting) e.currentTarget.style.background = '#4361ee'; }}
          >
            {cr.submitting ? 'Submitting...' : 'Yes, Have a Specialist Reach Out \u2192'}
          </button>
          <div style={{ marginTop: 8 }}>
            <button
              onClick={cr.handleDismiss}
              style={{
                fontSize: 11, color: 'var(--text-muted)', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Not right now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResourceShelf({ books, courses, templates, isPremium, businessType, revenueRange, usesPersonalCredit }: Props) {
  const [activeTab, setActiveTab] = useState<'book' | 'course' | 'template'>('book');

  const handleClick = useCallback((product: ScoredProduct) => {
    fetch('/api/affiliate/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: product.id, source: 'resource_shelf' }),
    }).catch(() => {});
    window.open(product.affiliateUrl, '_blank', 'noopener');
  }, []);

  const dataMap = { book: books, course: courses, template: templates };
  const items = dataMap[activeTab];
  const isLocked = !isPremium && activeTab !== 'book';
  const showCreditCard = activeTab === 'book' && (usesPersonalCredit === 'yes' || usesPersonalCredit === 'sometimes');

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>Resources For Your Stage</div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>Curated for {formatBizType(businessType)} businesses at {revenueRange}</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 9, padding: 3, marginBottom: 16 }}>
        {tabs.map(t => {
          const count = dataMap[t.key].length;
          const active = activeTab === t.key;
          const locked = !isPremium && t.key !== 'book';
          return (
            <button
              key={t.key}
              onClick={() => { if (!locked) setActiveTab(t.key); }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 7, border: 'none',
                cursor: locked ? 'default' : 'pointer',
                background: active ? 'var(--bg-card)' : 'transparent',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                opacity: locked ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {t.label} ({count}){locked && <span style={{ fontSize: 8, marginLeft: 4, padding: '1px 4px', borderRadius: 3, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontWeight: 700 }}>PRO</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLocked ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ marginBottom: 8 }}><Lock style={{ width: 28, height: 28, color: '#8b5cf6' }} /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {activeTab === 'course' ? 'Courses' : 'Templates'} are a Pro feature
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Unlock personalized {activeTab === 'course' ? 'learning paths' : 'business templates'} matched to your score.
          </div>
          <a href="/pricing" style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #4361ee)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            Upgrade to Pro
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {/* Pinned credit card for Books tab — disabled for now */}
          {/* {showCreditCard && <ShelfCreditCard />} */}
          {items.map(item => (
            <div
              key={item.id}
              style={{
                flex: '0 0 290px', padding: 18, borderRadius: 12,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; }}
            >
              {/* Cover + info */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <ResourceCover item={item} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</span>
                    {item.matchLabel && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${item.matchColor}14`, color: item.matchColor }}>{item.matchLabel}</span>
                    )}
                  </div>
                  {item.targetPillars[0] && (
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: 'rgba(67,97,238,0.08)', color: '#4361ee', display: 'inline-block', marginTop: 4 }}>
                      {item.targetPillars[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Price + Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: item.price === 'Free' || item.hasFreeTier ? '#10b981' : 'var(--text-primary)' }}>{item.price}</span>
                {item.rating && <><span style={{ color: 'var(--border-default)' }}>&middot;</span><Star style={{ width: 12, height: 12, fill: '#facc15', color: '#facc15', display: 'inline', verticalAlign: 'middle' }} /> <span style={{ color: 'var(--text-muted)' }}>{item.rating}</span></>}
                {item.reviewCount && <><span style={{ color: 'var(--border-default)' }}>&middot;</span><span style={{ color: 'var(--text-muted)' }}>{item.reviewCount}</span></>}
              </div>

              {/* Reasoning — fully visible */}
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flex: 1 }}>{item.filledReasoning}</p>

              {/* Affiliate button */}
              <button
                onClick={() => handleClick(item)}
                style={{
                  marginTop: 12, padding: '8px 14px', borderRadius: 8,
                  background: '#4361ee', color: '#fff', fontSize: 12, fontWeight: 700,
                  border: 'none', cursor: 'pointer', alignSelf: 'flex-start',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#3451de')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#4361ee')}
              >
                {ctaLabel[item.type] || 'View \u2197'}
              </button>
            </div>
          ))}
          {items.length === 0 && !showCreditCard && (
            <div style={{ width: '100%', textAlign: 'center', padding: '20px', fontSize: 13, color: 'var(--text-muted)' }}>
              No {activeTab}s matched for your profile yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
