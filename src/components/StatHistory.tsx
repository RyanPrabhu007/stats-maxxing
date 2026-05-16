import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { STAT_COLORS, STAT_KEYS, STAT_LABELS } from '../constants';
import { formatDateShort } from '../lib/date';
import type { HunterState, StatKey } from '../types';

interface Props {
  state: HunterState;
}

type Mode = 'ALL' | StatKey;

export function StatHistory({ state }: Props) {
  const [mode, setMode] = useState<Mode>('ALL');

  const data = useMemo(() => {
    const rows = state.history
      .filter((h) => h.statsSnapshot)
      .map((h) => ({
        date: formatDateShort(h.date),
        STR: h.statsSnapshot!.STR,
        VIT: h.statsSnapshot!.VIT,
        GER: h.statsSnapshot!.GER,
        WIS: h.statsSnapshot!.WIS,
        DIS: h.statsSnapshot!.DIS,
      }));
    // Append today as the live final point
    rows.push({
      date: 'Today',
      STR: state.stats.STR,
      VIT: state.stats.VIT,
      GER: state.stats.GER,
      WIS: state.stats.WIS,
      DIS: state.stats.DIS,
    });
    return rows;
  }, [state.history, state.stats]);

  if (data.length < 2) {
    return (
      <section>
        <SectionHeader />
        <div className="status-window p-6 text-center text-text-muted text-sm">
          <div className="corner-tr" />
          <div className="corner-bl" />
          Your stat history begins after your first day rolls over.
        </div>
      </section>
    );
  }

  const visible: StatKey[] = mode === 'ALL' ? STAT_KEYS : [mode];

  return (
    <section>
      <SectionHeader />
      <div className="status-window p-3 md:p-4">
        <div className="corner-tr" />
        <div className="corner-bl" />
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => setMode('ALL')}
            className={`btn-ghost text-[10px] ${mode === 'ALL' ? 'border-accent-cyan text-accent-cyan' : ''}`}
          >
            All
          </button>
          {STAT_KEYS.map((k) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={`btn-ghost text-[10px] ${mode === k ? '!border-current' : ''}`}
              style={mode === k ? { color: STAT_COLORS[k], borderColor: STAT_COLORS[k] } : {}}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="h-56 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="rgba(0,212,255,0.08)" />
              <XAxis dataKey="date" tick={{ fill: '#8b94a8', fontSize: 11 }} stroke="rgba(0,212,255,0.2)" />
              <YAxis tick={{ fill: '#8b94a8', fontSize: 11 }} stroke="rgba(0,212,255,0.2)" />
              <Tooltip
                contentStyle={{
                  background: '#0f1119',
                  border: '1px solid rgba(0,212,255,0.45)',
                  borderRadius: 4,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#e8e8f0' }}
                itemStyle={{ color: '#e8e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8b94a8' }} />
              {visible.map((k) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={STAT_LABELS[k]}
                  stroke={STAT_COLORS[k]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, stroke: STAT_COLORS[k], strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px flex-1 bg-accent-cyan/30" />
      <h2 className="font-heading text-text-muted uppercase tracking-[0.4em] text-xs">
        Stat History
      </h2>
      <div className="h-px flex-1 bg-accent-cyan/30" />
    </div>
  );
}
