"use client";

import { useEffect, useState } from "react";

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  // Common in-app browser indicators
  return /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|WeChat|MicroMessenger|LinkedIn/i.test(ua);
}

export default function InAppBrowserGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);

  if (!inApp) return <>{children}</>;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
        background: "var(--bg-page)",
        color: "var(--text-primary)",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        Open in Your Browser
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "var(--text-secondary)",
          maxWidth: 360,
          lineHeight: 1.5,
          marginBottom: 20,
        }}
      >
        This app doesn&apos;t work well in in-app browsers. Tap the button below
        to open it in Safari or Chrome.
      </p>
      <a
        href={`intent://${currentUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;end`}
        style={{
          display: "inline-block",
          padding: "12px 28px",
          borderRadius: 8,
          background: "var(--accent)",
          color: "#fff",
          fontWeight: 600,
          fontSize: 15,
          textDecoration: "none",
          marginBottom: 16,
        }}
      >
        Open in Browser
      </a>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-faint)",
          maxWidth: 320,
          lineHeight: 1.4,
        }}
      >
        Or tap the &quot;⋯&quot; menu above and select &quot;Open in
        Browser&quot;.
      </p>
    </div>
  );
}
