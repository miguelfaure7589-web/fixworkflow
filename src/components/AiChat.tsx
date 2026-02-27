"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Zap, CheckCheck } from "lucide-react";
import { onChatPrefill } from "@/lib/prompts/chatContext";
import type { ChatPrefillPayload } from "@/lib/prompts/chatContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Molly, your FixWorkFlow AI assistant. Ask me anything about workflow optimization, our diagnosis, or how we can help you work smarter.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefillMeta, setPrefillMeta] = useState<{ title: string; rationale: string[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for prefill events from dashboard "Ask AI" buttons
  useEffect(() => {
    return onChatPrefill((payload: ChatPrefillPayload) => {
      setInput(payload.prompt);
      setPrefillMeta({ title: payload.templateTitle, rationale: payload.rationale });
      setOpen(true);
    });
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Try taking our free diagnosis instead — it'll give you personalized workflow recommendations!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 w-[380px] max-h-[520px] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden bg-[var(--bg-card)] border border-[var(--border-default)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Molly</div>
                <div className="text-blue-100 text-xs">
                  {loading ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      typing...
                    </span>
                  ) : (
                    "FixWorkFlow AI Assistant"
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[280px] max-h-[350px]">
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">M</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-br-md"
                        : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--bg-subtle)]">
                      <span className="text-[var(--text-muted)] text-xs font-bold">U</span>
                    </div>
                  )}
                </div>
                {/* Delivered indicator for user messages */}
                {msg.role === "user" && (
                  <div className="flex justify-end mt-1 mr-9">
                    <div className="flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] text-[var(--text-faint)]">Delivered</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <div className="px-5 py-3.5 rounded-2xl rounded-bl-md bg-[var(--bg-subtle)]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full animate-[typing_1.4s_ease-in-out_infinite] bg-[var(--text-faint)]" />
                    <span className="w-2 h-2 rounded-full animate-[typing_1.4s_ease-in-out_0.2s_infinite] bg-[var(--text-faint)]" />
                    <span className="w-2 h-2 rounded-full animate-[typing_1.4s_ease-in-out_0.4s_infinite] bg-[var(--text-faint)]" />
                  </div>
                  <style jsx>{`
                    @keyframes typing {
                      0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
                      30% { opacity: 1; transform: translateY(-4px); }
                    }
                  `}</style>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prefill banner */}
          {prefillMeta && (
            <div className="border-t border-blue-100 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 px-4 py-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Prompt: {prefillMeta.title}</p>
                <button onClick={() => { setPrefillMeta(null); setInput(""); }} className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300">Clear</button>
              </div>
              <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5">Review the prompt below, then hit send.</p>
            </div>
          )}

          {/* Input */}
          <div className="border-t px-4 py-3 border-[var(--border-light)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPrefillMeta(null);
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              {prefillMeta ? (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={3}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs transition-all resize-none bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-secondary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full text-sm transition-all bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-secondary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              )}
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center text-white hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:from-blue-500 hover:to-violet-500 transition-all z-50 group"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </>
  );
}
