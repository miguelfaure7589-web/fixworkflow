"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Zap, CheckCheck } from "lucide-react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        <div className="fixed bottom-24 right-6 w-[380px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
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
                        : "bg-gray-100 text-gray-700 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">U</span>
                    </div>
                  )}
                </div>
                {/* Delivered indicator for user messages */}
                {msg.role === "user" && (
                  <div className="flex justify-end mt-1 mr-9">
                    <div className="flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] text-gray-400">Delivered</span>
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
                <div className="bg-gray-100 px-5 py-3.5 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-[typing_1.4s_ease-in-out_infinite]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-[typing_1.4s_ease-in-out_0.2s_infinite]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-[typing_1.4s_ease-in-out_0.4s_infinite]" />
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

          {/* Input */}
          <div className="border-t border-gray-100 px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200 hover:from-blue-500 hover:to-violet-500 transition-all z-50 group"
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
