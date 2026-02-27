"use client";

import { DollarSign, PieChart, Users, Target, Settings } from "lucide-react";
import MiniProgressRing from "./MiniProgressRing";
import SourceBadge from "./SourceBadge";
import type { PillarData } from "./types";

const PILLAR_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  revenue: { label: "Revenue", color: "#4361ee", icon: <DollarSign size={14} /> },
  profitability: { label: "Profitability", color: "#10b981", icon: <PieChart size={14} /> },
  retention: { label: "Retention", color: "#f59e0b", icon: <Users size={14} /> },
  acquisition: { label: "Acquisition", color: "#8b5cf6", icon: <Target size={14} /> },
  ops: { label: "Operations", color: "#f43f5e", icon: <Settings size={14} /> },
};

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const isPositive = delta > 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 6,
      fontSize: 11, fontWeight: 700,
      background: isPositive ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
      color: isPositive ? "#10b981" : "#ef4444",
    }}>
      {isPositive ? "+" : ""}{delta}
    </span>
  );
}

export default function PillarHealthCards({
  pillars,
  overallScore,
  isMobile,
  isTablet,
}: {
  pillars: Record<string, PillarData>;
  overallScore: number;
  isMobile: boolean;
  isTablet: boolean;
}) {
  const pillarNames = ["revenue", "profitability", "retention", "acquisition", "ops"];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Pillar Health
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Overall:</span>
          <span style={{
            fontSize: 16, fontWeight: 800,
            color: overallScore >= 70 ? "#10b981" : overallScore >= 40 ? "#f59e0b" : "#ef4444",
          }}>
            {overallScore}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>/100</span>
        </div>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(5, 1fr)",
        gap: 12,
      }}>
        {pillarNames.map((name) => {
          const cfg = PILLAR_CONFIG[name];
          const data = pillars[name];
          if (!cfg || !data) return null;

          return (
            <div key={name} style={{
              background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12,
              padding: 16, boxShadow: "var(--shadow-card)",
              display: "flex", flexDirection: "column", gap: 8,
              borderTop: `3px solid ${cfg.color}`,
              overflow: "hidden", minWidth: 0,
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: cfg.color, display: "inline-flex" }}>{cfg.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{cfg.label}</span>
              </div>

              {/* Ring + delta */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MiniProgressRing score={data.score} color={cfg.color} />
                <DeltaBadge delta={data.delta} />
              </div>

              {/* Key metric */}
              {data.keyMetric && (
                <div style={{ background: "var(--bg-input)", borderRadius: 8, padding: "6px 8px" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{data.keyMetric.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{data.keyMetric.value}</span>
                    <SourceBadge source={data.keyMetric.source} />
                  </div>
                </div>
              )}

              {/* Top reason — 2-line clamp */}
              {data.reasons.length > 0 && (
                <div style={{
                  fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}>
                  {data.reasons[0]}
                </div>
              )}

              {/* Source badges */}
              {data.sources.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "auto" }}>
                  {data.sources.map((s) => <SourceBadge key={s} source={s} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
