'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';

const pillars = [
  { name: 'Revenue', score: 60, color: '#4361ee' },
  { name: 'Profitability', score: 78, color: '#10b981' },
  { name: 'Retention', score: 68, color: '#4361ee' },
  { name: 'Acquisition', score: 67, color: '#4361ee' },
  { name: 'Operations', score: 45, color: '#f59e0b' },
];

export function ScoreRing({ size, score, animated }: { size: number; score: number; animated?: boolean }) {
  const [val, setVal] = useState(animated ? 0 : score);
  useEffect(() => {
    if (animated) {
      const t = setTimeout(() => setVal(score), 600);
      return () => clearTimeout(t);
    }
  }, [animated, score]);
  const r = size * 0.417;
  const c = 2 * Math.PI * r;
  const off = c * (1 - val / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-light)" strokeWidth={size * 0.052} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#4361ee" strokeWidth={size * 0.052}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.29, fontWeight: 900, color: 'var(--text-primary)' }}>
        {val}
      </div>
    </div>
  );
}

export function PillarBars({ barHeight = 3 }: { barHeight?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {pillars.map((p) => (
        <div key={p.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{p.score}</span>
          </div>
          <div style={{ height: barHeight, borderRadius: 2, background: 'var(--border-light)' }}>
            <div style={{ height: barHeight, borderRadius: 2, background: p.color, width: `${p.score}%`,
              transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)', transitionDelay: '0.6s' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScorePreviewCard() {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-card)', padding: '24px 22px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.6, color: 'var(--text-muted)', textTransform: 'uppercase' as const, marginBottom: 16 }}>
        Revenue Health Score
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <ScoreRing size={96} score={66} animated />
      </div>
      <PillarBars />
      <div style={{ marginTop: 16, padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.05)', fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0 }} /> Primary risk: Operations (45/100)
      </div>
      <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.05)', fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
        <TrendingUp style={{ width: 13, height: 13, flexShrink: 0 }} /> Fastest lever: ~$19,200/mo potential
      </div>
    </div>
  );
}
