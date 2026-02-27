"use client";

import { useState } from "react";
import { ProBadge } from "./ProBadge";

interface WhyToggleProps {
  text: string;
  potential?: string;
  locked?: boolean;
}

export function WhyToggle({ text, potential, locked = false }: WhyToggleProps) {
  const [open, setOpen] = useState(false);

  if (locked) {
    return (
      <div className="mt-1 inline-flex items-center gap-1.5 opacity-60">
        <ProBadge small />
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-accent)" }}>Why?</span>
      </div>
    );
  }

  return (
    <div className="mt-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="inline-flex items-center gap-1 text-xs transition-colors"
        style={{ color: "var(--text-accent)" }}
      >
        <span
          className={`inline-block text-[10px] transition-transform duration-150 ${
            open ? "rotate-90" : ""
          }`}
        >
          &#9654;
        </span>
        Why?
      </button>
      {open && (
        <div
          className="mt-1.5 p-2.5 bg-violet-50/70 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-lg"
          style={{ animation: "fadeSlide 0.2s ease" }}
        >
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{text}</p>
          {potential && (
            <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-md">
              <p className="text-xs text-emerald-700 font-medium">{potential}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
