'use client';

import { useState, useEffect, useCallback } from 'react';
import CreditCaptureModal from './CreditCaptureModal';

interface Props {
  usesPersonalCredit: string | null;
  businessType: string;
  revenueFormatted: string;
  userEmail?: string;
  userName?: string;
}

function formatBizType(bt: string): string {
  const m: Record<string, string> = { ecommerce: 'e-commerce', saas: 'SaaS', service_agency: 'service/agency', creator: 'creator', local_business: 'local business' };
  return m[bt] || bt;
}

export default function CreditRepairCard({ usesPersonalCredit, businessType, revenueFormatted, userEmail, userName }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // Check for existing referral on mount
  useEffect(() => {
    fetch('/api/credit-referral')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.referral) {
          setSubmitted(true);
          setSubmittedPhone(json.referral.phone || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSuccess = useCallback((ref: { phone: string }) => {
    setSubmitted(true);
    setSubmittedPhone(ref.phone);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  }, []);

  // Only show for 'yes' (featured placement)
  if (usesPersonalCredit !== 'yes') return null;
  if (loading) return null;

  return (
    <>
      {/* Success toast */}
      {showToast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1001,
          padding: '12px 20px', borderRadius: 10,
          background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          animation: 'fadeSlide 0.3s ease',
        }}>
          ✓ Request submitted! A credit specialist will contact you within 24 hours.
        </div>
      )}

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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.6, color: '#8d95a3', textTransform: 'uppercase' as const }}>Financial Health</span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Recommended for you</span>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1b2434', marginBottom: 10, lineHeight: 1.3 }}>
          Your personal credit is costing your business money.
        </h3>

        {/* Reasoning */}
        <p style={{ fontSize: 13, color: '#5a6578', lineHeight: 1.7, marginBottom: 14 }}>
          You mentioned using personal credit for business expenses. For {formatBizType(businessType)} businesses at {revenueFormatted}/mo, this typically means higher interest rates on cash advances, lower approval odds for business financing, and mixed personal/business liability. Improving your credit score by even 50 points could save $2,000–6,000/year in interest and unlock better business loan terms.
        </p>

        {/* Impact box */}
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
          fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 16,
        }}>
          ↗ A 50-point credit score improvement saves the average small business owner $3,800/year in interest costs.
        </div>

        {submitted ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>✓ Assessment requested</span>
            </div>
            <p style={{ fontSize: 12, color: '#8d95a3', marginBottom: 6 }}>
              A specialist will contact you within 24 hours{submittedPhone ? ` at ${submittedPhone}` : ''}.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              style={{ fontSize: 11, color: '#4361ee', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              Update my contact info
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                padding: '10px 22px', borderRadius: 9,
                background: '#4361ee', color: '#fff', fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#3451de')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#4361ee')}
            >
              Get a Free Credit Assessment →
            </button>
            <p style={{ fontSize: 11, color: '#b4bac5', marginTop: 8 }}>
              Free consultation with a credit specialist. No obligation.
            </p>
          </div>
        )}
      </div>

      <CreditCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        defaultEmail={userEmail}
        defaultName={userName}
      />
    </>
  );
}
