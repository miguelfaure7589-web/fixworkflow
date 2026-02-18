'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const LS_DISMISS_KEY = 'fixworkflow_credit_card_dismissals';

function getDismissCount(): number {
  try {
    return parseInt(localStorage.getItem(LS_DISMISS_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function incrementDismiss(): number {
  const next = getDismissCount() + 1;
  try { localStorage.setItem(LS_DISMISS_KEY, String(next)); } catch {}
  return next;
}

export interface CreditReferralCtx {
  /** Whether a referral has been submitted (from DB or this session) */
  submitted: boolean;
  /** Phone number on the submitted referral */
  submittedPhone: string;
  /** Card dismissed for this session (or permanently) */
  hidden: boolean;
  /** Still checking existing referral from API */
  loading: boolean;
  /** POST in flight */
  submitting: boolean;
  /** Error from last submit attempt */
  apiError: string;
  /** Inline phone capture is showing */
  needsPhone: boolean;
  phoneInput: string;
  phoneError: string;

  /** Click primary CTA — submits immediately or shows phone capture */
  handlePrimaryClick: () => void;
  /** Submit inline phone form */
  handlePhoneSubmit: () => void;
  /** "Not right now" */
  handleDismiss: () => void;
  setPhoneInput: (v: string) => void;
}

const Ctx = createContext<CreditReferralCtx | null>(null);

export function useCreditReferral(): CreditReferralCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCreditReferral must be used within CreditReferralProvider');
  return ctx;
}

interface ProviderProps {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  children: ReactNode;
}

export function CreditReferralProvider({ userName, userEmail, userPhone, children }: ProviderProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [permanentlyHidden, setPermanentlyHidden] = useState(false);

  const [needsPhone, setNeedsPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Check existing referral + permanent dismissal on mount
  useEffect(() => {
    if (getDismissCount() >= 3) {
      setPermanentlyHidden(true);
      setLoading(false);
      return;
    }

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

  const submitReferral = useCallback(async (phone: string) => {
    setSubmitting(true);
    setApiError('');

    try {
      const res = await fetch('/api/credit-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: (userName || '').trim(),
          email: (userEmail || '').trim(),
          phone: phone.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setApiError(json.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmittedPhone(phone.trim());
    } catch {
      setApiError('Network error. Please try again.');
      setSubmitting(false);
    }
  }, [userName, userEmail]);

  const handlePrimaryClick = useCallback(async () => {
    if (!userPhone) {
      setNeedsPhone(true);
      return;
    }
    await submitReferral(userPhone);
  }, [userPhone, submitReferral]);

  const handlePhoneSubmit = useCallback(async () => {
    const trimmed = phoneInput.trim();
    if (trimmed.length < 7) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    setPhoneError('');

    // Save phone to user profile (non-blocking)
    fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: trimmed }),
    }).catch(() => {});

    await submitReferral(trimmed);
  }, [phoneInput, submitReferral]);

  const handleDismiss = useCallback(() => {
    const count = incrementDismiss();
    if (count >= 3) setPermanentlyHidden(true);
    setDismissed(true);
  }, []);

  const hidden = loading || permanentlyHidden || dismissed;

  const value: CreditReferralCtx = {
    submitted,
    submittedPhone,
    hidden,
    loading,
    submitting,
    apiError,
    needsPhone,
    phoneInput,
    phoneError,
    handlePrimaryClick,
    handlePhoneSubmit,
    handleDismiss,
    setPhoneInput: (v: string) => { setPhoneInput(v); setPhoneError(''); },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
