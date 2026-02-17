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
        <span style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed" }}>Why?</span>
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
        className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 transition-colors"
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
          className="mt-1.5 p-2.5 bg-violet-50/70 border border-violet-100 rounded-lg"
          style={{ animation: "fadeSlide 0.2s ease" }}
        >
          <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
          {potential && (
            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded-md">
              <p className="text-xs text-emerald-700 font-medium">&#8599; {potential}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
