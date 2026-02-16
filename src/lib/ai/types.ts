/**
 * AI Explain — Shared Types
 */

export interface PreviewExplanation {
  why: string;
  firstStep: string;
  upgradeHint: string;
}

export interface FullExplanation {
  whyDeep: string;
  steps: string[];
  successMetrics: string[];
  pitfalls: string[];
  suggestedTools: string[];
  promptToExecute: string;
}

export interface ExplainRequest {
  itemType: "focus" | "tool";
  itemKey: string;
  pillar: string;
  title: string;
  description: string;
}

export interface ExplainResponse {
  preview: PreviewExplanation;
  full: FullExplanation | null;
  cached: boolean;
}
