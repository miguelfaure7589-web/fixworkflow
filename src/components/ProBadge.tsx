"use client";

export function ProBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      style={{
        fontSize: small ? 8 : 9,
        fontWeight: 800,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: "white",
        background: "linear-gradient(135deg, #6366f1, #4361ee)",
        padding: small ? "2px 5px" : "3px 8px",
        borderRadius: 4,
        lineHeight: 1,
        display: "inline-block",
      }}
    >
      PRO
    </span>
  );
}
