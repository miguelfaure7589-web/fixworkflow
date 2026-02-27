"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "var(--bg-card)",
        borderRadius: 14,
        border: "1px solid var(--border-default)",
        padding: 32,
        maxWidth: 480,
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>&#x26A0;&#xFE0F;</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          Something went wrong loading your dashboard.
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
          We hit an unexpected error. This is usually temporary &mdash; try refreshing.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #4361ee, #6366f1)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Try Again
          </button>
          <a
            href="mailto:support@fixworkflow.com"
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "1px solid var(--border-default)",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
