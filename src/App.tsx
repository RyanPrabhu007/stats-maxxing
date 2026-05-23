import { useCallback, useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { useHunterState } from './hooks/useHunterState';
import { useAuth } from './hooks/useAuth';
import { StatusWindow } from './components/StatusWindow';
import { StatsPanel } from './components/StatsPanel';
import { QuestsPanel } from './components/QuestsPanel';
import { WarningsPanel } from './components/WarningsPanel';
import { LevelUpOverlay } from './components/LevelUpOverlay';
import { StatHistory } from './components/StatHistory';
import { QuestLog } from './components/QuestLog';
import { DayEditModal } from './components/DayEditModal';
import { SettingsModal } from './components/SettingsModal';
import { ReturnOfHunter } from './components/ReturnOfHunter';
import { AuthGate } from './components/AuthGate';
import {
  MonkActivationFx,
  MonkActivationModal,
  MonkBreakModal,
  MonkDashboard,
  MonkModeButton,
} from './components/MonkMode';
import {
  isMuted,
  playLevelUp,
  playMonkActivate,
  playMonkBreak,
  playQuestComplete,
  playRankUp,
  setMuted,
} from './lib/sounds';

export default function App() {
  const auth = useAuth();
  const api = useHunterState(auth.user?.id ?? null);
  const {
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
  } = api;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [monkActivationOpen, setMonkActivationOpen] = useState(false);
  const [monkDashboardOpen, setMonkDashboardOpen] = useState(false);
  const [monkFxTrigger, setMonkFxTrigger] = useState(0);
  const [muted, setMutedState] = useState(isMuted());
  const monkPrevActiveRef = useRef(state.monkMode.active);

  const onToggleMute = useCallback(() => {
    setMutedState((m) => {
      const next = !m;
      setMuted(next);
      return next;
    });
  }, []);

  // Wire sound effects to events
  const currentEvent = pendingLevelUps[0] ?? null;
  useEffect(() => {
    if (!currentEvent) return;
    if (currentEvent.rankUp) playRankUp();
    else playLevelUp();
  }, [currentEvent]);

  // Play quest-complete sound when todayCompleted grows
  const completedCount = state.todayCompleted.length;
  useEffect(() => {
    if (completedCount === 0) return;
    playQuestComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedCount]);

  // Dev shortcut: Ctrl+Shift+D advances one day
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        advanceDay();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advanceDay]);

  // Apply monk theme to document root
  useEffect(() => {
    const el = document.documentElement;
    if (state.monkMode.active) el.setAttribute('data-theme', 'monk');
    else el.removeAttribute('data-theme');
  }, [state.monkMode.active]);

  // Fire flash + sound on activation transitions (off -> on)
  useEffect(() => {
    const prev = monkPrevActiveRef.current;
    monkPrevActiveRef.current = state.monkMode.active;
    if (!prev && state.monkMode.active) {
      setMonkFxTrigger((n) => n + 1);
      playMonkActivate();
    }
  }, [state.monkMode.active]);

  // Sound on monk break (manual or auto)
  useEffect(() => {
    if (pendingMonkBreak) playMonkBreak();
  }, [pendingMonkBreak]);

  const handleMonkButtonClick = () => {
    if (state.monkMode.active) setMonkDashboardOpen(true);
    else setMonkActivationOpen(true);
  };

  const handleMonkActivate = () => {
    activateMonkMode();
    setMonkActivationOpen(false);
  };

  if (auth.loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="font-display text-xs tracking-[0.4em] text-text-muted">
          INITIALIZING…
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return <AuthGate auth={auth} />;
  }

  const handleSignOut = async () => {
    setSettingsOpen(false);
    await auth.signOut();
  };

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-3xl mx-auto p-3 sm:p-5 md:p-6 space-y-5 md:space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="font-display text-sm tracking-[0.4em] text-text-muted">
            STATS·MAXXING
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="btn-ghost flex items-center gap-2"
            aria-label="Open settings"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>

        <StatusWindow state={state} onRename={rename} />

        <ReturnOfHunter summary={resetSummary} onDismiss={acknowledgeResetSummary} />

        <WarningsPanel state={state} />

        <StatsPanel state={state} />

        <QuestsPanel state={state} onToggle={toggle} />

        <StatHistory state={state} />

        <QuestLog state={state} onEditDay={setEditingDate} />

        <footer className="text-center text-text-dim text-[10px] font-heading uppercase tracking-[0.4em] py-4">
          Arise.
        </footer>
      </div>

      <LevelUpOverlay event={currentEvent} onAcknowledge={acknowledgeLevelUp} />

      <DayEditModal
        open={editingDate !== null}
        onClose={() => setEditingDate(null)}
        state={state}
        date={editingDate}
        onSave={editDay}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        exportJSON={exportJSON}
        importJSON={importJSON}
        resetAll={resetAll}
        muted={muted}
        onToggleMute={onToggleMute}
        onAdvanceDay={advanceDay}
        userEmail={auth.user.email ?? null}
        onSignOut={handleSignOut}
        syncStatus={syncStatus}
      />

      <MonkModeButton
        active={state.monkMode.active}
        streakDays={state.monkMode.streakDays}
        onClick={handleMonkButtonClick}
      />

      <MonkActivationModal
        open={monkActivationOpen}
        onCancel={() => setMonkActivationOpen(false)}
        onActivate={handleMonkActivate}
      />

      <MonkActivationFx trigger={monkFxTrigger} />

      <MonkDashboard
        open={monkDashboardOpen}
        onClose={() => setMonkDashboardOpen(false)}
        state={state}
        onToggleCheckIn={toggleMonkCheckIn}
        onManualBreak={manualBreakMonk}
        onVoluntaryEnd={endMonkVoluntarily}
      />

      <MonkBreakModal
        snapshot={pendingMonkBreak}
        onUndo={undoMonkBreak}
        onAcknowledge={acknowledgeMonkBreak}
      />
    </div>
  );
}
