import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-outfit, var(--font-geist-sans)), sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #4361ee, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L4.5 14H12l-1 8L19.5 10H12l1-8z" />
          </svg>
        </div>

        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "var(--border-default)",
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: "0 0 8px",
          }}
        >
          Page not found
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            margin: "0 0 32px",
            maxWidth: 360,
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Link
            href="/"
            style={{
              padding: "10px 24px",
              borderRadius: 9,
              background: "linear-gradient(135deg, #4361ee, #6366f1)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            style={{
              padding: "9px 23px",
              borderRadius: 9,
              border: "1.5px solid #4361ee",
              background: "transparent",
              color: "#4361ee",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
