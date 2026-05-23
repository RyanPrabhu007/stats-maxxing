import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { addDays, daysBetween, formatDateLong, todayISO } from '../lib/date';
import type { HunterState, QuestId } from '../types';

interface Props {
  state: HunterState;
  onEditDay?: (date: string) => void;
}

const EDIT_WINDOW_DAYS = 7;

const createdAtKey = (s: HunterState) => s.createdAt;

interface DayCell {
  date: string;
  completed: QuestId[];
  count: number;
  isToday: boolean;
  isFuture: boolean;
  isPreStart: boolean;
}

function colorForCount(
  count: number,
  total: number,
  isFuture: boolean,
  isPreStart: boolean,
): string {
  if (isFuture || isPreStart) return 'transparent';
  if (count === 0) return 'rgba(255, 51, 85, 0.55)';
  if (count <= 2) return 'rgba(255, 120, 0, 0.6)';
  if (count < total) return 'rgba(255, 200, 0, 0.7)';
  return 'rgba(0, 255, 136, 0.85)';
}

export function QuestLog({ state, onEditDay }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const today = todayISO();

  const cells = useMemo<DayCell[]>(() => {
    const start = addDays(today, -29);
    const arr: DayCell[] = [];
    const created = createdAtKey(state);
    for (let i = 0; i < 30; i++) {
      const date = addDays(start, i);
      const isToday = date === today;
      const log = state.history.find((h) => h.date === date);
      const completed: QuestId[] = isToday
        ? [...state.todayCompleted]
        : log
          ? log.completedQuests
          : [];
      arr.push({
        date,
        completed,
        count: completed.length,
        isToday,
        isFuture: date > today,
        isPreStart: date < created,
      });
    }
    return arr;
  }, [state.history, state.todayCompleted, state, today]);

  const totalQuests = state.quests.length;
  const selectedCell = selected ? cells.find((c) => c.date === selected) : null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-accent-cyan/30" />
        <h2 className="font-heading text-text-muted uppercase tracking-[0.4em] text-xs">
          Last 30 Days
        </h2>
        <div className="h-px flex-1 bg-accent-cyan/30" />
      </div>
      <div className="status-window p-4">
        <div className="corner-tr" />
        <div className="corner-bl" />
        <div className="grid grid-cols-10 gap-1.5">
          {cells.map((c) => {
            const inactive = c.isFuture || c.isPreStart;
            const bg = colorForCount(c.count, totalQuests, c.isFuture, c.isPreStart);
            const title = c.isPreStart
              ? `${c.date} — before you started`
              : c.isFuture
                ? c.date
                : `${c.date} — ${c.count}/${totalQuests} quests`;
            return (
              <button
                key={c.date}
                onClick={() => !inactive && setSelected(c.date === selected ? null : c.date)}
                title={title}
                disabled={inactive}
                className={`aspect-square rounded-sm border transition-all relative ${
                  c.isToday ? 'ring-1 ring-accent-cyan' : ''
                } ${selected === c.date ? 'scale-110' : ''}`}
                style={{
                  background: bg,
                  borderColor: inactive
                    ? 'rgba(232,232,240,0.08)'
                    : c.isToday
                      ? 'rgba(0,212,255,0.8)'
                      : 'rgba(232,232,240,0.12)',
                  boxShadow: c.isToday ? '0 0 10px rgba(0,212,255,0.4)' : 'none',
                  cursor: inactive ? 'default' : 'pointer',
                }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] font-heading uppercase tracking-wider text-text-muted">
          <LegendDot color="rgba(0, 255, 136, 0.85)" label="All 5" />
          <LegendDot color="rgba(255, 200, 0, 0.7)" label="3-4" />
          <LegendDot color="rgba(255, 120, 0, 0.6)" label="1-2" />
          <LegendDot color="rgba(255, 51, 85, 0.55)" label="0" />
        </div>

        {selectedCell && (
          <div
            className="mt-3 pt-3 border-t border-accent-cyan/20 text-sm"
            key={selectedCell.date}
          >
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="font-heading uppercase tracking-wider text-text-muted text-xs">
                {formatDateLong(selectedCell.date)}
              </div>
              {onEditDay &&
                !selectedCell.isToday &&
                state.history.some((h) => h.date === selectedCell.date) &&
                daysBetween(selectedCell.date, today) <= EDIT_WINDOW_DAYS && (
                  <button
                    onClick={() => onEditDay(selectedCell.date)}
                    className="btn-ghost flex items-center gap-1"
                    aria-label={`Edit ${selectedCell.date}`}
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                )}
            </div>
            {selectedCell.count === 0 ? (
              <div className="text-danger">No quests completed.</div>
            ) : (
              <ul className="text-text-primary space-y-0.5">
                {selectedCell.completed.map((qid) => {
                  const q = state.quests.find((qq) => qq.id === qid);
                  return (
                    <li key={qid} className="flex items-center gap-2">
                      <span className="text-success">✓</span>
                      <span>{q?.name ?? qid}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
