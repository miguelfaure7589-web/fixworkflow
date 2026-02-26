"use client";

import MiniProgressRing from "./MiniProgressRing";
import SourceBadge from "./SourceBadge";
import type { PillarData } from "./types";

const PILLAR_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  revenue: { label: "Revenue", color: "#4361ee", icon: "💰" },
  profitability: { label: "Profitability", color: "#10b981", icon: "📊" },
  retention: { label: "Retention", color: "#f59e0b", icon: "🔄" },
  acquisition: { label: "Acquisition", color: "#8b5cf6", icon: "🎯" },
  ops: { label: "Operations", color: "#f43f5e", icon: "⚙️" },
};

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const isPositive = delta > 0;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "1px 6px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      background: isPositive ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
      color: isPositive ? "#10b981" : "#ef4444",
    }}>
      {isPositive ? "+" : ""}{delta}
    </span>
  );
}

export default function PillarHealthCards({
  pillars,
  isMobile,
}: {
  pillars: Record<string, PillarData>;
  isMobile: boolean;
}) {
  const pillarNames = ["revenue", "profitability", "retention", "acquisition", "ops"];

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
        Pillar Health
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
        gap: 12,
      }}>
        {pillarNames.map((name) => {
          const cfg = PILLAR_CONFIG[name];
          const data = pillars[name];
          if (!cfg || !data) return null;

          return (
            <div
              key={name}
              style={{
                background: "#fff",
                border: "1px solid #f0f2f6",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Header: icon + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5a6578" }}>{cfg.label}</span>
              </div>

              {/* Ring + delta */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MiniProgressRing score={data.score} color={cfg.color} />
                <DeltaBadge delta={data.delta} />
              </div>

              {/* Top reason */}
              {data.reasons.length > 0 && (
                <div style={{
                  fontSize: 11,
                  color: "#8d95a3",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {data.reasons[0]}
                </div>
              )}

              {/* Source badges */}
              {data.sources.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {data.sources.map((s) => (
                    <SourceBadge key={s} source={s} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
