import { AlertTriangle, Skull } from 'lucide-react';
import { motion } from 'framer-motion';
import { DECAY_START_DAYS } from '../constants';
import { questsAtRisk } from '../lib/hunterLogic';
import type { HunterState } from '../types';

interface Props {
  state: HunterState;
}

export function WarningsPanel({ state }: Props) {
  const atRisk = questsAtRisk(state);
  if (atRisk.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="status-window p-4"
      style={{
        borderColor: 'rgba(255,51,85,0.55)',
        background:
          'linear-gradient(180deg, rgba(40,8,16,0.85), rgba(20,4,8,0.85))',
        boxShadow: '0 0 22px rgba(255,51,85,0.18)',
      }}
    >
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="text-danger animate-pulse" size={18} />
        <h2 className="font-heading uppercase tracking-[0.3em] text-sm text-danger">
          Quests Neglected — Stat Decay Imminent
        </h2>
      </div>
      <div className="space-y-1.5">
        {atRisk.map((q) => {
          const decaying = q.daysSinceLastCompletion >= DECAY_START_DAYS;
          const daysToDecay = Math.max(0, DECAY_START_DAYS - q.daysSinceLastCompletion);
          return (
            <div key={q.id} className="flex items-center gap-2 text-sm">
              {decaying ? (
                <Skull size={14} className="text-danger" />
              ) : (
                <AlertTriangle size={14} className="text-warning" />
              )}
              <span className="font-heading uppercase tracking-wider text-text-primary">
                {q.name}
              </span>
              <span className="text-text-muted">·</span>
              <span className={decaying ? 'text-danger' : 'text-warning'}>
                {q.daysSinceLastCompletion} {q.daysSinceLastCompletion === 1 ? 'day' : 'days'} neglected
              </span>
              <span className="text-text-muted">·</span>
              <span className={decaying ? 'text-danger font-heading' : 'text-text-muted'}>
                {decaying
                  ? `Stat decaying`
                  : `Decay in ${daysToDecay} ${daysToDecay === 1 ? 'day' : 'days'}`}
              </span>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
