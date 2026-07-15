/**
 * Lightweight UI sound effects synthesized with the Web Audio API — no audio
 * assets required. All functions are safe to call on the server (no-op) and
 * degrade gracefully where Web Audio is unavailable.
 */

let audioCtx: AudioContext | null = null;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx ??= new Ctor();
  return audioCtx;
}

/**
 * Warm up / unlock the audio context during a user gesture (e.g. a click) so
 * the first hover chime plays reliably despite browser autoplay policies.
 */
export function primeAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  peak: number,
  duration: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain).connect(ctx.destination);
  // Quick attack, soft exponential decay (bell-like).
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Notes of a C-major pentatonic scale — pleasant in any order (wind-chime). */
const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0];

/**
 * A soft, randomized wind-chime ping. Cheap enough to call on every hover.
 * No-op when Web Audio is unavailable.
 */
export function playHoverChime(volume = 0.06): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const start = ctx.currentTime + 0.001;
  const note = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)];
  playTone(ctx, note, start, volume, 0.3); // fundamental
  playTone(ctx, note * 2, start, volume * 0.35, 0.22); // airy octave shimmer
}

/** Ascending C-major arpeggio (C5 → C6) — the core "reward!" motif. */
const FANFARE_ARPEGGIO = [523.25, 659.25, 783.99, 1046.5];
/** High sparkle cascade (C6 E6 G6 C7) layered on top for rarer rewards. */
const SPARKLE_NOTES = [1046.5, 1318.51, 1567.98, 2093.0];

let lastFanfareAt = 0;

/**
 * A triumphant reward fanfare: an ascending arpeggio, a sustained landing
 * chord, and a sparkle cascade whose brightness scales with `intensity`
 * (0..1 — pass the reward's rarity ratio so rarer rewards sound grander).
 * Self-throttles against rapid double-triggers (e.g. StrictMode remounts).
 * No-op when Web Audio is unavailable.
 */
export function playRewardFanfare(intensity = 0.5, volume = 0.09): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const nowMs = Date.now();
  if (nowMs - lastFanfareAt < 400) return;
  lastFanfareAt = nowMs;

  const clamped = Math.min(1, Math.max(0, intensity));
  const start = ctx.currentTime + 0.02;
  const step = 0.1;

  // Ascending arpeggio, each note ringing out with an airy octave shimmer.
  FANFARE_ARPEGGIO.forEach((freq, i) => {
    const t = start + i * step;
    playTone(ctx, freq, t, volume, 0.5);
    playTone(ctx, freq * 2, t, volume * 0.25, 0.32);
  });

  // Triumphant sustained chord to land on.
  const chordAt = start + FANFARE_ARPEGGIO.length * step;
  for (const freq of [523.25, 659.25, 783.99, 1046.5]) {
    playTone(ctx, freq, chordAt, volume * 0.6, 0.9);
  }

  // Brighter sparkle cascade for rarer rewards (1 note → all 4).
  const sparkleCount = 1 + Math.round(clamped * (SPARKLE_NOTES.length - 1));
  for (let i = 0; i < sparkleCount; i++) {
    playTone(ctx, SPARKLE_NOTES[i], chordAt + 0.14 + i * 0.07, volume * 0.3, 0.4);
  }
}
