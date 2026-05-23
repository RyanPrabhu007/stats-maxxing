export type StatKey = 'STR' | 'VIT' | 'GER' | 'WIS' | 'DIS';

export type Stats = Record<StatKey, number>;

export type QuestId =
  | 'duolingo'
  | 'vocab'
  | 'fmva'
  | 'german_class'
  | 'gym';

export interface Quest {
  id: QuestId;
  name: string;
  description: string;
  primaryStat: StatKey;
  secondaryStat?: StatKey;
  xpReward: number;
  currentStreak: number;
  longestStreak: number;
  daysSinceLastCompletion: number;
}

export interface DailyLog {
  date: string;
  completedQuests: QuestId[];
  perfectDay: boolean;
  statsSnapshot?: Stats;
  level?: number;
}

export interface PendingEvent {
  id: string;
  type: 'level-up' | 'rank-up' | 'stat-up' | 'stat-down';
  payload?: Record<string, unknown>;
}

export interface MonkDailyCheckIn {
  date: string;
  noPorn: boolean;
  noFap: boolean;
}

export type MonkRunOutcome = 'broken' | 'ended_voluntarily';

export interface MonkRunHistory {
  startedAt: string;
  endedAt: string;
  streakLength: number;
  outcome: MonkRunOutcome;
}

export interface MonkBadge {
  streakLength: number;
  earnedAt: string;
}

export interface MonkMode {
  active: boolean;
  startedAt: string | null;
  streakDays: number;
  lastCheckInDate: string | null;
  dailyCheckIn: MonkDailyCheckIn | null;
  history: MonkRunHistory[];
  badges: MonkBadge[];
}

export interface HunterState {
  hunterName: string;
  level: number;
  xp: number;
  stats: Stats;
  quests: Quest[];
  history: DailyLog[];
  todayCompleted: QuestId[];
  todayDate: string;
  createdAt: string;
  lastOpenedAt: string;
  statChangesToday: Partial<Record<StatKey, 'up' | 'down'>>;
  highestRankIndex: number;
  monkMode: MonkMode;
}

export type RankName =
  | 'E-Rank'
  | 'D-Rank'
  | 'C-Rank'
  | 'B-Rank'
  | 'A-Rank'
  | 'S-Rank'
  | 'National Level Hunter';
