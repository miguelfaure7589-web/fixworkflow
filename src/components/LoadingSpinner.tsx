"use client";

interface LoadingSpinnerProps {
  fullPage?: boolean;
  size?: number;
  text?: string;
}

export default function LoadingSpinner({ fullPage = false, size = 24, text }: LoadingSpinnerProps) {
  const spinner = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: "spin-smooth 0.8s linear infinite" }}
      >
        <circle cx="12" cy="12" r="10" stroke="var(--border-default)" strokeWidth="3" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="#4361ee"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {text && (
        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{text}</span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-page)",
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}
