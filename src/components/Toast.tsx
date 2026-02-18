"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

const accentColors: Record<ToastType, string> = {
  success: "#10b981",
  error: "#ef4444",
  info: "#4361ee",
};

const icons: Record<ToastType, string> = {
  success: "\u2713",
  error: "\u2715",
  info: "\u24D8",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={t.exiting ? "toast-exit" : "toast-enter"}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
              padding: "14px 18px",
              borderLeft: `4px solid ${accentColors[t.type]}`,
              maxWidth: 380,
              minWidth: 260,
              fontFamily: "inherit",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                background: accentColors[t.type],
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {icons[t.type]}
            </span>
            <span style={{ fontSize: 13, color: "#1b2434", fontWeight: 500, lineHeight: 1.4 }}>
              {t.message}
            </span>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#8d95a3",
                cursor: "pointer",
                fontSize: 16,
                padding: 2,
                lineHeight: 1,
                flexShrink: 0,
              }}
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
