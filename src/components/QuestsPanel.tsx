import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, BookOpen, Languages, Dumbbell, GraduationCap, Brain } from 'lucide-react';
import type { ComponentType } from 'react';
import { STAT_COLORS } from '../constants';
import { formatDateLong } from '../lib/date';
import type { HunterState, Quest, QuestId, StatKey } from '../types';

interface Props {
  state: HunterState;
  onToggle: (id: QuestId) => void;
}

const QUEST_ICONS: Record<QuestId, ComponentType<{ size?: number; className?: string }>> = {
  duolingo: Languages,
  vocab: BookOpen,
  fmva: Brain,
  german_class: GraduationCap,
  gym: Dumbbell,
};

function StatPill({ statKey }: { statKey: StatKey }) {
  return (
    <span
      className="px-1.5 py-0.5 text-[10px] font-heading uppercase tracking-wider rounded"
      style={{
        color: STAT_COLORS[statKey],
        background: `${STAT_COLORS[statKey]}1a`,
        border: `1px solid ${STAT_COLORS[statKey]}55`,
      }}
    >
      {statKey}
    </span>
  );
}

function QuestCard({
  quest,
  completed,
  onToggle,
}: {
  quest: Quest;
  completed: boolean;
  onToggle: () => void;
}) {
  const Icon = QUEST_ICONS[quest.id];
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.97 }}
      animate={
        completed
          ? { boxShadow: '0 0 22px rgba(0,255,136,0.45)' }
          : { boxShadow: '0 0 0 rgba(0,0,0,0)' }
      }
      transition={{ duration: 0.3 }}
      className={`status-window w-full text-left p-4 transition-colors ${
        completed ? 'bg-success/5' : 'hover:bg-accent-cyan/5'
      }`}
      style={completed ? { borderColor: 'rgba(0,255,136,0.5)' } : {}}
    >
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="flex items-center gap-4">
        <div
          className={`shrink-0 flex items-center justify-center w-11 h-11 rounded border transition-colors ${
            completed
              ? 'bg-success/20 border-success text-success'
              : 'bg-bg-deep border-accent-cyan/40 text-accent-cyan'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {completed ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.25 }}
              >
                <Check size={22} />
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
              >
                <Icon size={22} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-heading text-base md:text-lg uppercase tracking-wider truncate ${
                completed ? 'text-success' : 'text-text-primary'
              }`}
            >
              {quest.name}
            </h3>
            <StatPill statKey={quest.primaryStat} />
            {quest.secondaryStat && <StatPill statKey={quest.secondaryStat} />}
          </div>
          <div className="text-xs text-text-muted mt-0.5 truncate">{quest.description}</div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-display text-accent-cyan text-sm md:text-base">
            +{quest.xpReward} <span className="text-[10px] text-text-muted">XP</span>
          </div>
          {quest.currentStreak > 0 && (
            <div className="flex items-center justify-end gap-1 text-xs mt-1 text-warning">
              <Flame size={12} />
              <span className="font-heading">{quest.currentStreak}d</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export function QuestsPanel({ state, onToggle }: Props) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-accent-cyan/30" />
        <h2 className="font-heading text-text-muted uppercase tracking-[0.3em] text-xs text-center">
          Daily Quests — {formatDateLong(state.todayDate)}
        </h2>
        <div className="h-px flex-1 bg-accent-cyan/30" />
      </div>
      <div className="grid gap-3">
        {state.quests.map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            completed={state.todayCompleted.includes(q.id)}
            onToggle={() => onToggle(q.id)}
          />
        ))}
      </div>
    </section>
  );
}
