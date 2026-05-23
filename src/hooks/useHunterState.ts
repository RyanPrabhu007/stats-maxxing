import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEY } from '../constants';
import {
  type DailyResetSummary,
  type DayEditOverrides,
  type LevelUpEvent,
  editPastDay,
  ensureMonkMode,
  makeInitialState,
  processDailyReset,
  toggleQuest,
} from '../lib/hunterLogic';
import {
  type MonkBreakSnapshot,
  activateMonk,
  breakMonk,
  setMonkCheckIn,
  undoBreakMonk,
  voluntaryEndMonk,
} from '../lib/monkLogic';
import { todayISO } from '../lib/date';
import type { HunterState, QuestId } from '../types';
import { fetchCloudState, upsertCloudState } from '../lib/cloudSync';

function loadFromStorage(): HunterState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HunterState;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(s: HunterState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore quota errors silently
  }
}

export interface HunterStateApi {
  state: HunterState;
  toggle: (id: QuestId) => void;
  rename: (name: string) => void;
  resetAll: () => void;
  importJSON: (s: HunterState) => void;
  exportJSON: () => string;
  advanceDay: () => void; // dev shortcut
  editDay: (date: string, completed: QuestId[], overrides?: DayEditOverrides) => void;
  pendingLevelUps: LevelUpEvent[];
  acknowledgeLevelUp: () => void;
  resetSummary: DailyResetSummary | null;
  acknowledgeResetSummary: () => void;
  syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
  // Monk Mode
  activateMonkMode: () => void;
  toggleMonkCheckIn: (field: 'noPorn' | 'noFap') => void;
  manualBreakMonk: () => void;
  endMonkVoluntarily: () => void;
  undoMonkBreak: () => void;
  acknowledgeMonkBreak: () => void;
  pendingMonkBreak: MonkBreakSnapshot | null;
}

export function useHunterState(userId: string | null): HunterStateApi {
  const [state, setState] = useState<HunterState>(() => {
    const stored = loadFromStorage();
    if (!stored) return makeInitialState();
    const { state: rolled } = processDailyReset(ensureMonkMode(stored));
    return rolled;
  });
  const [pendingLevelUps, setPendingLevelUps] = useState<LevelUpEvent[]>([]);
  const [resetSummary, setResetSummary] = useState<DailyResetSummary | null>(() => {
    const stored = loadFromStorage();
    if (!stored) return null;
    const { summary } = processDailyReset(ensureMonkMode(stored));
    return summary && summary.daysProcessed > 0 ? summary : null;
  });
  const [pendingMonkBreak, setPendingMonkBreak] = useState<MonkBreakSnapshot | null>(
    () => {
      const stored = loadFromStorage();
      if (!stored) return null;
      const { summary } = processDailyReset(ensureMonkMode(stored));
      return summary?.monkBrokeAuto ?? null;
    },
  );
  const [syncStatus, setSyncStatus] = useState<HunterStateApi['syncStatus']>('idle');
  const devOffsetRef = useRef(0);
  const cloudHydratedRef = useRef(false);
  const hydratedForUserRef = useRef<string | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  // Persist on every state change to localStorage (instant, offline-safe)
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Re-check daily reset every minute in case the user keeps the tab open across midnight
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.todayDate === todayISO()) return prev;
        const { state: rolled, summary } = processDailyReset(prev);
        if (summary && summary.daysProcessed > 0) setResetSummary(summary);
        if (summary?.monkBrokeAuto) setPendingMonkBreak(summary.monkBrokeAuto);
        return rolled;
      });
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Hydrate from cloud when the user signs in (or changes)
  useEffect(() => {
    if (!userId) {
      cloudHydratedRef.current = false;
      hydratedForUserRef.current = null;
      return;
    }
    if (hydratedForUserRef.current === userId) return;
    hydratedForUserRef.current = userId;
    cloudHydratedRef.current = false;
    setSyncStatus('syncing');

    let cancelled = false;
    (async () => {
      const result = await fetchCloudState(userId);
      if (cancelled) return;
      if (result.kind === 'found') {
        // Pull cloud; run daily-reset on it before adopting
        const { state: rolled, summary } = processDailyReset(ensureMonkMode(result.state));
        setState(rolled);
        if (summary && summary.daysProcessed > 0) setResetSummary(summary);
        if (summary?.monkBrokeAuto) setPendingMonkBreak(summary.monkBrokeAuto);
        cloudHydratedRef.current = true;
        setSyncStatus('idle');
      } else if (result.kind === 'empty') {
        // No cloud row yet — push current local state up. Don't wipe local.
        // (Local state was already initialized from localStorage or makeInitialState().)
        const ok = await upsertCloudState(userId, state);
        if (cancelled) return;
        cloudHydratedRef.current = true;
        setSyncStatus(ok ? 'idle' : 'error');
      } else {
        // Error reading cloud — keep using local state, allow retry on next change.
        // Crucially, do NOT mark cloudHydrated so we don't blindly upsert.
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Debounced cloud sync on state change (only after hydration)
  useEffect(() => {
    if (!userId || !cloudHydratedRef.current) return;
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(async () => {
      setSyncStatus('syncing');
      const ok = await upsertCloudState(userId, state);
      setSyncStatus(ok ? 'idle' : navigator.onLine ? 'error' : 'offline');
    }, 800);
    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [state, userId]);

  const toggle = useCallback((id: QuestId) => {
    setState((prev) => {
      const result = toggleQuest(prev, id);
      if (result.levelUps.length > 0) {
        setPendingLevelUps((ev) => [...ev, ...result.levelUps]);
      }
      return result.state;
    });
  }, []);

  const rename = useCallback((name: string) => {
    setState((prev) => ({ ...prev, hunterName: name.trim() || 'Hunter' }));
  }, []);

  const resetAll = useCallback(() => {
    const fresh = makeInitialState();
    setState(fresh);
    setPendingLevelUps([]);
    setResetSummary(null);
  }, []);

  const importJSON = useCallback((s: HunterState) => {
    setState(s);
  }, []);

  const exportJSON = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const advanceDay = useCallback(() => {
    devOffsetRef.current += 1;
    setState((prev) => {
      // Simulate advancing the date by 1 day by faking the lastOpened
      const fakeNow = new Date();
      fakeNow.setDate(fakeNow.getDate() + devOffsetRef.current);
      const { state: rolled, summary } = processDailyReset(prev, fakeNow);
      if (summary && summary.daysProcessed > 0) setResetSummary(summary);
      if (summary?.monkBrokeAuto) setPendingMonkBreak(summary.monkBrokeAuto);
      return rolled;
    });
  }, []);

  const activateMonkMode = useCallback(() => {
    setState((prev) => activateMonk(prev));
  }, []);

  const toggleMonkCheckIn = useCallback((field: 'noPorn' | 'noFap') => {
    setState((prev) => {
      const current = prev.monkMode.dailyCheckIn?.[field] ?? false;
      return setMonkCheckIn(prev, field, !current);
    });
  }, []);

  const manualBreakMonk = useCallback(() => {
    setState((prev) => {
      const { state: next, snapshot } = breakMonk(prev, 'manual');
      setPendingMonkBreak(snapshot);
      return next;
    });
  }, []);

  const endMonkVoluntarily = useCallback(() => {
    setState((prev) => voluntaryEndMonk(prev));
  }, []);

  const undoMonkBreak = useCallback(() => {
    setPendingMonkBreak((snap) => {
      if (snap) {
        setState((prev) => undoBreakMonk(prev, snap));
      }
      return null;
    });
  }, []);

  const acknowledgeMonkBreak = useCallback(() => {
    setPendingMonkBreak(null);
  }, []);

  const editDay = useCallback(
    (date: string, completed: QuestId[], overrides?: DayEditOverrides) => {
      setState((prev) => {
        const result = editPastDay(prev, date, completed, overrides);
        if (result.levelUps.length > 0) {
          setPendingLevelUps((ev) => [...ev, ...result.levelUps]);
        }
        return result.state;
      });
    },
    [],
  );

  const acknowledgeLevelUp = useCallback(() => {
    setPendingLevelUps((ev) => ev.slice(1));
  }, []);

  const acknowledgeResetSummary = useCallback(() => {
    setResetSummary(null);
  }, []);

  return {
    state,
    toggle,
    rename,
    resetAll,
    importJSON,
    exportJSON,
    advanceDay,
    editDay,
    pendingLevelUps,
    acknowledgeLevelUp,
    resetSummary,
    acknowledgeResetSummary,
    syncStatus,
    activateMonkMode,
    toggleMonkCheckIn,
    manualBreakMonk,
    endMonkVoluntarily,
    undoMonkBreak,
    acknowledgeMonkBreak,
    pendingMonkBreak,
  };
}
