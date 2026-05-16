import { useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { getRankForLevel, xpToNextLevel } from '../constants';
import { daysBetween } from '../lib/date';
import type { HunterState } from '../types';

interface Props {
  state: HunterState;
  onRename: (name: string) => void;
}

export function StatusWindow({ state, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(state.hunterName);
  const rank = getRankForLevel(state.level);
  const xpReq = xpToNextLevel(state.level);
  const xpPct = Math.min(100, (state.xp / xpReq) * 100);
  const daysActive = Math.max(1, daysBetween(state.createdAt, state.todayDate) + 1);

  const commit = () => {
    onRename(tempName);
    setEditing(false);
  };

  return (
    <div className="status-window p-5 md:p-7">
      <div className="corner-tr" />
      <div className="corner-bl" />

      <div className="flex flex-col items-center text-center gap-2">
        <div className="text-text-muted font-heading text-xs tracking-[0.5em]">[ STATUS ]</div>

        <div className="flex items-center gap-2 mt-1">
          {editing ? (
            <>
              <input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && commit()}
                autoFocus
                maxLength={24}
                className="bg-transparent border-b border-accent-cyan/60 px-2 py-1 font-display text-xl md:text-2xl text-center text-text-primary focus:outline-none focus:border-accent-cyan"
              />
              <button onClick={commit} className="text-accent-cyan hover:scale-110 transition">
                <Check size={20} />
              </button>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl md:text-3xl tracking-widest text-text-primary">
                {state.hunterName.toUpperCase()}
              </h1>
              <button
                onClick={() => {
                  setTempName(state.hunterName);
                  setEditing(true);
                }}
                className="text-text-dim hover:text-accent-cyan transition"
                aria-label="Rename hunter"
              >
                <Pencil size={16} />
              </button>
            </>
          )}
        </div>

        <div className="flex items-baseline gap-3 mt-1">
          <span className="font-heading text-text-muted text-sm uppercase tracking-wider">Lv.</span>
          <span className="font-display text-4xl md:text-5xl text-accent-cyan" style={{ textShadow: '0 0 20px rgba(0,212,255,0.6)' }}>
            {state.level}
          </span>
          <span
            className="font-heading text-base md:text-lg uppercase tracking-wider"
            style={{ color: rank.color, textShadow: `0 0 12px ${rank.color}` }}
          >
            {rank.name}
          </span>
        </div>

        <div className="w-full max-w-md mt-3">
          <div className="flex justify-between text-xs font-heading uppercase tracking-wider text-text-muted mb-1">
            <span>XP</span>
            <span>
              {Math.floor(state.xp)} / {xpReq}
            </span>
          </div>
          <div className="relative h-3 bg-bg-deep rounded-full border border-accent-cyan/30 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)',
                boxShadow: '0 0 14px rgba(0,212,255,0.7)',
              }}
              initial={false}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-3 text-xs font-heading uppercase tracking-wider text-text-muted">
          <span>
            Days Active: <span className="text-text-primary">{daysActive}</span>
          </span>
          <span>
            Quests Today:{' '}
            <span className="text-accent-cyan">
              {state.todayCompleted.length} / {state.quests.length}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
