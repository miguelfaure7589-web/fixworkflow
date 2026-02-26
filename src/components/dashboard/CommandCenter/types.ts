// ── Shared types for Revenue Command Center ──

export interface WeeklyLogEntry {
  id: string;
  weekOf: string;
  revenue: number;
  orders: number | null;
  expenses: number | null;
  aov: number | null;
  profit: number | null;
  margin: number | null;
}

export interface MonthlySummary {
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  avgWeeklyRevenue: number;
  monthlyTarget: number | null;
  targetPct: number | null;
  trend: "up" | "down" | null;
  weeksLogged: number;
}

export interface PillarData {
  score: number;
  prev: number | null;
  delta: number;
  reasons: string[];
  levers: string[];
  sources: string[];
  keyMetric: { label: string; value: string; source: string } | null;
}

export interface IntegrationStream {
  id: string;
  provider: string;
  status: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  metrics: Record<string, number | string | null>;
  sparkline: number[];
}

export interface ScoreAlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  pillar: string | null;
  read: boolean;
  createdAt: string;
}

export interface WeeklyComparisonRow {
  weekOf: string;
  revenue: number;
  orders: number | null;
  expenses: number | null;
  profit: number | null;
  margin: number | null;
  revenueDelta: number | null;
  ordersDelta: number | null;
}

export interface GoalData {
  monthlyRevenue: number | null;
  grossMargin: number | null;
  currentRevenue: number;
  currentMargin: number | null;
}

export interface ConnectedProvider {
  provider: string;
  lastSyncAt: string | null;
  status: string;
}

export interface CommandCenterData {
  ok: true;

  // 1. Revenue Overview
  weeklyLogs: WeeklyLogEntry[];
  monthly: MonthlySummary;
  monthlyTarget: number | null;
  totalRevenue: number;
  revenueSource: string | null;

  // 2. Pillar Health
  pillars: Record<string, PillarData>;
  overallScore: number;
  previousScore: number | null;
  scoreChangeReason: string | null;

  // 3. Integration Data Streams
  integrationStreams: IntegrationStream[];

  // 4. Alerts & Opportunities
  alerts: ScoreAlertItem[];

  // 5. Weekly Comparison
  weeklyComparison: WeeklyComparisonRow[];

  // 6. Goal Tracking
  goals: GoalData;

  // 7. Connected providers
  connectedProviders: ConnectedProvider[];
}
