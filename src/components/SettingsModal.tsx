import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  FastForward,
  LogOut,
  Cloud,
  CloudOff,
} from 'lucide-react';
import type { HunterState } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  exportJSON: () => string;
  importJSON: (s: HunterState) => void;
  resetAll: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onAdvanceDay: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
  syncStatus?: 'idle' | 'syncing' | 'error' | 'offline';
}

export function SettingsModal({
  open,
  onClose,
  exportJSON,
  importJSON,
  resetAll,
  muted,
  onToggleMute,
  onAdvanceDay,
  userEmail,
  onSignOut,
  syncStatus,
}: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hunter_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as HunterState;
      if (!parsed.quests || !parsed.stats) throw new Error('Invalid backup');
      importJSON(parsed);
      onClose();
    } catch {
      alert('Could not load backup file — not a valid Hunter save.');
    }
  };

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
            className="status-window w-full max-w-md p-5"
          >
            <div className="corner-tr" />
            <div className="corner-bl" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-accent-cyan uppercase tracking-[0.3em] text-sm">
                System Settings
              </h2>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5">
              {userEmail && (
                <SettingRow
                  label={userEmail}
                  icon={
                    syncStatus === 'offline' || syncStatus === 'error' ? (
                      <CloudOff size={16} className="text-warning" />
                    ) : (
                      <Cloud size={16} />
                    )
                  }
                  description={
                    syncStatus === 'syncing'
                      ? 'Syncing to cloud…'
                      : syncStatus === 'offline'
                        ? 'Offline — changes will sync when online.'
                        : syncStatus === 'error'
                          ? 'Sync error — will retry on next change.'
                          : 'Signed in. Data synced to cloud.'
                  }
                  action={
                    onSignOut && (
                      <button onClick={onSignOut} className="btn-ghost flex items-center gap-1">
                        <LogOut size={12} />
                        Sign out
                      </button>
                    )
                  }
                />
              )}
              <SettingRow
                label="Sound effects"
                icon={muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                action={
                  <button onClick={onToggleMute} className="btn-ghost">
                    {muted ? 'Off' : 'On'}
                  </button>
                }
              />
              <SettingRow
                label="Export backup (JSON)"
                icon={<Download size={16} />}
                action={
                  <button onClick={handleExport} className="btn-ghost">
                    Download
                  </button>
                }
              />
              <SettingRow
                label="Import backup"
                icon={<Upload size={16} />}
                action={
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                    <button onClick={handleImportClick} className="btn-ghost">
                      Load file
                    </button>
                  </>
                }
              />
              <SettingRow
                label="Advance one day (dev)"
                icon={<FastForward size={16} />}
                description="Or press Ctrl + Shift + D anywhere."
                action={
                  <button onClick={onAdvanceDay} className="btn-ghost">
                    +1 day
                  </button>
                }
              />

              <div className="pt-3 border-t border-danger/30">
                {!confirmReset ? (
                  <SettingRow
                    label="Reset Hunter"
                    icon={<RotateCcw size={16} className="text-danger" />}
                    description="Wipes all progress, stats, history."
                    action={
                      <button onClick={() => setConfirmReset(true)} className="btn-danger">
                        Reset
                      </button>
                    }
                  />
                ) : (
                  <div className="text-sm">
                    <div className="text-danger font-heading uppercase tracking-wider mb-2">
                      Are you sure?
                    </div>
                    <p className="text-text-muted mb-3">
                      This will delete all progress. There's no undo (unless you exported a backup).
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          resetAll();
                          setConfirmReset(false);
                          onClose();
                        }}
                        className="btn-danger flex-1"
                      >
                        Yes, reset everything
                      </button>
                      <button onClick={() => setConfirmReset(false)} className="btn-ghost flex-1">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SettingRow({
  label,
  icon,
  description,
  action,
}: {
  label: string;
  icon: React.ReactNode;
  description?: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 text-accent-cyan/80 shrink-0">{icon}</span>
        <div className="min-w-0">
          <div className="text-sm text-text-primary truncate">{label}</div>
          {description && <div className="text-[11px] text-text-muted">{description}</div>}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
