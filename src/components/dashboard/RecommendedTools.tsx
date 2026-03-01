'use client';

import { useCallback, useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ExternalLink, TrendingUp, Plug, CheckCircle2 } from 'lucide-react';
import type { ScoredProduct } from '@/lib/recommendations';
import LogoImg, { faviconUrl } from '@/components/ui/LogoImg';

// Map tool names AND affiliate IDs to integration provider IDs and connect endpoints
interface IntegrationMapping {
  providerId: string;
  connectEndpoint: string;
  comingSoon?: boolean;
  needsStoreDomain?: boolean;
}

const INTEGRATION_MAPPINGS: IntegrationMapping[] = [
  { providerId: 'quickbooks', connectEndpoint: '/api/integrations/quickbooks/connect' },
  { providerId: 'shopify', connectEndpoint: '/api/integrations/shopify/connect', needsStoreDomain: true },
  { providerId: 'stripe-data', connectEndpoint: '/api/integrations/stripe-data/connect' },
  { providerId: 'google-analytics', connectEndpoint: '/api/integrations/google-analytics/connect' },
  { providerId: 'mailchimp', connectEndpoint: '', comingSoon: true },
];

// Lookup by tool name or affiliate product id
const TOOL_INTEGRATION_MAP: Record<string, IntegrationMapping> = {
  // By name
  'QuickBooks': INTEGRATION_MAPPINGS[0],
  'Shopify': INTEGRATION_MAPPINGS[1],
  'Stripe': INTEGRATION_MAPPINGS[2],
  'Google Analytics': INTEGRATION_MAPPINGS[3],
  'Mailchimp': INTEGRATION_MAPPINGS[4],
  // By affiliate id
  'aff_quickbooks': INTEGRATION_MAPPINGS[0],
  'aff_stripe': INTEGRATION_MAPPINGS[2],
  'aff_mailchimp': INTEGRATION_MAPPINGS[4],
};

function getIntegrationMapping(tool: { name: string; id: string }): IntegrationMapping | undefined {
  return TOOL_INTEGRATION_MAP[tool.name] || TOOL_INTEGRATION_MAP[tool.id];
}

interface IntegrationInfo {
  id: string;
  provider: string;
  status: string;
}

interface Props {
  tools: ScoredProduct[];
  isPremium: boolean;
  integrations?: IntegrationInfo[];
}

function ConnectButton({ tool, integrations }: { tool: ScoredProduct; integrations: IntegrationInfo[] }) {
  const [connecting, setConnecting] = useState(false);
  const mapping = getIntegrationMapping(tool);
  if (!mapping) return null;

  const connected = integrations.find(
    (i) => i.provider === mapping.providerId && i.status === 'connected'
  );

  if (connected) {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '6px 12px', borderRadius: 8,
          background: 'rgba(16,185,129,0.08)', color: '#10b981',
          fontSize: 12, fontWeight: 700,
        }}
      >
        <CheckCircle2 style={{ width: 12, height: 12 }} /> Connected
      </span>
    );
  }

  if (mapping.comingSoon) {
    return (
      <span
        title="Coming Soon"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '6px 12px', borderRadius: 8,
          background: 'var(--bg-input)', color: 'var(--text-faint)',
          fontSize: 12, fontWeight: 700, border: '1px solid var(--border-default)',
          cursor: 'default',
        }}
      >
        <Plug style={{ width: 11, height: 11 }} /> Coming Soon
      </span>
    );
  }

  const handleConnect = async () => {
    // Shopify needs store domain — redirect to settings integrations tab
    if (mapping.needsStoreDomain) {
      window.location.href = '/settings?tab=integrations';
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch(mapping.connectEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      // Fallback to settings page on error
      window.location.href = '/settings?tab=integrations';
    } finally {
      setConnecting(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '6px 12px', borderRadius: 8,
        background: 'transparent', color: '#4361ee',
        fontSize: 12, fontWeight: 700,
        border: '1.5px solid #4361ee', cursor: connecting ? 'wait' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
        opacity: connecting ? 0.6 : 1,
      }}
      onMouseEnter={(e) => { if (!connecting) { e.currentTarget.style.background = '#4361ee'; e.currentTarget.style.color = '#fff'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4361ee'; }}
    >
      <Plug style={{ width: 11, height: 11 }} /> {connecting ? 'Connecting...' : 'Connect'}
    </button>
  );
}

function ToolCard({ tool, onClickTool, integrations }: { tool: ScoredProduct; onClickTool: (t: ScoredProduct) => void; integrations: IntegrationInfo[] }) {
  const hasIntegration = !!getIntegrationMapping(tool);

  return (
    <div
      style={{
        background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-default)',
        padding: 20, display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Logo + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <LogoImg src={faviconUrl(tool.domain || '', 64)} fallbackEmoji={tool.logo} size={36} radius={9} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{tool.name}</span>
            {tool.matchLabel && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${tool.matchColor}14`, color: tool.matchColor }}>{tool.matchLabel}</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
            {tool.category} &middot; <span style={{ color: 'var(--text-muted)' }}>{tool.price}</span>
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
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, flex: 1 }}>{tool.filledReasoning}</p>

      {/* Potential impact */}
      {tool.filledPotential && (
        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)', fontSize: 11, fontWeight: 600, color: '#10b981' }}>
          <TrendingUp style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{tool.filledPotential}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => onClickTool(tool)}
          style={{
            padding: '8px 16px', borderRadius: 8,
            background: '#4361ee', color: '#fff', fontSize: 12, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#3451de')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#4361ee')}
        >
          Try {tool.name} <ExternalLink style={{ width: 11, height: 11, display: 'inline', marginLeft: 3 }} />
        </button>
        {hasIntegration && <ConnectButton tool={tool} integrations={integrations} />}
      </div>
    </div>
  );
}

function isToolConnected(tool: ScoredProduct, integrations: IntegrationInfo[]): boolean {
  const mapping = getIntegrationMapping(tool);
  if (!mapping) return false;
  return integrations.some((i) => i.provider === mapping.providerId && i.status === 'connected');
}

export default function RecommendedTools({ tools, isPremium, integrations = [] }: Props) {
  const isMobile = useIsMobile();
  const handleClick = useCallback((tool: ScoredProduct) => {
    fetch('/api/affiliate/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: tool.id, source: 'tool_stack' }),
    }).catch(() => {});
    window.open(tool.affiliateUrl, '_blank', 'noopener');
  }, []);

  if (!tools.length) return null;

  // Filter out tools whose integration is already connected
  const visibleTools = tools.filter((t) => !isToolConnected(t, integrations));

  // All recommended tools are connected — show success state
  if (visibleTools.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>Recommended Tools</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>Ranked by impact on your score</div>
          </div>
        </div>
        <div style={{
          background: 'var(--bg-card)', borderRadius: 14, border: '1px solid rgba(16,185,129,0.2)',
          padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <CheckCircle2 style={{ width: 24, height: 24, color: '#10b981', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>All recommended tools connected</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your score is using real data from your integrations.</div>
          </div>
        </div>
      </div>
    );
  }

  const gridTools = visibleTools.slice(0, 4);
  const compactTool = visibleTools[4] || null;
  const compactHasIntegration = compactTool ? !!getIntegrationMapping(compactTool) : false;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>Recommended Tools</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>Ranked by impact on your score</div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{visibleTools.length} matched</span>
      </div>

      {isPremium ? (
        <>
          {/* Pro: full 2x2 grid, 1-col on mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            {gridTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onClickTool={handleClick} integrations={integrations} />
            ))}
          </div>

          {/* Compact 5th tool */}
          {compactTool && (
            <div
              style={{
                marginTop: 12, padding: '14px 18px', borderRadius: 12,
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <LogoImg src={faviconUrl(compactTool.domain || '', 64)} fallbackEmoji={compactTool.logo} size={32} radius={8} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{compactTool.name}</span>
                  {compactTool.matchLabel && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${compactTool.matchColor}14`, color: compactTool.matchColor }}>{compactTool.matchLabel}</span>
                  )}
                  {compactTool.targetPillars[0] && (
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(67,97,238,0.08)', color: '#4361ee' }}>{compactTool.targetPillars[0]}</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '4px 0 0' }}>{compactTool.filledReasoning}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => handleClick(compactTool)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, background: '#4361ee', color: '#fff',
                    fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Try {compactTool.name} <ExternalLink style={{ width: 11, height: 11, display: 'inline', marginLeft: 3 }} />
                </button>
                {compactHasIntegration && <ConnectButton tool={compactTool} integrations={integrations} />}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Free: first card visible */}
          {gridTools[0] && <ToolCard tool={gridTools[0]} onClickTool={handleClick} integrations={integrations} />}

          {/* Remaining cards — blurred with overlay */}
          {gridTools.length > 1 && (
            <div style={{ position: 'relative', marginTop: 12, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ filter: 'blur(4px)', pointerEvents: 'none' as const, userSelect: 'none' as const }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                  {gridTools.slice(1).map((tool) => (
                    <ToolCard key={tool.id} tool={tool} onClickTool={handleClick} integrations={integrations} />
                  ))}
                </div>
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'var(--overlay-bg)',
                backdropFilter: 'blur(2px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: 14, gap: 8,
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', letterSpacing: 0.5 }}>PRO</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>+{visibleTools.length - 1} more tools ranked by impact</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unlock with Pro to see all personalized recommendations</div>
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
