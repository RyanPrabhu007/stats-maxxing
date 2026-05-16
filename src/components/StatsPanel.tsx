import { motion } from 'framer-motion';
import { STAT_COLORS, STAT_KEYS, STAT_LABELS } from '../constants';
import type { HunterState, StatKey } from '../types';

interface Props {
  state: HunterState;
}

function StatCard({ statKey, value, change, contributingQuests }: {
  statKey: StatKey;
  value: number;
  change?: 'up' | 'down';
  contributingQuests: { name: string; streak: number }[];
}) {
  const color = STAT_COLORS[statKey];
  const pct = Math.min(100, (value / 100) * 100);
  const valueDisplay = Number.isInteger(value) ? String(value) : value.toFixed(1);

  return (
    <motion.div
      className="status-window p-4 group relative"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="flex items-center justify-between mb-1">
        <div
          className="font-heading text-xs uppercase tracking-[0.2em]"
          style={{ color }}
        >
          {statKey}
        </div>
        {change === 'up' && (
          <span className="text-success text-xs font-heading">+</span>
        )}
        {change === 'down' && (
          <span className="text-danger text-xs font-heading">−</span>
        )}
      </div>
      <div className="text-text-muted text-[10px] font-heading uppercase mb-2">
        {STAT_LABELS[statKey]}
      </div>
      <motion.div
        key={`${statKey}-${valueDisplay}-${change ?? 'none'}`}
        initial={
          change === 'up'
            ? { color: '#00ff88', textShadow: '0 0 18px #00ff88', scale: 1.15 }
            : change === 'down'
              ? { color: '#ff3355', textShadow: '0 0 18px #ff3355', scale: 0.95 }
              : false
        }
        animate={{ color: '#e8e8f0', textShadow: 'none', scale: 1 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
        className="font-display text-3xl md:text-4xl font-bold"
      >
        {valueDisplay}
      </motion.div>
      <div className="mt-2 h-1.5 rounded-full bg-bg-deep overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {contributingQuests.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 w-52 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          <div className="status-window p-3 text-xs">
            <div className="font-heading uppercase tracking-wider text-text-muted mb-1.5">
              Streaks
            </div>
            {contributingQuests.map((q) => (
              <div key={q.name} className="flex justify-between text-text-primary">
                <span className="truncate mr-2">{q.name}</span>
                <span style={{ color }}>{q.streak}d</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function StatsPanel({ state }: Props) {
  const contributing = (statKey: StatKey) =>
    state.quests
      .filter((q) => q.primaryStat === statKey || q.secondaryStat === statKey)
      .map((q) => ({ name: q.name, streak: q.currentStreak }));

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-accent-cyan/30" />
        <h2 className="font-heading text-text-muted uppercase tracking-[0.4em] text-xs">
          Stats
        </h2>
        <div className="h-px flex-1 bg-accent-cyan/30" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_KEYS.map((k) => (
          <StatCard
            key={k}
            statKey={k}
            value={state.stats[k]}
            change={state.statChangesToday[k]}
            contributingQuests={contributing(k)}
          />
        ))}
      </div>
    </section>
  );
}
