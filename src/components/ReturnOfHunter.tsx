import { AnimatePresence, motion } from 'framer-motion';
import { Skull, X } from 'lucide-react';
import { STAT_LABELS } from '../constants';
import type { DailyResetSummary } from '../lib/hunterLogic';
import type { StatKey } from '../types';

interface Props {
  summary: DailyResetSummary | null;
  onDismiss: () => void;
}

export function ReturnOfHunter({ summary, onDismiss }: Props) {
  if (!summary) return null;
  const lostStats = Object.entries(summary.decayedStats).filter(([, v]) => (v ?? 0) > 0);
  const totalLost = lostStats.reduce((acc, [, v]) => acc + (v as number), 0) + summary.disciplineDecay;
  const dramatic = summary.daysProcessed > 1 && totalLost > 0;

  return (
    <AnimatePresence>
      {summary && (
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="status-window p-4 relative"
          style={
            dramatic
              ? {
                  borderColor: 'rgba(255,51,85,0.6)',
                  background:
                    'linear-gradient(180deg, rgba(40,8,16,0.85), rgba(20,4,8,0.85))',
                  boxShadow: '0 0 30px rgba(255,51,85,0.25)',
                }
              : {}
          }
        >
          <div className="corner-tr" />
          <div className="corner-bl" />
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 text-text-muted hover:text-text-primary"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            {dramatic && <Skull className="text-danger" size={18} />}
            <h3
              className={`font-heading uppercase tracking-[0.3em] text-sm ${
                dramatic ? 'text-danger' : 'text-accent-cyan'
              }`}
            >
              {dramatic ? 'Return of the Hunter' : 'A New Day'}
            </h3>
          </div>
          <p className="text-sm text-text-primary">
            {summary.daysProcessed === 1
              ? 'A new day has begun. Your slate is clear.'
              : `${summary.daysProcessed} days have passed since you last opened the system.`}
          </p>
          {totalLost > 0 && (
            <div className="mt-2 text-sm">
              <div className="text-text-muted font-heading uppercase tracking-wider text-xs mb-1">
                Damage Taken
              </div>
              <ul className="space-y-0.5">
                {lostStats.map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-text-primary">{STAT_LABELS[k as StatKey]}</span>
                    <span className="text-danger font-heading">−{v}</span>
                  </li>
                ))}
                {summary.disciplineDecay > 0 && !lostStats.find(([k]) => k === 'DIS') && (
                  <li className="flex justify-between">
                    <span className="text-text-primary">{STAT_LABELS.DIS}</span>
                    <span className="text-danger font-heading">−{summary.disciplineDecay}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
