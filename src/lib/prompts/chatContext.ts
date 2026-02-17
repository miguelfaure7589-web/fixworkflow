/**
 * Lightweight global event bus for prefilling the AI chat.
 * Used by dashboard "Ask AI" buttons to communicate with the AiChat component.
 *
 * Pattern: CustomEvent on window — no React context needed,
 * works across component boundaries since AiChat is in layout.
 */

export interface ChatPrefillPayload {
  prompt: string;
  rationale: string[];
  templateTitle: string;
}

const EVENT_NAME = "fixworkflow:chat-prefill";

export function dispatchChatPrefill(payload: ChatPrefillPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
}

export function onChatPrefill(
  handler: (payload: ChatPrefillPayload) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    handler((e as CustomEvent<ChatPrefillPayload>).detail);
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
