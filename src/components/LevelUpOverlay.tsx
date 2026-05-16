import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { RANK_TIERS, getRankForLevel } from '../constants';
import type { LevelUpEvent } from '../lib/hunterLogic';

interface Props {
  event: LevelUpEvent | null;
  onAcknowledge: () => void;
}

export function LevelUpOverlay({ event, onAcknowledge }: Props) {
  useEffect(() => {
    if (!event) return;
    const t = window.setTimeout(onAcknowledge, event.rankUp ? 3200 : 2000);
    return () => window.clearTimeout(t);
  }, [event, onAcknowledge]);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.newLevel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onAcknowledge}
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,212,255,0.35) 0%, rgba(10,10,15,0.92) 60%)',
          }}
        >
          {event.rankUp ? (
            <RankUpContent level={event.newLevel} />
          ) : (
            <LevelUpContent level={event.newLevel} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LevelUpContent({ level }: { level: number }) {
  return (
    <motion.div
      initial={{ scale: 0.6, y: 30 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 1.1, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'backOut' }}
      className="text-center"
    >
      <motion.div
        animate={{ x: [0, -6, 6, -4, 4, 0] }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="font-heading uppercase tracking-[0.5em] text-accent-cyan text-sm md:text-base">
          [ System Notification ]
        </div>
        <div
          className="font-display font-black text-6xl md:text-8xl mt-3 text-text-primary"
          style={{
            textShadow:
              '0 0 30px #00d4ff, 0 0 60px #00d4ff, 0 0 100px rgba(0,212,255,0.5)',
          }}
        >
          LEVEL UP
        </div>
        <div className="font-display text-4xl md:text-5xl text-accent-cyan mt-3">
          Lv. {level}
        </div>
        <div className="text-text-muted font-heading uppercase tracking-widest mt-3 text-sm">
          All stats +1
        </div>
      </motion.div>
    </motion.div>
  );
}

function RankUpContent({ level }: { level: number }) {
  const rank = getRankForLevel(level);
  return (
    <motion.div
      initial={{ scale: 0.3, rotateX: 90 }}
      animate={{ scale: 1, rotateX: 0 }}
      exit={{ scale: 1.4, opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        <div className="font-heading uppercase tracking-[0.6em] text-text-muted text-sm">
          [ Awakening ]
        </div>
        <div
          className="font-display font-black text-7xl md:text-9xl mt-4"
          style={{
            color: rank.color,
            textShadow: `0 0 40px ${rank.color}, 0 0 80px ${rank.color}, 0 0 120px ${rank.color}80`,
          }}
        >
          RANK UP
        </div>
        <div
          className="font-display text-4xl md:text-6xl mt-4 tracking-widest"
          style={{ color: rank.color, textShadow: `0 0 24px ${rank.color}` }}
        >
          {rank.name.toUpperCase()}
        </div>
        <div className="text-text-muted font-heading uppercase tracking-widest mt-4">
          Lv. {level} — Tier {RANK_TIERS.indexOf(rank) + 1} of {RANK_TIERS.length}
        </div>
      </motion.div>
    </motion.div>
  );
}
