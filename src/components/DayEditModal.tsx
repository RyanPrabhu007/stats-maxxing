import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { STAT_COLORS, STAT_KEYS, STAT_LABELS } from '../constants';
import { formatDateLong } from '../lib/date';
import type { DayEditOverrides } from '../lib/hunterLogic';
import type { HunterState, QuestId, StatKey, Stats } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  state: HunterState;
  date: string | null;
  onSave: (date: string, completed: QuestId[], overrides?: DayEditOverrides) => void;
}

export function DayEditModal({ open, onClose, state, date, onSave }: Props) {
  const dayEntry = useMemo(
    () => (date ? state.history.find((h) => h.date === date) : null),
    [state.history, date],
  );

  const [completed, setCompleted] = useState<Set<QuestId>>(new Set());
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [xpText, setXpText] = useState<string>('');
  const [statTexts, setStatTexts] = useState<Record<StatKey, string>>({
    STR: '',
    VIT: '',
    GER: '',
    WIS: '',
    DIS: '',
  });

  // Reset form whenever a different day opens
  useEffect(() => {
    if (!open || !dayEntry) return;
    setCompleted(new Set(dayEntry.completedQuests));
    setAdvancedOpen(false);
    setXpText(String(state.xp));
    setStatTexts({
      STR: String(state.stats.STR),
      VIT: String(state.stats.VIT),
      GER: String(state.stats.GER),
      WIS: String(state.stats.WIS),
      DIS: String(state.stats.DIS),
    });
  }, [open, dayEntry, state.xp, state.stats]);

  if (!date || !dayEntry) return null;

  const toggleQuestId = (id: QuestId) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    const newCompleted = state.quests
      .map((q) => q.id)
      .filter((id) => completed.has(id));

    const overrides: DayEditOverrides = {};
    const xpVal = Number(xpText);
    if (!Number.isNaN(xpVal) && xpVal !== state.xp && xpVal >= 0) {
      overrides.xp = xpVal;
    }
    const statOverrides: Partial<Stats> = {};
    let anyStat = false;
    for (const k of STAT_KEYS) {
      const v = Number(statTexts[k]);
      if (!Number.isNaN(v) && v !== state.stats[k] && v >= 1) {
        statOverrides[k] = v;
        anyStat = true;
      }
    }
    if (anyStat) overrides.stats = statOverrides;

    onSave(date, newCompleted, Object.keys(overrides).length ? overrides : undefined);
    onClose();
  };

  const totalQuests = state.quests.length;
  const completedCount = completed.size;
  const willBePerfect = completedCount === totalQuests;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="status-window w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="corner-tr" />
            <div className="corner-bl" />
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-heading text-accent-cyan uppercase tracking-[0.3em] text-sm">
                Edit Day
              </h2>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <div className="text-xs text-text-muted mb-4">{formatDateLong(date)}</div>

            <div className="space-y-2">
              {state.quests.map((q) => {
                const isOn = completed.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggleQuestId(q.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded border transition-colors text-left ${
                      isOn
                        ? 'bg-success/10 border-success/60'
                        : 'bg-bg-deep border-accent-cyan/20 hover:border-accent-cyan/50'
                    }`}
                  >
                    <span
                      className={`shrink-0 flex items-center justify-center w-7 h-7 rounded border ${
                        isOn
                          ? 'bg-success/20 border-success text-success'
                          : 'border-accent-cyan/40 text-text-muted'
                      }`}
                    >
                      {isOn && <Check size={16} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-heading text-sm uppercase tracking-wider truncate ${
                          isOn ? 'text-success' : 'text-text-primary'
                        }`}
                      >
                        {q.name}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        +{q.xpReward} XP · {q.primaryStat}
                        {q.secondaryStat ? ` / ${q.secondaryStat}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-[11px] text-text-muted">
              {completedCount}/{totalQuests} quests
              {willBePerfect && <span className="text-success"> · Perfect day bonus applies</span>}
            </div>

            <div className="mt-4 border-t border-accent-cyan/20 pt-3">
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-heading uppercase tracking-wider text-text-muted hover:text-text-primary"
              >
                <span>Advanced — override XP & stats</span>
                {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {advancedOpen && (
                <div className="mt-3 space-y-2">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">
                    Sets absolute values for current XP / stats. Leave unchanged to skip.
                  </div>
                  <NumberRow
                    label="XP"
                    value={xpText}
                    onChange={setXpText}
                    color="#00d4ff"
                  />
                  {STAT_KEYS.map((k) => (
                    <NumberRow
                      key={k}
                      label={`${k} — ${STAT_LABELS[k]}`}
                      value={statTexts[k]}
                      onChange={(v) => setStatTexts((prev) => ({ ...prev, [k]: v }))}
                      color={STAT_COLORS[k]}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={handleSave} className="btn-primary flex-1">
                Save
              </button>
              <button onClick={onClose} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NumberRow({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className="text-[11px] font-heading uppercase tracking-wider"
        style={{ color }}
      >
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={0}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 bg-bg-deep border border-accent-cyan/30 rounded px-2 py-1 text-sm text-text-primary text-right focus:outline-none focus:border-accent-cyan"
      />
    </div>
  );
}
