'use client';

import Link from 'next/link';
import { useCreditReferral } from './CreditReferralContext';

interface Props {
  usesPersonalCredit: string | null;
}

export default function CreditRepairCard({ usesPersonalCredit }: Props) {
  const cr = useCreditReferral();

  if (usesPersonalCredit !== 'yes') return null;
  if (cr.hidden && !cr.submitted) return null;

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: '#fff', borderRadius: 14, border: '1px solid #e6e9ef',
      padding: '24px 24px 24px 28px', marginBottom: 18,
    }}>
      {/* Left accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        borderRadius: '14px 0 0 14px',
        background: 'linear-gradient(180deg, #4361ee, #6366f1)',
      }} />

      {/* Header badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.6, color: '#8d95a3', textTransform: 'uppercase' as const }}>Financial Health</span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Recommended for you</span>
      </div>

      {cr.submitted ? (
        /* ── Confirmation state ── */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1b2434', margin: 0 }}>
              You&apos;re all set!
            </h3>
          </div>
          <p style={{ fontSize: 13, color: '#5a6578', lineHeight: 1.7, marginBottom: 12 }}>
            A credit specialist from our partner will reach out to you within 24 hours
            {cr.submittedPhone ? ` at ${cr.submittedPhone}` : ''}. No cost, no obligation.
          </p>
          <Link
            href="/settings"
            style={{ fontSize: 12, color: '#4361ee', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Update my contact info
          </Link>
        </div>
      ) : (
        /* ── Default state ── */
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1b2434', marginBottom: 4, lineHeight: 1.3 }}>
            Your Credit May Be Costing Your Business
          </h3>
          <p style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 12 }}>
            Free &middot; No obligation &middot; Takes 2 minutes
          </p>
          <p style={{ fontSize: 13, color: '#5a6578', lineHeight: 1.7, marginBottom: 16 }}>
            You mentioned using personal credit for business expenses. A credit specialist can review your profile and find ways to lower your rates, improve your terms, and separate personal from business credit.
          </p>

          {cr.apiError && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
              fontSize: 12, color: '#ef4444', marginBottom: 12,
            }}>
              {cr.apiError}
            </div>
          )}

          {cr.needsPhone ? (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#5a6578', marginBottom: 8 }}>
                We need your phone number so a specialist can reach you.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="tel"
                  value={cr.phoneInput}
                  onChange={(e) => cr.setPhoneInput(e.target.value)}
                  placeholder="(555) 123-4567"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 9,
                    border: `1px solid ${cr.phoneError ? '#ef4444' : '#e6e9ef'}`,
                    fontSize: 14, color: '#1b2434', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#4361ee'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = cr.phoneError ? '#ef4444' : '#e6e9ef'; }}
                />
                <button
                  onClick={cr.handlePhoneSubmit}
                  disabled={cr.submitting}
                  style={{
                    padding: '10px 20px', borderRadius: 9,
                    background: cr.submitting ? '#8d95a3' : 'linear-gradient(135deg, #4361ee, #6366f1)',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    border: 'none', cursor: cr.submitting ? 'default' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cr.submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
              {cr.phoneError && (
                <span style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'block' }}>{cr.phoneError}</span>
              )}
            </div>
          ) : (
            <div>
              <button
                onClick={cr.handlePrimaryClick}
                disabled={cr.submitting}
                style={{
                  padding: '11px 24px', borderRadius: 9,
                  background: cr.submitting ? '#8d95a3' : 'linear-gradient(135deg, #4361ee, #6366f1)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: cr.submitting ? 'default' : 'pointer',
                  transition: 'opacity 0.15s',
                }}
              >
                {cr.submitting ? 'Submitting...' : 'Yes, Have a Specialist Reach Out \u2192'}
              </button>
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={cr.handleDismiss}
                  style={{
                    fontSize: 12, color: '#8d95a3', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  Not right now
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
