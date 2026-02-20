'use client';

import { useCallback } from 'react';
import { ExternalLink, TrendingUp } from 'lucide-react';
import type { ScoredProduct } from '@/lib/recommendations';
import LogoImg, { faviconUrl } from '@/components/ui/LogoImg';

interface Props {
  tools: ScoredProduct[];
  isPremium: boolean;
}

function ToolCard({ tool, onClickTool }: { tool: ScoredProduct; onClickTool: (t: ScoredProduct) => void }) {
  return (
    <div
      style={{
        background: '#fff', borderRadius: 14, border: '1px solid #e6e9ef',
        padding: 20, display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d0d5dd'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e6e9ef'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Logo + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <LogoImg src={faviconUrl(tool.domain || '', 64)} fallbackEmoji={tool.logo} size={36} radius={9} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1b2434' }}>{tool.name}</span>
            {tool.matchLabel && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${tool.matchColor}14`, color: tool.matchColor }}>{tool.matchLabel}</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#b4bac5' }}>
            {tool.category} &middot; <span style={{ color: '#8d95a3' }}>{tool.price}</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {tool.hasFreeTier && (
          <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>Free tier</span>
        )}
        {tool.targetPillars[0] && (
          <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(67,97,238,0.08)', color: '#4361ee' }}>
            {tool.targetPillars[0]}
          </span>
        )}
      </div>

      {/* Reasoning — fully visible, no truncation */}
      <p style={{ fontSize: 12, color: '#5a6578', lineHeight: 1.65, margin: 0, flex: 1 }}>{tool.filledReasoning}</p>

      {/* Potential impact */}
      {tool.filledPotential && (
        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)', fontSize: 11, fontWeight: 600, color: '#10b981' }}>
          <TrendingUp style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{tool.filledPotential}
        </div>
      )}

      {/* Affiliate button */}
      <button
        onClick={() => onClickTool(tool)}
        style={{
          marginTop: 12, padding: '8px 16px', borderRadius: 8,
          background: '#4361ee', color: '#fff', fontSize: 12, fontWeight: 700,
          border: 'none', cursor: 'pointer', alignSelf: 'flex-start',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#3451de')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#4361ee')}
      >
        Try {tool.name} <ExternalLink style={{ width: 11, height: 11, display: 'inline', marginLeft: 3 }} />
      </button>
    </div>
  );
}

export default function RecommendedTools({ tools, isPremium }: Props) {
  const handleClick = useCallback((tool: ScoredProduct) => {
    fetch('/api/affiliate/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: tool.id, source: 'tool_stack' }),
    }).catch(() => {});
    window.open(tool.affiliateUrl, '_blank', 'noopener');
  }, []);

  if (!tools.length) return null;

  const gridTools = tools.slice(0, 4);
  const compactTool = tools[4] || null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: '#8d95a3', textTransform: 'uppercase' as const }}>Recommended Tools</div>
          <div style={{ fontSize: 12, color: '#b4bac5', marginTop: 2 }}>Ranked by impact on your score</div>
        </div>
        <span style={{ fontSize: 11, color: '#8d95a3' }}>{tools.length} matched</span>
      </div>

      {isPremium ? (
        <>
          {/* Pro: full 2x2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {gridTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onClickTool={handleClick} />
            ))}
          </div>

          {/* Compact 5th tool */}
          {compactTool && (
            <div
              style={{
                marginTop: 12, padding: '14px 18px', borderRadius: 12,
                background: '#fff', border: '1px solid #e6e9ef',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d0d5dd'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e6e9ef'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <LogoImg src={faviconUrl(compactTool.domain || '', 64)} fallbackEmoji={compactTool.logo} size={32} radius={8} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1b2434' }}>{compactTool.name}</span>
                  {compactTool.matchLabel && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${compactTool.matchColor}14`, color: compactTool.matchColor }}>{compactTool.matchLabel}</span>
                  )}
                  {compactTool.targetPillars[0] && (
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(67,97,238,0.08)', color: '#4361ee' }}>{compactTool.targetPillars[0]}</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#5a6578', lineHeight: 1.5, margin: '4px 0 0' }}>{compactTool.filledReasoning}</p>
              </div>
              <button
                onClick={() => handleClick(compactTool)}
                style={{
                  padding: '8px 16px', borderRadius: 8, background: '#4361ee', color: '#fff',
                  fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                Try {compactTool.name} <ExternalLink style={{ width: 11, height: 11, display: 'inline', marginLeft: 3 }} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Free: first card visible */}
          {gridTools[0] && <ToolCard tool={gridTools[0]} onClickTool={handleClick} />}

          {/* Remaining cards — blurred with overlay */}
          {gridTools.length > 1 && (
            <div style={{ position: 'relative', marginTop: 12, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ filter: 'blur(4px)', pointerEvents: 'none' as const, userSelect: 'none' as const }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {gridTools.slice(1).map((tool) => (
                    <ToolCard key={tool.id} tool={tool} onClickTool={handleClick} />
                  ))}
                </div>
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(2px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: 14, gap: 8,
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', letterSpacing: 0.5 }}>PRO</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1b2434' }}>+{tools.length - 1} more tools ranked by impact</div>
                <div style={{ fontSize: 12, color: '#8d95a3' }}>Unlock with Pro to see all personalized recommendations</div>
                <a
                  href="/pricing"
                  style={{
                    marginTop: 4, padding: '8px 20px', borderRadius: 8,
                    background: 'linear-gradient(135deg, #6366f1, #4361ee)',
                    color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.2)',
                  }}
                >
                  Unlock All Tools
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
