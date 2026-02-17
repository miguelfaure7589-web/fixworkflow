'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (referral: { phone: string }) => void;
  defaultEmail?: string;
  defaultName?: string;
}

const TIME_OPTIONS = [
  { value: '', label: 'Select a time...' },
  { value: 'morning', label: 'Morning (9am–12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm–5pm)' },
  { value: 'evening', label: 'Evening (5pm–8pm)' },
  { value: 'anytime', label: 'Anytime' },
];

export default function CreditCaptureModal({ open, onClose, onSuccess, defaultEmail, defaultName }: Props) {
  const [name, setName] = useState(defaultName || '');
  const [email, setEmail] = useState(defaultEmail || '');
  const [phone, setPhone] = useState('');
  const [bestTime, setBestTime] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  if (!open) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');

    try {
      const res = await fetch('/api/credit-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          bestTimeToCall: bestTime || null,
          notes: notes.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setApiError(json.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }

      onSuccess({ phone: phone.trim() });
      onClose();
    } catch {
      setApiError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', padding: '12px 14px', borderRadius: 9,
    border: `1px solid ${hasError ? '#ef4444' : '#e6e9ef'}`, fontSize: 14,
    fontFamily: 'var(--font-outfit, sans-serif)', color: '#1b2434',
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
    background: '#fff',
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 18, maxWidth: 480, width: '100%',
          padding: 32, boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          maxHeight: '90vh', overflowY: 'auto', position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 28, height: 28, borderRadius: 7,
            border: '1px solid #e6e9ef', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 14, color: '#8d95a3',
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #4361ee, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1b2434' }}>Get Your Free Credit Assessment</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: '#5a6578', lineHeight: 1.6, marginBottom: 24 }}>
          A credit specialist will reach out within 24 hours to review your options. No cost, no obligation.
        </p>

        {/* Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#1b2434', display: 'block', marginBottom: 4 }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
              placeholder="John Smith"
              style={inputStyle(!!errors.name)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.name ? '#ef4444' : '#e6e9ef'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.name && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2, display: 'block' }}>{errors.name}</span>}
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#1b2434', display: 'block', marginBottom: 4 }}>
              Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
              placeholder="john@example.com"
              style={inputStyle(!!errors.email)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? '#ef4444' : '#e6e9ef'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.email && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2, display: 'block' }}>{errors.email}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* Phone */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#1b2434', display: 'block', marginBottom: 4 }}>
              Phone Number <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })); }}
              placeholder="(555) 123-4567"
              style={inputStyle(!!errors.phone)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.phone ? '#ef4444' : '#e6e9ef'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.phone && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2, display: 'block' }}>{errors.phone}</span>}
          </div>

          {/* Best time */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#1b2434', display: 'block', marginBottom: 4 }}>
              Best time to call
            </label>
            <select
              value={bestTime}
              onChange={(e) => setBestTime(e.target.value)}
              style={{ ...inputStyle(false), cursor: 'pointer', appearance: 'auto' as React.CSSProperties['appearance'] }}
            >
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#1b2434', display: 'block', marginBottom: 4 }}>
            Anything we should know?
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 200))}
            placeholder="e.g. currently rebuilding after bankruptcy, want to qualify for a business loan, etc."
            rows={3}
            style={{ ...inputStyle(false), resize: 'vertical' as React.CSSProperties['resize'], minHeight: 72 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e6e9ef'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <div style={{ fontSize: 10, color: '#b4bac5', textAlign: 'right', marginTop: 2 }}>{notes.length}/200</div>
        </div>

        {apiError && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 12, color: '#ef4444', marginBottom: 12 }}>
            {apiError}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: 14, borderRadius: 10,
            background: submitting ? '#8d95a3' : 'linear-gradient(135deg, #4361ee, #6366f1)',
            color: '#fff', fontSize: 15, fontWeight: 700, border: 'none',
            cursor: submitting ? 'default' : 'pointer',
            transition: 'opacity 0.15s', marginTop: 4,
          }}
        >
          {submitting ? 'Submitting...' : 'Request Free Assessment →'}
        </button>

        <p style={{ fontSize: 11, color: '#b4bac5', textAlign: 'center', marginTop: 10 }}>
          🔒 Your information is kept private and only shared with our credit partner.
        </p>
      </div>
    </div>
  );
}
