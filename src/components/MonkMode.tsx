import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, X, Award, RotateCcw } from 'lucide-react';
import {
  MONK_BREAK_UNDO_WINDOW_MS,
  MONK_MULTIPLIER_TIER_1,
  MONK_MULTIPLIER_TIER_1_DAYS,
  MONK_MULTIPLIER_TIER_2,
  MONK_MULTIPLIER_TIER_2_DAYS,
  monkMultiplier,
} from '../constants';
import type { MonkBreakSnapshot } from '../lib/monkLogic';
import type { HunterState } from '../types';

// =========================================================================
// Floating button (bottom-right)
// =========================================================================

interface ButtonProps {
  active: boolean;
  streakDays: number;
  onClick: () => void;
}

export function MonkModeButton({ active, streakDays, onClick }: ButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full flex flex-col items-center justify-center transition-colors ${
        active
          ? 'bg-gradient-to-b from-red-600 to-red-900 border-2 border-orange-400 text-orange-100 monk-pulse'
          : 'bg-bg-deep border border-text-muted/40 text-text-muted hover:text-text-primary hover:border-text-primary/60'
      }`}
      aria-label={active ? 'Open Monk Mode dashboard' : 'Activate Monk Mode'}
      title={active ? `Monk Mode — Day ${streakDays}` : 'Monk Mode'}
    >
      <Flame size={22} />
      {active && streakDays > 0 && (
        <span className="font-display text-[10px] leading-none mt-0.5">
          {streakDays}d
        </span>
      )}
    </motion.button>
  );
}

// =========================================================================
// Activation modal — "Enter Monk Mode?"
// =========================================================================

interface ActivationProps {
  open: boolean;
  onCancel: () => void;
  onActivate: () => void;
}

export function MonkActivationModal({ open, onCancel, onActivate }: ActivationProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 16, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="status-window w-full max-w-md p-6"
            style={{ borderColor: 'rgba(255, 59, 31, 0.6)' }}
          >
            <div className="corner-tr" />
            <div className="corner-bl" />
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base uppercase tracking-[0.3em] text-red-400">
                Enter Monk Mode?
              </h2>
              <button onClick={onCancel} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <div className="text-sm space-y-3 text-text-primary/90 mb-5">
              <p>
                A self-imposed discipline challenge:{' '}
                <span className="text-red-400 font-heading uppercase">no porn, no fap</span>.
              </p>
              <ul className="text-xs space-y-1.5 pl-4 list-disc text-text-muted">
                <li>Check in daily to keep the streak alive.</li>
                <li>Miss a day &rarr; streak breaks automatically at midnight.</li>
                <li>
                  <span className="text-warning">7-day milestone:</span> 1.5x XP on all quests + 1 DIS.
                </li>
                <li>
                  <span className="text-warning">14-day milestone:</span> 2x XP on all quests.
                </li>
                <li>
                  <span className="text-danger">Breaking</span> costs you{' '}
                  <span className="text-danger font-heading">−1 Hunter Level</span> and resets XP to 0.
                </li>
              </ul>
              <p className="text-xs text-text-muted italic">
                High risk. High reward. Choose wisely.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onActivate}
                className="flex-1 px-4 py-2 font-heading uppercase tracking-wider text-sm rounded text-red-100 border border-red-500/70 bg-gradient-to-b from-red-600/40 to-red-800/30 hover:from-red-500/60 hover:to-red-700/50 hover:shadow-[0_0_18px_rgba(255,59,31,0.6)] transition-all"
              >
                Activate
              </button>
              <button onClick={onCancel} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =========================================================================
// Activation flash overlay (1.5s) + top banner (3s fade)
// =========================================================================

interface ActivationFxProps {
  trigger: number; // increment to fire
}

export function MonkActivationFx({ trigger }: ActivationFxProps) {
  const [showFlash, setShowFlash] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setShowFlash(true);
    setShowBanner(true);
    const t1 = window.setTimeout(() => setShowFlash(false), 1500);
    const t2 = window.setTimeout(() => setShowBanner(false), 3000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [trigger]);

  return (
    <>
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, times: [0, 0.15, 0.5, 1] }}
            className="fixed inset-0 z-50 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255,90,0,0.7), rgba(180,30,0,0.5) 50%, rgba(20,0,0,0.2) 100%)',
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 py-3 text-center pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,59,31,0.95), rgba(120,20,0,0.85))',
              boxShadow: '0 8px 24px rgba(255,59,31,0.4)',
            }}
          >
            <div className="font-display text-base md:text-xl uppercase tracking-[0.4em] text-red-50 drop-shadow">
              ⚔ MONK MODE ACTIVATED ⚔
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// =========================================================================
// Dashboard modal — streak, checklist, multiplier badge, break button, badges
// =========================================================================

interface DashboardProps {
  open: boolean;
  onClose: () => void;
  state: HunterState;
  onToggleCheckIn: (field: 'noPorn' | 'noFap') => void;
  onManualBreak: () => void;
  onVoluntaryEnd: () => void;
}

export function MonkDashboard({
  open,
  onClose,
  state,
  onToggleCheckIn,
  onManualBreak,
  onVoluntaryEnd,
}: DashboardProps) {
  const [confirmBreak, setConfirmBreak] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmBreak(false);
      setConfirmEnd(false);
    }
  }, [open]);

  const monk = state.monkMode;
  const streak = monk.streakDays;
  const multiplier = monkMultiplier(streak);
  const checkIn = monk.dailyCheckIn;
  const bothChecked = !!(checkIn && checkIn.noPorn && checkIn.noFap);

  // Progress toward next tier
  const nextTier =
    streak < MONK_MULTIPLIER_TIER_1_DAYS
      ? { target: MONK_MULTIPLIER_TIER_1_DAYS, mult: MONK_MULTIPLIER_TIER_1 }
      : streak < MONK_MULTIPLIER_TIER_2_DAYS
        ? { target: MONK_MULTIPLIER_TIER_2_DAYS, mult: MONK_MULTIPLIER_TIER_2 }
        : null;
  const tierStart =
    streak < MONK_MULTIPLIER_TIER_1_DAYS
      ? 0
      : streak < MONK_MULTIPLIER_TIER_2_DAYS
        ? MONK_MULTIPLIER_TIER_1_DAYS
        : MONK_MULTIPLIER_TIER_2_DAYS;
  const progress = nextTier
    ? ((streak - tierStart) / (nextTier.target - tierStart)) * 100
    : 100;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="status-window w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'rgba(255, 59, 31, 0.6)' }}
          >
            <div className="corner-tr" />
            <div className="corner-bl" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm uppercase tracking-[0.3em] text-red-400">
                Monk Mode
              </h2>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {/* Streak hero */}
            <div className="text-center py-3">
              <div
                className="font-display font-bold leading-none"
                style={{
                  fontSize: 'clamp(3rem, 12vw, 6rem)',
                  background: 'linear-gradient(180deg, #ffb060, #ff3b1f)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(255, 59, 31, 0.5)',
                }}
              >
                DAY {streak}
              </div>
              <div className="font-heading uppercase tracking-[0.3em] text-xs text-orange-300/80 mt-1">
                {streak === 0 ? 'Streak begins tomorrow' : 'Days clean'}
              </div>

              {/* Multiplier progress bar */}
              <div className="mt-4">
                {nextTier ? (
                  <>
                    <div className="flex justify-between text-[10px] font-heading uppercase tracking-wider text-text-muted mb-1">
                      <span>{multiplier.toFixed(1)}x XP</span>
                      <span>
                        {nextTier.target - streak}d to {nextTier.mult.toFixed(1)}x
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-deep border border-red-500/30 overflow-hidden">
                      <motion.div
                        className="h-full"
                        style={{
                          background:
                            'linear-gradient(90deg, #ff7a1a, #ff3b1f)',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, progress)}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-xs font-heading uppercase tracking-wider text-orange-300">
                    Max tier reached
                  </div>
                )}
              </div>

              {/* Active multiplier badge */}
              <div className="mt-4 inline-block">
                <span
                  className="px-4 py-1.5 font-display text-base rounded border-2"
                  style={{
                    color: multiplier > 1 ? '#ff3b1f' : '#8b94a8',
                    borderColor:
                      multiplier > 1 ? 'rgba(255,59,31,0.7)' : 'rgba(139,148,168,0.3)',
                    boxShadow:
                      multiplier > 1
                        ? '0 0 16px rgba(255,59,31,0.5)'
                        : 'none',
                  }}
                >
                  {multiplier.toFixed(1)}x XP {multiplier > 1 ? 'ACTIVE' : ''}
                </span>
              </div>
            </div>

            {/* Daily checklist */}
            <div className="mt-5 pt-4 border-t border-red-500/20">
              <div className="font-heading uppercase tracking-wider text-xs text-text-muted mb-2">
                Today's check-in
              </div>
              <div className="space-y-2">
                <CheckRow
                  label="No porn"
                  checked={!!checkIn?.noPorn}
                  onToggle={() => onToggleCheckIn('noPorn')}
                />
                <CheckRow
                  label="No fap"
                  checked={!!checkIn?.noFap}
                  onToggle={() => onToggleCheckIn('noFap')}
                />
              </div>
              {bothChecked ? (
                <div className="text-[11px] mt-2 text-success">
                  ✓ Locked in. Streak will increment at midnight.
                </div>
              ) : (
                <div className="text-[11px] mt-2 text-warning">
                  Both must be checked by midnight or the streak auto-breaks.
                </div>
              )}
            </div>

            {/* Badges */}
            {monk.badges.length > 0 && (
              <div className="mt-5 pt-4 border-t border-red-500/20">
                <div className="font-heading uppercase tracking-wider text-xs text-text-muted mb-2">
                  Badges
                </div>
                <div className="flex flex-wrap gap-2">
                  {monk.badges.map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-heading uppercase tracking-wider rounded border border-orange-400/60 text-orange-300 bg-orange-500/10"
                      title={`Earned ${b.earnedAt}`}
                    >
                      <Award size={12} />
                      {b.streakLength}d
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-2">
              {!confirmBreak && !confirmEnd && (
                <>
                  <button
                    onClick={() => setConfirmBreak(true)}
                    className="w-full px-4 py-2 font-heading uppercase tracking-wider text-sm rounded text-red-200 border border-red-500/70 bg-red-900/20 hover:bg-red-900/40 transition-colors"
                  >
                    I broke it
                  </button>
                  <button
                    onClick={() => setConfirmEnd(true)}
                    className="w-full btn-ghost"
                  >
                    End voluntarily (no penalty)
                  </button>
                </>
              )}

              {confirmBreak && (
                <div className="p-3 border border-red-500/50 rounded bg-red-900/10">
                  <div className="text-sm text-red-200 mb-2">
                    Reset the streak ({streak}d) and lose 1 Hunter Level?
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onManualBreak();
                        setConfirmBreak(false);
                        onClose();
                      }}
                      className="btn-danger flex-1"
                    >
                      Confirm break
                    </button>
                    <button onClick={() => setConfirmBreak(false)} className="btn-ghost flex-1">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {confirmEnd && (
                <div className="p-3 border border-text-muted/40 rounded">
                  <div className="text-sm text-text-primary mb-2">
                    End the run cleanly? You'll keep your level and earn a badge if streak ≥ 7d.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onVoluntaryEnd();
                        setConfirmEnd(false);
                        onClose();
                      }}
                      className="btn-primary flex-1"
                    >
                      End run
                    </button>
                    <button onClick={() => setConfirmEnd(false)} className="btn-ghost flex-1">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-2.5 rounded border text-left transition-colors ${
        checked
          ? 'border-success/60 bg-success/10'
          : 'border-red-500/30 bg-bg-deep hover:border-red-400/60'
      }`}
    >
      <span
        className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs ${
          checked
            ? 'border-success bg-success/30 text-success'
            : 'border-text-muted/60 text-transparent'
        }`}
      >
        ✓
      </span>
      <span
        className={`font-heading uppercase tracking-wider text-sm ${
          checked ? 'text-success' : 'text-text-primary'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

// =========================================================================
// Break modal — somber "The streak is broken" + 30s undo toast
// =========================================================================

interface BreakModalProps {
  snapshot: MonkBreakSnapshot | null;
  onUndo: () => void;
  onAcknowledge: () => void;
}

export function MonkBreakModal({ snapshot, onUndo, onAcknowledge }: BreakModalProps) {
  const [timeLeft, setTimeLeft] = useState(MONK_BREAK_UNDO_WINDOW_MS);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!snapshot) return;
    startedAtRef.current = Date.now();
    setTimeLeft(MONK_BREAK_UNDO_WINDOW_MS);
    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const remaining = Math.max(0, MONK_BREAK_UNDO_WINDOW_MS - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(id);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [snapshot]);

  if (!snapshot) return null;
  const undoAvailable = timeLeft > 0;
  const secondsLeft = Math.ceil(timeLeft / 1000);

  return (
    <AnimatePresence>
      {snapshot && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="status-window w-full max-w-md p-6 text-center"
            style={{ borderColor: 'rgba(139, 148, 168, 0.4)' }}
          >
            <div className="corner-tr" />
            <div className="corner-bl" />
            <Flame
              size={56}
              className="mx-auto mb-3 text-text-muted/60"
              style={{ filter: 'grayscale(0.5)' }}
            />
            <div className="font-display text-lg uppercase tracking-[0.3em] text-text-muted">
              The streak is broken
            </div>
            <div className="mt-3 text-sm text-text-primary/80">
              {snapshot.reason === 'auto'
                ? 'No check-in by midnight.'
                : 'You marked it broken.'}
              <br />
              {snapshot.brokenStreakLength}-day streak ended.
            </div>
            <div className="mt-3 font-display text-danger text-base tracking-wider">
              − 1 Level
            </div>

            <div className="mt-6 space-y-2">
              {undoAvailable && (
                <button
                  onClick={onUndo}
                  className="w-full px-4 py-2 font-heading uppercase tracking-wider text-sm rounded text-orange-200 border border-orange-400/70 bg-orange-500/10 hover:bg-orange-500/20 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} />
                  Undo ({secondsLeft}s)
                </button>
              )}
              <button onClick={onAcknowledge} className="btn-ghost w-full">
                {undoAvailable ? 'Accept the penalty' : 'Continue'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
