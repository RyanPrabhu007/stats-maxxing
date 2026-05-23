import {
  MONK_BADGE_MIN_STREAK,
  MONK_DIS_BONUS_PER_MILESTONE,
  MONK_MILESTONE_DAYS,
  STAT_FLOOR,
} from '../constants';
import type { HunterState, MonkBadge, MonkMode } from '../types';
import { todayISO } from './date';

export function defaultMonkMode(): MonkMode {
  return {
    active: false,
    startedAt: null,
    streakDays: 0,
    lastCheckInDate: null,
    dailyCheckIn: null,
    history: [],
    badges: [],
  };
}

/**
 * Snapshot of monk-related fields before a break — for the 30-second undo toast.
 * Includes the level/xp prior to the break penalty so undo can restore them.
 */
export interface MonkBreakSnapshot {
  monkMode: MonkMode;
  level: number;
  xp: number;
  highestRankIndex: number;
  reason: 'manual' | 'auto';
  brokenStreakLength: number;
}

export function activateMonk(state: HunterState, now: Date = new Date()): HunterState {
  if (state.monkMode.active) return state;
  const today = todayISO(now);
  return {
    ...state,
    monkMode: {
      ...state.monkMode,
      active: true,
      startedAt: today,
      streakDays: 0,
      lastCheckInDate: null,
      dailyCheckIn: { date: today, noPorn: false, noFap: false },
    },
  };
}

export function setMonkCheckIn(
  state: HunterState,
  field: 'noPorn' | 'noFap',
  value: boolean,
  now: Date = new Date(),
): HunterState {
  if (!state.monkMode.active) return state;
  const today = todayISO(now);
  const current = state.monkMode.dailyCheckIn;
  const checkIn =
    current && current.date === today
      ? { ...current, [field]: value }
      : { date: today, noPorn: false, noFap: false, [field]: value };
  return {
    ...state,
    monkMode: { ...state.monkMode, dailyCheckIn: checkIn },
  };
}

/**
 * Apply the break penalty: -1 level (floor 1), xp -> 0, log history, deactivate.
 * Returns the new state + a snapshot for undo.
 */
export function breakMonk(
  state: HunterState,
  reason: 'manual' | 'auto',
  now: Date = new Date(),
): { state: HunterState; snapshot: MonkBreakSnapshot } {
  if (!state.monkMode.active) {
    return {
      state,
      snapshot: {
        monkMode: state.monkMode,
        level: state.level,
        xp: state.xp,
        highestRankIndex: state.highestRankIndex,
        reason,
        brokenStreakLength: 0,
      },
    };
  }
  const today = todayISO(now);
  const snapshot: MonkBreakSnapshot = {
    monkMode: state.monkMode,
    level: state.level,
    xp: state.xp,
    highestRankIndex: state.highestRankIndex,
    reason,
    brokenStreakLength: state.monkMode.streakDays,
  };

  const newLevel = Math.max(1, state.level - 1);
  const runEntry = {
    startedAt: state.monkMode.startedAt ?? today,
    endedAt: today,
    streakLength: state.monkMode.streakDays,
    outcome: 'broken' as const,
  };

  return {
    state: {
      ...state,
      level: newLevel,
      xp: 0,
      monkMode: {
        ...state.monkMode,
        active: false,
        startedAt: null,
        streakDays: 0,
        lastCheckInDate: null,
        dailyCheckIn: null,
        history: [...state.monkMode.history, runEntry],
      },
    },
    snapshot,
  };
}

/**
 * Restore state from a snapshot taken before a break. Reactivates monk mode and
 * undoes the level/xp penalty. Pops the most recent 'broken' run from history.
 */
export function undoBreakMonk(
  state: HunterState,
  snapshot: MonkBreakSnapshot,
): HunterState {
  // Drop the last history entry if it matches the broken run we logged
  const trimmedHistory = [...state.monkMode.history];
  if (
    trimmedHistory.length > 0 &&
    trimmedHistory[trimmedHistory.length - 1].outcome === 'broken'
  ) {
    trimmedHistory.pop();
  }
  return {
    ...state,
    level: snapshot.level,
    xp: snapshot.xp,
    highestRankIndex: snapshot.highestRankIndex,
    monkMode: { ...snapshot.monkMode, history: trimmedHistory },
  };
}

/**
 * Voluntary end: no penalty. Awards a badge if streak >= MONK_BADGE_MIN_STREAK.
 */
export function voluntaryEndMonk(
  state: HunterState,
  now: Date = new Date(),
): HunterState {
  if (!state.monkMode.active) return state;
  const today = todayISO(now);
  const runEntry = {
    startedAt: state.monkMode.startedAt ?? today,
    endedAt: today,
    streakLength: state.monkMode.streakDays,
    outcome: 'ended_voluntarily' as const,
  };
  const newBadges: MonkBadge[] = [...state.monkMode.badges];
  if (state.monkMode.streakDays >= MONK_BADGE_MIN_STREAK) {
    newBadges.push({ streakLength: state.monkMode.streakDays, earnedAt: today });
  }
  return {
    ...state,
    monkMode: {
      ...state.monkMode,
      active: false,
      startedAt: null,
      streakDays: 0,
      lastCheckInDate: null,
      dailyCheckIn: null,
      history: [...state.monkMode.history, runEntry],
      badges: newBadges,
    },
  };
}

export interface MonkDailyTransitionResult {
  state: HunterState;
  autoBroke: MonkBreakSnapshot | null;
  streakAdvanced: boolean;
  milestonesReached: number[]; // streakDays values that were milestone days
}

/**
 * Called from processDailyReset when the day actually changes.
 * `gap` = days between state.todayDate (yesterday) and the new today.
 *
 * Rule (per user's "auto-break at midnight" choice):
 *   - gap === 1 AND yesterday's check-in fully complete → +1 streak, DIS bonus on milestones
 *   - else → auto-break (penalty applies)
 */
export function applyMonkDailyTransition(
  state: HunterState,
  newToday: string,
  gap: number,
): MonkDailyTransitionResult {
  if (!state.monkMode.active) {
    return { state, autoBroke: null, streakAdvanced: false, milestonesReached: [] };
  }
  const yesterday = state.todayDate;
  const checkIn = state.monkMode.dailyCheckIn;
  const yesterdayClean =
    gap === 1 &&
    checkIn !== null &&
    checkIn.date === yesterday &&
    checkIn.noPorn &&
    checkIn.noFap;

  // Special case: user activated yesterday AND immediately rolled over without
  // checking in. PRD treats this the same — break.
  if (!yesterdayClean) {
    const { state: broken, snapshot } = breakMonk(state, 'auto');
    // Bump the snapshot's brokenStreakLength to reflect the achieved streak
    return {
      state: broken,
      autoBroke: snapshot,
      streakAdvanced: false,
      milestonesReached: [],
    };
  }

  const newStreak = state.monkMode.streakDays + 1;
  const milestones: number[] = [];
  let newStats = state.stats;
  if (newStreak > 0 && newStreak % MONK_MILESTONE_DAYS === 0) {
    milestones.push(newStreak);
    newStats = {
      ...newStats,
      DIS: Math.max(STAT_FLOOR, newStats.DIS + MONK_DIS_BONUS_PER_MILESTONE),
    };
  }

  return {
    state: {
      ...state,
      stats: newStats,
      monkMode: {
        ...state.monkMode,
        streakDays: newStreak,
        lastCheckInDate: yesterday,
        dailyCheckIn: { date: newToday, noPorn: false, noFap: false },
      },
    },
    autoBroke: null,
    streakAdvanced: true,
    milestonesReached: milestones,
  };
}
