"use client";

import { useEffect, useRef, useState } from "react";
import { playError, playNote, primeAudio } from "@/foundation/ui/sound";
import { drawRank, isCorrect, seededRng, type Guess } from "../core/ladder";

/** Fixed seed for the first deal so server + client render the same cards. */
const INITIAL_SEED = 20260716;
/** How long the next card stays revealed before advancing / ending (ms). */
const REVEAL_MS = 850;

type Phase = "guessing" | "revealing" | "over";

interface State {
  current: number;
  next: number;
  phase: Phase;
  revealed: boolean;
  result: "correct" | "wrong" | null;
  /** The direction the player guessed (for feedback while revealing). */
  guessed: Guess | null;
  streak: number;
}

function initialState(): State {
  const rng = seededRng(INITIAL_SEED);
  const current = drawRank(rng);
  const next = drawRank(rng, current);
  return { current, next, phase: "guessing", revealed: false, result: null, guessed: null, streak: 0 };
}

export function useLadderGame() {
  const [state, setState] = useState<State>(initialState);
  const [best, setBest] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function guess(dir: Guess) {
    if (state.phase !== "guessing") return;
    primeAudio();
    playNote(660, 0.08, 0.18);

    const correct = isCorrect(dir, state.current, state.next);
    const revealedNext = state.next;
    const streakNow = state.streak;

    setState((s) => ({ ...s, phase: "revealing", revealed: true, result: correct ? "correct" : "wrong", guessed: dir }));

    timer.current = setTimeout(() => {
      if (correct) {
        const newStreak = streakNow + 1;
        setBest((b) => Math.max(b, newStreak));
        playNote(1046, 0.11, 0.3);
        setState({
          current: revealedNext,
          next: drawRank(Math.random, revealedNext),
          phase: "guessing",
          revealed: false,
          result: null,
          guessed: null,
          streak: newStreak,
        });
      } else {
        playError();
        setState((s) => ({ ...s, phase: "over" }));
      }
    }, REVEAL_MS);
  }

  function restart() {
    if (timer.current) clearTimeout(timer.current);
    primeAudio();
    const current = drawRank();
    setState({
      current,
      next: drawRank(Math.random, current),
      phase: "guessing",
      revealed: false,
      result: null,
      guessed: null,
      streak: 0,
    });
  }

  return {
    current: state.current,
    next: state.next,
    phase: state.phase,
    revealed: state.revealed,
    result: state.result,
    guessed: state.guessed,
    streak: state.streak,
    best,
    canGuess: state.phase === "guessing",
    guess,
    restart,
  };
}
