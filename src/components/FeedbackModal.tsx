"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "general", label: "General Feedback" },
];

export default function FeedbackModal({ open, onClose, onSuccess }: FeedbackModalProps) {
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, pageUrl: window.location.href }),
      });
      if (res.ok) {
        setMessage("");
        setType("general");
        onSuccess();
        onClose();
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--overlay-bg)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg-card)", borderRadius: 16, padding: 28, maxWidth: 480, width: "100%", margin: "0 16px", boxShadow: "0 16px 48px rgba(0,0,0,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Send Feedback</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--border-default)", fontSize: 14, color: "var(--text-primary)", marginBottom: 16, background: "var(--bg-input)", cursor: "pointer" }}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
          Tell us what&apos;s broken, what&apos;s confusing, or what you&apos;d love to see
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Your feedback..."
          style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--border-default)", fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, resize: "vertical", marginBottom: 20, fontFamily: "inherit", background: "var(--bg-input)" }}
        />

        <button
          onClick={handleSubmit}
          disabled={!message.trim() || sending}
          style={{
            width: "100%", padding: "12px 24px", borderRadius: 10, border: "none",
            background: !message.trim() || sending ? "var(--bg-subtle)" : "#4361ee",
            color: !message.trim() || sending ? "var(--text-muted)" : "#fff",
            fontSize: 14, fontWeight: 700, cursor: !message.trim() || sending ? "default" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {sending ? "Sending..." : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}
