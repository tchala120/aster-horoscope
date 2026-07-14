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
