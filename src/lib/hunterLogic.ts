import {
  DECAY_START_DAYS,
  DEFAULT_QUESTS,
  DISCIPLINE_DECAY_MIN_QUESTS,
  PERFECT_DAY_BONUS_DIS,
  PERFECT_DAY_BONUS_XP,
  STAT_FLOOR,
  STARTING_STATS,
  STREAK_BURST_BONUS_STAT,
  STREAK_BURST_BONUS_XP,
  STREAK_BURST_DAYS,
  getRankIndexForLevel,
  xpToNextLevel,
} from '../constants';
import type { HunterState, Quest, QuestId, StatKey, Stats } from '../types';
import { addDays, daysBetween, todayISO } from './date';

export interface LevelUpEvent {
  newLevel: number;
  newRank?: string;
  rankUp: boolean;
}

export interface ToggleResult {
  state: HunterState;
  levelUps: LevelUpEvent[];
  questCompleted: boolean;
}

export function makeInitialState(name = 'Hunter', now: Date = new Date()): HunterState {
  const today = todayISO(now);
  return {
    hunterName: name,
    level: 1,
    xp: 0,
    stats: { ...STARTING_STATS },
    quests: DEFAULT_QUESTS.map((q) => ({ ...q })),
    history: [],
    todayCompleted: [],
    todayDate: today,
    createdAt: today,
    lastOpenedAt: today,
    statChangesToday: {},
    highestRankIndex: 0,
  };
}

function clampStat(v: number): number {
  return Math.max(STAT_FLOOR, v);
}

function addToStat(stats: Stats, key: StatKey, delta: number): Stats {
  return { ...stats, [key]: clampStat(stats[key] + delta) };
}

function questStatGain(quest: Quest, stats: Stats): Stats {
  if (quest.secondaryStat) {
    let next = addToStat(stats, quest.primaryStat, 0.5);
    next = addToStat(next, quest.secondaryStat, 0.5);
    return next;
  }
  return addToStat(stats, quest.primaryStat, 1);
}

function questStatRevert(quest: Quest, stats: Stats): Stats {
  if (quest.secondaryStat) {
    let next = addToStat(stats, quest.primaryStat, -0.5);
    next = addToStat(next, quest.secondaryStat, -0.5);
    return next;
  }
  return addToStat(stats, quest.primaryStat, -1);
}

function checkLevelUps(state: HunterState): { state: HunterState; events: LevelUpEvent[] } {
  let working = state;
  const events: LevelUpEvent[] = [];
  while (working.xp >= xpToNextLevel(working.level)) {
    const cost = xpToNextLevel(working.level);
    const newLevel = working.level + 1;
    const newStats: Stats = {
      STR: working.stats.STR + 1,
      VIT: working.stats.VIT + 1,
      GER: working.stats.GER + 1,
      WIS: working.stats.WIS + 1,
      DIS: working.stats.DIS + 1,
    };
    const oldRankIdx = working.highestRankIndex;
    const newRankIdx = getRankIndexForLevel(newLevel);
    const rankUp = newRankIdx > oldRankIdx;
    working = {
      ...working,
      level: newLevel,
      xp: working.xp - cost,
      stats: newStats,
      highestRankIndex: Math.max(oldRankIdx, newRankIdx),
    };
    events.push({ newLevel, rankUp, newRank: rankUp ? String(newRankIdx) : undefined });
  }
  return { state: working, events };
}

export function toggleQuest(
  state: HunterState,
  questId: QuestId,
): ToggleResult {
  const isCompleted = state.todayCompleted.includes(questId);
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest) return { state, levelUps: [], questCompleted: false };

  if (isCompleted) {
    // Untoggle (same-day undo)
    let xp = state.xp - quest.xpReward;
    let stats = questStatRevert(quest, state.stats);
    const newStreak = Math.max(0, quest.currentStreak - 1);

    // If this completion produced a 7-day burst bonus, undo it.
    const hitBurst = quest.currentStreak > 0 && quest.currentStreak % STREAK_BURST_DAYS === 0;
    if (hitBurst) {
      xp -= STREAK_BURST_BONUS_XP;
      stats = addToStat(stats, quest.primaryStat, -STREAK_BURST_BONUS_STAT);
    }

    // If this was the 5th quest (perfect day), revert that bonus.
    const wasPerfectDay = state.todayCompleted.length === state.quests.length;
    if (wasPerfectDay) {
      xp -= PERFECT_DAY_BONUS_XP;
      stats = addToStat(stats, 'DIS', -PERFECT_DAY_BONUS_DIS);
    }

    if (xp < 0) xp = 0;

    const newQuests = state.quests.map((q) =>
      q.id === questId ? { ...q, currentStreak: newStreak } : q,
    );
    const todayCompleted = state.todayCompleted.filter((id) => id !== questId);

    // Reverse stat-up flash only for the stats affected
    const changes = { ...state.statChangesToday };
    delete changes[quest.primaryStat];
    if (quest.secondaryStat) delete changes[quest.secondaryStat];
    if (wasPerfectDay) delete changes['DIS'];

    return {
      state: {
        ...state,
        xp,
        stats,
        quests: newQuests,
        todayCompleted,
        statChangesToday: changes,
      },
      levelUps: [],
      questCompleted: false,
    };
  }

  // Complete the quest
  const newStreak = quest.currentStreak + 1;
  const isBurst = newStreak > 0 && newStreak % STREAK_BURST_DAYS === 0;

  let xp = state.xp + quest.xpReward;
  let stats = questStatGain(quest, state.stats);
  if (isBurst) {
    xp += STREAK_BURST_BONUS_XP;
    stats = addToStat(stats, quest.primaryStat, STREAK_BURST_BONUS_STAT);
  }

  const changes: HunterState['statChangesToday'] = { ...state.statChangesToday };
  changes[quest.primaryStat] = 'up';
  if (quest.secondaryStat) changes[quest.secondaryStat] = 'up';

  const newQuests = state.quests.map((q) =>
    q.id === questId
      ? {
          ...q,
          currentStreak: newStreak,
          longestStreak: Math.max(q.longestStreak, newStreak),
          daysSinceLastCompletion: 0,
        }
      : q,
  );

  const todayCompleted = [...state.todayCompleted, questId];
  const isPerfectDay = todayCompleted.length === state.quests.length;

  if (isPerfectDay) {
    xp += PERFECT_DAY_BONUS_XP;
    stats = addToStat(stats, 'DIS', PERFECT_DAY_BONUS_DIS);
    changes['DIS'] = 'up';
  }

  let next: HunterState = {
    ...state,
    xp,
    stats,
    quests: newQuests,
    todayCompleted,
    statChangesToday: changes,
  };

  const { state: leveledState, events } = checkLevelUps(next);
  next = leveledState;

  return { state: next, levelUps: events, questCompleted: true };
}

/**
 * Process all skipped days between lastOpenedAt and today.
 * Returns the new state with decay applied and the previous day(s) committed to history.
 */
export interface DailyResetSummary {
  daysProcessed: number;
  decayedStats: Partial<Record<StatKey, number>>;
  skippedQuests: Record<string, number>;
  disciplineDecay: number;
}

export function processDailyReset(
  state: HunterState,
  now: Date = new Date(),
): { state: HunterState; summary: DailyResetSummary | null } {
  const today = todayISO(now);
  if (today === state.todayDate) {
    return { state, summary: null };
  }

  const decayed: Partial<Record<StatKey, number>> = {};
  const skipped: Record<string, number> = {};
  let disciplineDecay = 0;
  let working = state;

  // First, commit today (now becoming "yesterday") to history, then walk forward.
  const yesterdayCompleted = state.todayCompleted;
  const yesterdayDate = state.todayDate;
  const isYesterdayPerfect = yesterdayCompleted.length === state.quests.length;
  let history = [...state.history];
  if (!history.find((h) => h.date === yesterdayDate)) {
    history = [
      ...history,
      {
        date: yesterdayDate,
        completedQuests: [...yesterdayCompleted],
        perfectDay: isYesterdayPerfect,
        statsSnapshot: { ...state.stats },
        level: state.level,
      },
    ];
  }
  // Cap history at last 365 days
  if (history.length > 365) {
    history = history.slice(history.length - 365);
  }

  // Apply DIS decay for yesterday if fewer than 3 quests completed
  if (yesterdayCompleted.length < DISCIPLINE_DECAY_MIN_QUESTS) {
    const before = working.stats.DIS;
    const after = Math.max(STAT_FLOOR, before - 1);
    if (after !== before) {
      working = { ...working, stats: { ...working.stats, DIS: after } };
      disciplineDecay += before - after;
    }
  }

  // For each quest, determine streak/skip handling for yesterday
  const updatedQuests: Quest[] = working.quests.map((q) => {
    if (yesterdayCompleted.includes(q.id)) {
      // Already accounted at toggle time; daysSinceLastCompletion is 0.
      return { ...q, daysSinceLastCompletion: 0 };
    }
    // Quest was skipped yesterday — break streak, increment skip counter
    return {
      ...q,
      currentStreak: 0,
      daysSinceLastCompletion: q.daysSinceLastCompletion + 1,
    };
  });
  working = { ...working, quests: updatedQuests };

  // Now walk every fully-skipped day between yesterday + 1 and today - 1 (exclusive of today)
  const gap = daysBetween(yesterdayDate, today); // 1 means just rolled to next day
  for (let i = 1; i < gap; i++) {
    const skippedDate = addDays(yesterdayDate, i);
    // No quests completed on this day. Apply DIS decay (< 3 quests done).
    const before = working.stats.DIS;
    const after = Math.max(STAT_FLOOR, before - 1);
    if (after !== before) {
      working = { ...working, stats: { ...working.stats, DIS: after } };
      disciplineDecay += before - after;
    }
    // Increment skip counters for every quest, break streaks
    const qs = working.quests.map((q) => ({
      ...q,
      currentStreak: 0,
      daysSinceLastCompletion: q.daysSinceLastCompletion + 1,
    }));
    working = { ...working, quests: qs };
    history.push({
      date: skippedDate,
      completedQuests: [],
      perfectDay: false,
      statsSnapshot: { ...working.stats },
      level: working.level,
    });
  }

  // Apply decay AFTER incrementing — for each quest whose daysSinceLastCompletion >= DECAY_START_DAYS,
  // remove (daysSince - (DECAY_START_DAYS - 1)) stat points total. We approximate by removing
  // (current - prior) deltas: i.e., for each new day that pushed quest into or beyond decay range, -1.
  // Concretely: if daysSince was X before this reset and is now Y, decay amount = max(0, Y - max(X, DECAY_START_DAYS - 1)).
  const priorDaysSince: Record<QuestId, number> = {} as Record<QuestId, number>;
  state.quests.forEach((q) => {
    priorDaysSince[q.id] = q.daysSinceLastCompletion;
  });

  working = {
    ...working,
    quests: working.quests.map((q) => {
      const before = priorDaysSince[q.id];
      const after = q.daysSinceLastCompletion;
      if (after >= DECAY_START_DAYS && after > before) {
        const fromDay = Math.max(before, DECAY_START_DAYS - 1);
        const decayAmount = after - fromDay;
        if (decayAmount > 0) {
          const beforeStat = working.stats[q.primaryStat];
          const afterStat = Math.max(STAT_FLOOR, beforeStat - decayAmount);
          working = {
            ...working,
            stats: { ...working.stats, [q.primaryStat]: afterStat },
          };
          decayed[q.primaryStat] = (decayed[q.primaryStat] ?? 0) + (beforeStat - afterStat);
          if (q.secondaryStat) {
            const beforeStat2 = working.stats[q.secondaryStat];
            const afterStat2 = Math.max(STAT_FLOOR, beforeStat2 - decayAmount);
            working = {
              ...working,
              stats: { ...working.stats, [q.secondaryStat]: afterStat2 },
            };
            decayed[q.secondaryStat] =
              (decayed[q.secondaryStat] ?? 0) + (beforeStat2 - afterStat2);
          }
          skipped[q.id] = after;
        }
      }
      return q;
    }),
  };

  // Reset today
  const statChangesToday: HunterState['statChangesToday'] = {};
  for (const key of Object.keys(decayed) as StatKey[]) {
    if ((decayed[key] ?? 0) > 0) statChangesToday[key] = 'down';
  }
  if (disciplineDecay > 0) statChangesToday['DIS'] = 'down';

  const newState: HunterState = {
    ...working,
    todayDate: today,
    todayCompleted: [],
    lastOpenedAt: today,
    history,
    statChangesToday,
  };

  return {
    state: newState,
    summary: {
      daysProcessed: gap,
      decayedStats: decayed,
      skippedQuests: skipped,
      disciplineDecay,
    },
  };
}

export function questsAtRisk(state: HunterState): Quest[] {
  return state.quests.filter(
    (q) => q.daysSinceLastCompletion >= 3 && !state.todayCompleted.includes(q.id),
  );
}

// Recompute a quest's currentStreak + daysSinceLastCompletion from history + todayCompleted.
// daysSinceLastCompletion follows the existing convention: 0 if completed today OR yesterday,
// otherwise (days between most-recent completion and today) - 1.
function recomputeQuestProgress(
  state: HunterState,
  questId: QuestId,
): { currentStreak: number; daysSinceLastCompletion: number } {
  const today = state.todayDate;
  const doneToday = state.todayCompleted.includes(questId);
  const historyByDate = new Map<string, QuestId[]>(
    state.history.map((d) => [d.date, d.completedQuests]),
  );

  let streak = doneToday ? 1 : 0;
  let cursor = addDays(today, -1);
  for (let i = 0; i < state.history.length + 1; i++) {
    const entry = historyByDate.get(cursor);
    if (!entry || !entry.includes(questId)) break;
    streak++;
    cursor = addDays(cursor, -1);
  }

  let daysSince: number;
  if (doneToday) {
    daysSince = 0;
  } else {
    let mostRecent: string | null = null;
    let walkCursor = addDays(today, -1);
    for (let i = 0; i < state.history.length + 1; i++) {
      const entry = historyByDate.get(walkCursor);
      if (entry && entry.includes(questId)) {
        mostRecent = walkCursor;
        break;
      }
      walkCursor = addDays(walkCursor, -1);
      if (walkCursor < state.createdAt) break;
    }
    daysSince = mostRecent
      ? Math.max(0, daysBetween(mostRecent, today) - 1)
      : Math.max(0, daysBetween(state.createdAt, today) - 1);
  }

  return { currentStreak: streak, daysSinceLastCompletion: daysSince };
}

export interface DayEditOverrides {
  xp?: number;
  stats?: Partial<Stats>;
}

export interface EditPastDayResult {
  state: HunterState;
  levelUps: LevelUpEvent[];
}

/**
 * Edit a past day's completedQuests (and optionally override top-level xp/stats).
 * Applies XP + stat deltas for added/removed quests, fixes perfect-day bonus,
 * recomputes affected quest streaks, then runs level-up check.
 *
 * `date` must be in state.history (i.e., a past day, not today).
 */
export function editPastDay(
  state: HunterState,
  date: string,
  newCompleted: QuestId[],
  overrides: DayEditOverrides = {},
): EditPastDayResult {
  const historyIdx = state.history.findIndex((h) => h.date === date);
  if (historyIdx === -1) {
    return { state, levelUps: [] };
  }
  const prev = state.history[historyIdx];
  const prevSet = new Set(prev.completedQuests);
  const nextSet = new Set(newCompleted);
  const totalQuests = state.quests.length;

  const added: QuestId[] = newCompleted.filter((q) => !prevSet.has(q));
  const removed: QuestId[] = prev.completedQuests.filter((q) => !nextSet.has(q));

  let xp = state.xp;
  let stats = { ...state.stats };
  const affectedQuests = new Set<QuestId>([...added, ...removed]);

  for (const qid of added) {
    const q = state.quests.find((x) => x.id === qid);
    if (!q) continue;
    xp += q.xpReward;
    stats = questStatGain(q, stats);
  }
  for (const qid of removed) {
    const q = state.quests.find((x) => x.id === qid);
    if (!q) continue;
    xp -= q.xpReward;
    stats = questStatRevert(q, stats);
  }

  const wasPerfect = prev.completedQuests.length === totalQuests;
  const isPerfect = newCompleted.length === totalQuests;
  if (!wasPerfect && isPerfect) {
    xp += PERFECT_DAY_BONUS_XP;
    stats = addToStat(stats, 'DIS', PERFECT_DAY_BONUS_DIS);
  } else if (wasPerfect && !isPerfect) {
    xp -= PERFECT_DAY_BONUS_XP;
    stats = addToStat(stats, 'DIS', -PERFECT_DAY_BONUS_DIS);
  }

  // Patch history entry
  const newHistory = [...state.history];
  const snapshotDelta: Partial<Stats> = {};
  for (const k of Object.keys(stats) as StatKey[]) {
    snapshotDelta[k] = stats[k] - state.stats[k];
  }
  const newSnapshot: Stats | undefined = prev.statsSnapshot
    ? {
        STR: clampStat(prev.statsSnapshot.STR + (snapshotDelta.STR ?? 0)),
        VIT: clampStat(prev.statsSnapshot.VIT + (snapshotDelta.VIT ?? 0)),
        GER: clampStat(prev.statsSnapshot.GER + (snapshotDelta.GER ?? 0)),
        WIS: clampStat(prev.statsSnapshot.WIS + (snapshotDelta.WIS ?? 0)),
        DIS: clampStat(prev.statsSnapshot.DIS + (snapshotDelta.DIS ?? 0)),
      }
    : undefined;
  newHistory[historyIdx] = {
    ...prev,
    completedQuests: [...newCompleted],
    perfectDay: isPerfect,
    statsSnapshot: newSnapshot,
  };

  // Apply absolute overrides on top (god-mode)
  if (overrides.xp !== undefined && overrides.xp >= 0) {
    xp = Math.floor(overrides.xp);
  }
  if (overrides.stats) {
    for (const k of Object.keys(overrides.stats) as StatKey[]) {
      const v = overrides.stats[k];
      if (v !== undefined) stats[k] = clampStat(Math.floor(v));
    }
  }

  if (xp < 0) xp = 0;

  // Recompute streaks for any quests whose completion status changed
  let newQuests = state.quests.map((q) => ({ ...q }));
  if (affectedQuests.size > 0) {
    const tempState: HunterState = { ...state, history: newHistory };
    newQuests = newQuests.map((q) => {
      if (!affectedQuests.has(q.id)) return q;
      const { currentStreak, daysSinceLastCompletion } = recomputeQuestProgress(
        tempState,
        q.id,
      );
      return {
        ...q,
        currentStreak,
        longestStreak: Math.max(q.longestStreak, currentStreak),
        daysSinceLastCompletion,
      };
    });
  }

  let next: HunterState = {
    ...state,
    xp,
    stats,
    quests: newQuests,
    history: newHistory,
  };

  const { state: leveledState, events } = checkLevelUps(next);
  next = leveledState;

  return { state: next, levelUps: events };
}
