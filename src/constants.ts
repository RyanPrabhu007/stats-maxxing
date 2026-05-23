import type { Quest, RankName, Stats, StatKey } from './types';

export const STORAGE_KEY = 'hunter_tracker_v1';

export const STAT_KEYS: StatKey[] = ['STR', 'VIT', 'GER', 'WIS', 'DIS'];

export const STAT_LABELS: Record<StatKey, string> = {
  STR: 'Strength',
  VIT: 'Vitality',
  GER: 'German Skill',
  WIS: 'Wisdom',
  DIS: 'Discipline',
};

export const STAT_COLORS: Record<StatKey, string> = {
  STR: '#ff7043',
  VIT: '#00ff88',
  GER: '#00d4ff',
  WIS: '#8b5cf6',
  DIS: '#ffaa00',
};

export const STAT_FLOOR = 1;
export const STAT_STARTING = 10;

export const DECAY_WARNING_DAYS = 3;
export const DECAY_START_DAYS = 5;
export const STREAK_BURST_DAYS = 7;
export const STREAK_BURST_BONUS_STAT = 3;
export const STREAK_BURST_BONUS_XP = 30;
export const PERFECT_DAY_BONUS_XP = 50;
export const PERFECT_DAY_BONUS_DIS = 2;
export const DISCIPLINE_DECAY_MIN_QUESTS = 3;

export const STARTING_STATS: Stats = {
  STR: STAT_STARTING,
  VIT: STAT_STARTING,
  GER: STAT_STARTING,
  WIS: STAT_STARTING,
  DIS: STAT_STARTING,
};

export const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'duolingo',
    name: 'Duolingo',
    description: 'Complete your daily lesson',
    primaryStat: 'GER',
    xpReward: 10,
    currentStreak: 0,
    longestStreak: 0,
    daysSinceLastCompletion: 0,
  },
  {
    id: 'vocab',
    name: 'Revise Vocab',
    description: 'Drill German vocabulary',
    primaryStat: 'GER',
    xpReward: 10,
    currentStreak: 0,
    longestStreak: 0,
    daysSinceLastCompletion: 0,
  },
  {
    id: 'fmva',
    name: 'FMVA Study',
    description: 'Push the certification forward',
    primaryStat: 'WIS',
    xpReward: 20,
    currentStreak: 0,
    longestStreak: 0,
    daysSinceLastCompletion: 0,
  },
  {
    id: 'german_class',
    name: 'German Class / Self-Study',
    description: 'Attend class or do focused self-study',
    primaryStat: 'GER',
    xpReward: 20,
    currentStreak: 0,
    longestStreak: 0,
    daysSinceLastCompletion: 0,
  },
  {
    id: 'gym',
    name: 'Gym',
    description: 'Train your body',
    primaryStat: 'STR',
    secondaryStat: 'VIT',
    xpReward: 25,
    currentStreak: 0,
    longestStreak: 0,
    daysSinceLastCompletion: 0,
  },
];

export interface RankTier {
  name: RankName;
  minLevel: number;
  color: string;
}

export const RANK_TIERS: RankTier[] = [
  { name: 'E-Rank', minLevel: 1, color: '#8b94a8' },
  { name: 'D-Rank', minLevel: 6, color: '#00ff88' },
  { name: 'C-Rank', minLevel: 11, color: '#00d4ff' },
  { name: 'B-Rank', minLevel: 21, color: '#8b5cf6' },
  { name: 'A-Rank', minLevel: 36, color: '#ffaa00' },
  { name: 'S-Rank', minLevel: 56, color: '#ff3355' },
  { name: 'National Level Hunter', minLevel: 81, color: '#fff' },
];

export function getRankForLevel(level: number): RankTier {
  let current = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (level >= tier.minLevel) current = tier;
  }
  return current;
}

export function getRankIndexForLevel(level: number): number {
  let idx = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (level >= RANK_TIERS[i].minLevel) idx = i;
  }
  return idx;
}

export function xpToNextLevel(level: number): number {
  return 100 * level;
}

// === Monk Mode ===
export const MONK_MULTIPLIER_TIER_1_DAYS = 7;
export const MONK_MULTIPLIER_TIER_2_DAYS = 14;
export const MONK_MULTIPLIER_TIER_1 = 1.5;
export const MONK_MULTIPLIER_TIER_2 = 2.0;
export const MONK_DIS_BONUS_PER_MILESTONE = 1;
export const MONK_MILESTONE_DAYS = 7;
export const MONK_BREAK_UNDO_WINDOW_MS = 30_000;
export const MONK_BADGE_MIN_STREAK = 7;

export function monkMultiplier(streakDays: number): number {
  if (streakDays >= MONK_MULTIPLIER_TIER_2_DAYS) return MONK_MULTIPLIER_TIER_2;
  if (streakDays >= MONK_MULTIPLIER_TIER_1_DAYS) return MONK_MULTIPLIER_TIER_1;
  return 1.0;
}
