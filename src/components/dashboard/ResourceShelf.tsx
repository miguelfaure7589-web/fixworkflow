'use client';

import { useState, useCallback } from 'react';
import type { ScoredProduct } from '@/lib/recommendations';
import LogoImg, { faviconUrl } from '@/components/ui/LogoImg';
import BookCover from '@/components/ui/BookCover';

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
  book: 'View on Amazon ↗',
  course: 'Start Course ↗',
  template: 'Get Free Template ↗',
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
    <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f4f5f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
      {item.logo}
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

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e6e9ef', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: '#8d95a3', textTransform: 'uppercase' as const }}>Resources For Your Stage</div>
        <div style={{ fontSize: 12, color: '#b4bac5', marginTop: 2 }}>Curated for {formatBizType(businessType)} businesses at {revenueRange}</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', background: '#f4f5f8', borderRadius: 9, padding: 3, marginBottom: 16 }}>
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
                background: active ? '#fff' : 'transparent',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? '#1b2434' : '#8d95a3',
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
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1b2434', marginBottom: 4 }}>
            {activeTab === 'course' ? 'Courses' : 'Templates'} are a Pro feature
          </div>
          <div style={{ fontSize: 12, color: '#8d95a3', marginBottom: 16 }}>
            Unlock personalized {activeTab === 'course' ? 'learning paths' : 'business templates'} matched to your score.
          </div>
          <a href="/pricing" style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #4361ee)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            Upgrade to Pro
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {/* Pinned credit card for Books tab */}
          {activeTab === 'book' && (usesPersonalCredit === 'yes' || usesPersonalCredit === 'sometimes') && (
            <div
              style={{
                flex: '0 0 290px', padding: 18, borderRadius: 12,
                background: '#fafbfd', border: '1px solid rgba(67,97,238,0.2)',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4361ee'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(67,97,238,0.2)'; }}
            >
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
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1b2434' }}>Free Credit Assessment</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Recommended</span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: 'rgba(67,97,238,0.08)', color: '#4361ee', display: 'inline-block', marginTop: 4 }}>
                    Financial Health
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: '#10b981' }}>Free</span>
                <span style={{ color: '#d0d5dd' }}>&middot;</span>
                <span style={{ color: '#8d95a3' }}>No obligation</span>
              </div>
              <p style={{ fontSize: 12, color: '#5a6578', lineHeight: 1.6, margin: 0, flex: 1 }}>
                You&apos;re using personal credit for business expenses. A specialist can review your credit profile and identify ways to save on interest while building stronger business credit.
              </p>
              <button
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  marginTop: 12, padding: '8px 14px', borderRadius: 8,
                  background: '#4361ee', color: '#fff', fontSize: 12, fontWeight: 700,
                  border: 'none', cursor: 'pointer', alignSelf: 'flex-start',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#3451de')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#4361ee')}
              >
                Get Assessment ↗
              </button>
            </div>
          )}
          {items.map(item => (
            <div
              key={item.id}
              style={{
                flex: '0 0 290px', padding: 18, borderRadius: 12,
                background: '#fafbfd', border: '1px solid #f0f2f6',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d0d5dd'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f0f2f6'; }}
            >
              {/* Cover + info */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <ResourceCover item={item} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1b2434' }}>{item.name}</span>
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
                <span style={{ fontWeight: 600, color: item.price === 'Free' || item.hasFreeTier ? '#10b981' : '#1b2434' }}>{item.price}</span>
                {item.rating && <><span style={{ color: '#d0d5dd' }}>&middot;</span><span style={{ color: '#facc15' }}>★</span> <span style={{ color: '#8d95a3' }}>{item.rating}</span></>}
                {item.reviewCount && <><span style={{ color: '#d0d5dd' }}>&middot;</span><span style={{ color: '#8d95a3' }}>{item.reviewCount}</span></>}
              </div>

              {/* Reasoning — fully visible */}
              <p style={{ fontSize: 12, color: '#5a6578', lineHeight: 1.6, margin: 0, flex: 1 }}>{item.filledReasoning}</p>

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
                {ctaLabel[item.type] || 'View ↗'}
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ width: '100%', textAlign: 'center', padding: '20px', fontSize: 13, color: '#8d95a3' }}>
              No {activeTab}s matched for your profile yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
