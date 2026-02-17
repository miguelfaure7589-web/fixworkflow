/**
 * Playbook AI Expansion Types
 */

export interface ExpandedPlaybook {
  personalizedSteps: {
    day: number;
    title: string;
    action: string;
    whyNow: string;
  }[];
  kpiTargets: string[];
  risks: string[];
  suggestedTools: string[];
  copyPrompt: string;
}

export interface PlaybookExpandRequest {
  playbookSlug: string;
}

export interface PlaybookExpandResponse {
  expanded: ExpandedPlaybook | null;
  cached: boolean;
  error?: string;
}
