"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playError, playNote, primeAudio } from "@/foundation/ui/sound";
import { PAD_COUNT, PAD_FREQS, randomStep, type Phase } from "../core/echoes";

const SHOW_START_DELAY = 550; // pause before playback begins (ms)
const SHOW_STEP_MS = 620; // time between pads during playback
const SHOW_LIGHT_MS = 380; // how long a pad stays lit during playback
const ADVANCE_MS = 750; // pause between a cleared round and the next
const TAP_LIGHT_MS = 200; // how long a pad stays lit on a tap

export function useEchoesGame() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [inputIndex, setInputIndex] = useState(0);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [best, setBest] = useState(0);

  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Play back the current sequence when it's the game's turn.
  useEffect(() => {
    if (phase !== "showing") return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    sequence.forEach((pad, i) => {
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setActivePad(pad);
          playNote(PAD_FREQS[pad]);
          timers.push(
            setTimeout(() => {
              if (!cancelled) setActivePad(null);
            }, SHOW_LIGHT_MS),
          );
        }, SHOW_START_DELAY + i * SHOW_STEP_MS),
      );
    });

    // Hand control to the player once the whole sequence has played.
    timers.push(
      setTimeout(
        () => {
          if (cancelled) return;
          setInputIndex(0);
          setPhase("input");
        },
        SHOW_START_DELAY + sequence.length * SHOW_STEP_MS,
      ),
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [phase, sequence]);

  // Clear any pending one-off timers on unmount.
  useEffect(() => {
    return () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const start = useCallback(() => {
    primeAudio(); // unlock audio within the click gesture
    // `best` is intentionally preserved across restarts.
    setSequence([randomStep()]);
    setInputIndex(0);
    setActivePad(null);
    setPhase("showing");
  }, []);

  const press = useCallback(
    (pad: number) => {
      if (phase !== "input") return;

      // Tap feedback (light + tone).
      setActivePad(pad);
      playNote(PAD_FREQS[pad]);
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => setActivePad(null), TAP_LIGHT_MS);

      if (pad === sequence[inputIndex]) {
        const next = inputIndex + 1;
        if (next === sequence.length) {
          // Round cleared — grow the sequence and replay after a short beat.
          setPhase("advancing");
          advanceTimer.current = setTimeout(() => {
            setSequence((seq) => [...seq, randomStep()]);
            setInputIndex(0);
            setPhase("showing");
          }, ADVANCE_MS);
        } else {
          setInputIndex(next);
        }
      } else {
        // Wrong pad — game over. Score = rounds fully cleared.
        playError();
        setBest((b) => Math.max(b, sequence.length - 1));
        setPhase("over");
      }
    },
    [phase, sequence, inputIndex],
  );

  return {
    padCount: PAD_COUNT,
    phase,
    activePad,
    /** Current sequence length (the round being played/attempted). */
    round: sequence.length,
    /** Rounds fully cleared so far. */
    score: Math.max(0, sequence.length - 1),
    best,
    canPress: phase === "input",
    start,
    press,
  };
}
