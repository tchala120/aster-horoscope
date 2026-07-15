/** Number of card pads on the board (3×3). */
export const PAD_COUNT = 9;

/**
 * One pleasant note per pad (C-major pentatonic, ascending) so any sequence
 * sounds harmonious. Must stay the same length as PAD_COUNT.
 */
export const PAD_FREQS = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0, // A5
  1046.5, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
];

/** Game phases: idle → showing (playback) → input → advancing → (loop) / over. */
export type Phase = "idle" | "showing" | "input" | "advancing" | "over";

/** A random pad index in [0, PAD_COUNT). */
export function randomStep(rng: () => number = Math.random): number {
  return Math.floor(rng() * PAD_COUNT);
}
