// Synthesized SFX via Web Audio API — no asset files, no licensing.
// Triggered after a user gesture so browsers don't block the AudioContext.

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem('hunter_muted', value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function isMuted(): boolean {
  if (typeof localStorage === 'undefined') return muted;
  try {
    const v = localStorage.getItem('hunter_muted');
    if (v !== null) muted = v === '1';
  } catch {
    /* ignore */
  }
  return muted;
}

interface ToneOptions {
  freq: number;
  type?: OscillatorType;
  duration?: number;
  attack?: number;
  release?: number;
  gain?: number;
  startAt?: number;
}

function playTone(opts: ToneOptions) {
  const ac = getCtx();
  if (!ac) return;
  const {
    freq,
    type = 'sine',
    duration = 0.18,
    attack = 0.005,
    release = 0.12,
    gain = 0.15,
    startAt = 0,
  } = opts;
  const t0 = ac.currentTime + startAt;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.setValueAtTime(gain, t0 + Math.max(attack, duration - release));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Crisp single ping for quest completion */
export function playQuestComplete() {
  playTone({ freq: 880, type: 'triangle', duration: 0.14, gain: 0.12 });
  playTone({ freq: 1320, type: 'sine', duration: 0.18, gain: 0.09, startAt: 0.04 });
}

/** Ascending arpeggio for level-up */
export function playLevelUp() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C
  notes.forEach((f, i) => {
    playTone({
      freq: f,
      type: 'triangle',
      duration: 0.22,
      gain: 0.14,
      startAt: i * 0.09,
    });
  });
}

/** Dramatic resolved chord stack for rank-up */
export function playRankUp() {
  const stack = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C major across octaves
  stack.forEach((f, i) => {
    playTone({
      freq: f,
      type: 'sawtooth',
      duration: 0.9,
      attack: 0.02,
      release: 0.7,
      gain: 0.05,
      startAt: i * 0.05,
    });
  });
  // Sparkle on top
  for (let i = 0; i < 6; i++) {
    playTone({
      freq: 1568 + i * 220,
      type: 'sine',
      duration: 0.25,
      gain: 0.06,
      startAt: 0.4 + i * 0.05,
    });
  }
}

/** Soft descending tone for stat decay warning */
export function playWarning() {
  playTone({ freq: 220, type: 'sawtooth', duration: 0.35, gain: 0.08 });
  playTone({ freq: 165, type: 'sawtooth', duration: 0.45, gain: 0.08, startAt: 0.1 });
}
