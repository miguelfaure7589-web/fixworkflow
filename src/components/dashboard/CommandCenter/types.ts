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
}

export interface ConnectedProvider {
  provider: string;
  lastSyncAt: string | null;
  status: string;
}

export interface CommandCenterData {
  ok: true;
  weeklyLogs: WeeklyLogEntry[];
  monthly: MonthlySummary;
  monthlyTarget: number | null;
  pillars: Record<string, PillarData>;
  overallScore: number;
  previousScore: number | null;
  scoreChangeReason: string | null;
  connectedProviders: ConnectedProvider[];
}
