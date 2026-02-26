"use client";

import { AlertTriangle, TrendingUp, Bell, Clock } from "lucide-react";
import type { ScoreAlertItem } from "./types";

const SEVERITY_STYLES: Record<string, { bg: string; border: string; iconColor: string }> = {
  critical: { bg: "rgba(239,68,68,0.04)", border: "#fecaca", iconColor: "#ef4444" },
  warning: { bg: "rgba(245,158,11,0.04)", border: "#fed7aa", iconColor: "#f59e0b" },
  info: { bg: "rgba(67,97,238,0.04)", border: "#c7d2fe", iconColor: "#4361ee" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pillar_drop: <AlertTriangle size={16} />,
  goal_hit: <TrendingUp size={16} />,
  streak: <Bell size={16} />,
  data_stale: <Clock size={16} />,
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsOpportunities({ alerts }: { alerts: ScoreAlertItem[] }) {
  if (alerts.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
        Alerts & Opportunities
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.slice(0, 5).map((alert) => {
          const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
          return (
            <div key={alert.id} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 16px", borderRadius: 10,
              background: style.bg, border: `1px solid ${style.border}`,
            }}>
              <div style={{ color: style.iconColor, flexShrink: 0, marginTop: 1 }}>
                {TYPE_ICONS[alert.type] ?? <Bell size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1b2434" }}>{alert.title}</span>
                  {alert.pillar && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                      background: "rgba(141,149,163,0.08)", color: "#8d95a3",
                    }}>
                      {alert.pillar}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#5a6578", lineHeight: 1.4 }}>{alert.message}</div>
              </div>
              <span style={{ fontSize: 10, color: "#b4bac5", whiteSpace: "nowrap", flexShrink: 0 }}>
                {timeAgo(alert.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
