/**
 * Shared motion tokens (Solar / arcanamana-inspired feel).
 * Reused by U1's spread choreography and U3's flip reveal.
 * Easings are cubic-bezier tuples compatible with Framer Motion.
 */
export const easings = {
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
};

/** Durations in seconds. */
export const durations = {
  shuffle: 0.6,
  spread: 0.5,
  stagger: 0.06,
  hover: 0.2,
  pick: 0.5,
  flip: 0.7,
  idle: 3.5,
} as const;
