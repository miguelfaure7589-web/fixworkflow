"use client";

import Link from "next/link";
import { ProBadge } from "./ProBadge";

interface LockedOverlayProps {
  children: React.ReactNode;
  label: string;
  compact?: boolean;
}

export function LockedOverlay({ children, label, compact = false }: LockedOverlayProps) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 10 }}>
      <div style={{ filter: "blur(5px)", opacity: 0.5, pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(1px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: compact ? 4 : 8 }}>
          <ProBadge />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#5a6578" }}>{label}</span>
        </div>
        {!compact && (
          <Link
            href="/pricing"
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #4361ee)",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              boxShadow: "0 2px 10px rgba(99,102,241,0.2)",
              textDecoration: "none",
            }}
          >
            Upgrade to Pro
          </Link>
        )}
      </div>
    </div>
  );
}
