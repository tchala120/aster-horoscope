"use client";

import { useEffect, useRef, useState } from "react";
import { playError, playNote, playRewardFanfare, primeAudio } from "@/foundation/ui/sound";
import {
  type DifficultyId,
  type EffectKind,
  type SpaceDef,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLAYER_CARDS,
  buildBoard,
  clampPos,
  rollDie,
} from "../core/race";

export interface Player {
  id: string;
  name: string;
  color: string;
  image: string;
  cardName: string;
  pos: number;
  skipNext: boolean;
}

/** A landed-on special space, surfaced so the UI can announce what happened. */
export interface RaceEvent {
  rank: number;
  name: string;
  blurb: string;
  effect: EffectKind;
}

type Phase = "setup" | "playing" | "over";

const START_MS = 300; // beat before the first hop
const STEP_MS = 170; // one walked hop between spaces
const LAND_MS = 420; // pause on the landing space before its effect
const EFFECT_MS = 720; // pause to read the effect before the next turn
const SPIN_MS = 80; // die-face cycle speed while spinning

function makePlayer(i: number, name?: string): Player {
  return {
    id: `p${i}`,
    name: name ?? `Player ${i + 1}`,
    color: PLAYER_CARDS[i].color,
    image: PLAYER_CARDS[i].image,
    cardName: PLAYER_CARDS[i].name,
    pos: 0,
    skipNext: false,
  };
}

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => makePlayer(i));
}

/** Index of the other player furthest ahead (for Death's swap). */
function leaderAmongOthers(players: Player[], self: number): number {
  let best = -1;
  let bestPos = -1;
  players.forEach((p, i) => {
    if (i === self) return;
    if (p.pos > bestPos) {
      bestPos = p.pos;
      best = i;
    }
  });
  return best;
}

/** Advance the turn, skipping (and clearing) any player flagged to miss a turn. */
function advanceTurn(players: Player[], from: number): { players: Player[]; nextTurn: number; skipped: string[] } {
  const next = players.map((p) => ({ ...p }));
  const skipped: string[] = [];
  let idx = from;
  for (let n = 0; n < next.length; n++) {
    idx = (idx + 1) % next.length;
    if (next[idx].skipNext) {
      next[idx].skipNext = false;
      skipped.push(next[idx].name);
      continue;
    }
    return { players: next, nextTurn: idx, skipped };
  }
  return { players: next, nextTurn: (from + 1) % next.length, skipped };
}

export function useRaceGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<Player[]>(() => makePlayers(2));
  const [turn, setTurn] = useState(0);
  const [die, setDie] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState("Choose your seekers.");
  const [winner, setWinner] = useState<number | null>(null);
  const [event, setEvent] = useState<RaceEvent | null>(null);
  const [difficulty, setDifficultyState] = useState<DifficultyId>("medium");
  const [board, setBoard] = useState<SpaceDef[]>(() => buildBoard("medium"));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSpin = () => {
    if (spinRef.current) {
      clearInterval(spinRef.current);
      spinRef.current = null;
    }
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(
    () => () => {
      clearTimers();
      clearSpin();
    },
    [],
  );

  function setCount(n: number) {
    const c = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, n));
    setPlayerCount(c);
    setPlayers((prev) => Array.from({ length: c }, (_, i) => makePlayer(i, prev[i]?.name)));
  }

  function setName(i: number, name: string) {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, name } : p)));
  }

  function setDifficulty(id: DifficultyId) {
    setDifficultyState(id);
    setBoard(buildBoard(id));
  }

  /** Reshuffle where the events sit on the board (keeps players in place). */
  function shuffle() {
    if (phase !== "playing" || spinning || resolving) return;
    primeAudio();
    setBoard(buildBoard(difficulty));
    setEvent(null);
    playNote(500, 0.07, 0.16);
    setMessage(`Events reshuffled! ${players[turn].name}, tap Roll.`);
  }

  function start() {
    clearTimers();
    clearSpin();
    primeAudio();
    const pl = players.map((p, i) => ({
      ...p,
      name: p.name.trim() || `Player ${i + 1}`,
      pos: 0,
      skipNext: false,
    }));
    setPlayers(pl);
    setBoard(buildBoard(difficulty));
    setTurn(0);
    setDie(null);
    setWinner(null);
    setEvent(null);
    setSpinning(false);
    setResolving(false);
    setPhase("playing");
    setMessage(`${pl[0].name}, tap Roll to spin the die.`);
  }

  const playStep = () => playNote(430, 0.04, 0.07);

  /** Walk the roller from its current space and resolve the space it stops on. */
  function resolve(d: number) {
    const base = players;
    const t = turn;
    const roller = base[t];
    const goal = board.length - 1;
    const start = roller.pos;
    const landing = clampPos(start + d, goal);
    const won1 = landing === goal;
    const space = board[landing];
    const isEvent = space.effect !== "none";

    let finalPos = landing;
    let extraTurn = false;
    let skipSelf = false;
    let swapWith = -1;
    if (!won1) {
      if (space.effect === "forward") finalPos = clampPos(landing + space.amount, goal);
      else if (space.effect === "back") finalPos = clampPos(landing - space.amount, goal);
      else if (space.effect === "again") extraTurn = true;
      else if (space.effect === "skip") skipSelf = true;
      else if (space.effect === "swap") swapWith = leaderAmongOthers(base, t);
    }
    const won2 = finalPos === goal;

    const withRollerAt = (pos: number) => base.map((p, i) => (i === t ? { ...p, pos } : p));

    // Final board state (used to advance the turn correctly).
    let afterEffect = withRollerAt(finalPos);
    if (swapWith >= 0) {
      const leaderPos = base[swapWith].pos;
      afterEffect = base.map((p, i) =>
        i === t ? { ...p, pos: leaderPos } : i === swapWith ? { ...p, pos: landing } : p,
      );
    } else if (skipSelf) {
      afterEffect = base.map((p, i) => (i === t ? { ...p, pos: landing, skipNext: true } : p));
    }

    const eventInfo: RaceEvent = { rank: landing, name: space.name, blurb: space.blurb, effect: space.effect };

    setResolving(true);
    setMessage(`${roller.name} rolled ${d}.`);

    let delay = 0;
    const at = (ms: number, fn: () => void) => {
      delay += ms;
      timers.current.push(setTimeout(fn, delay));
    };

    const finishWin = () => {
      setEvent(null);
      setWinner(t);
      setPhase("over");
      setResolving(false);
      setMessage(`${roller.name} reaches the summit!`);
      playRewardFanfare(1);
    };

    const advance = () => {
      const { players: cleared, nextTurn, skipped } = advanceTurn(afterEffect, t);
      setPlayers(cleared);
      setTurn(nextTurn);
      setResolving(false);
      const skipMsg = skipped.length ? `${skipped.join(", ")} skips a turn. ` : "";
      setMessage(`${skipMsg}${cleared[nextTurn].name}, tap Roll.`);
    };

    // 1) Walk to the landing space, one hop at a time.
    for (let pos = start + 1; pos <= landing; pos++) {
      const snapshot = withRollerAt(pos);
      const last = pos === landing;
      at(pos === start + 1 ? START_MS : STEP_MS, () => {
        setPlayers(snapshot);
        playStep();
        if (last) {
          setMessage(
            won1
              ? `${roller.name} reaches the summit!`
              : isEvent
                ? `${roller.name} lands on ${space.name}!`
                : `${roller.name} moves to space ${landing}.`,
          );
        }
      });
    }

    if (won1) {
      at(EFFECT_MS, finishWin);
      return;
    }

    // 2) Resolve the landed-on space.
    if (space.effect === "forward" || space.effect === "back") {
      at(LAND_MS, () => {
        setEvent(eventInfo);
        if (space.effect === "forward") playNote(880, 0.1, 0.28);
        else playError();
      });
      const dir = space.effect === "forward" ? 1 : -1;
      let pos = landing;
      while (pos !== finalPos) {
        pos = clampPos(pos + dir, goal);
        const snapshot = withRollerAt(pos);
        at(STEP_MS, () => {
          setPlayers(snapshot);
          playStep();
        });
      }
      at(EFFECT_MS, () => (won2 ? finishWin() : advance()));
    } else if (swapWith >= 0) {
      at(LAND_MS, () => {
        setPlayers(afterEffect);
        setEvent(eventInfo);
        playNote(660, 0.1, 0.28);
      });
      at(EFFECT_MS, advance);
    } else if (skipSelf) {
      at(LAND_MS, () => {
        setPlayers(afterEffect);
        setEvent(eventInfo);
        playNote(320, 0.09, 0.24);
      });
      at(EFFECT_MS, advance);
    } else if (extraTurn) {
      at(LAND_MS, () => {
        setEvent(eventInfo);
        playNote(880, 0.1, 0.28);
      });
      at(EFFECT_MS, () => {
        setResolving(false);
        setMessage(`${roller.name} rolls again!`);
      });
    } else {
      // Neutral space — nothing happens; keep the landing message.
      at(EFFECT_MS, advance);
    }
  }

  /** Single button: start the die spinning, then stop it to reveal the roll. */
  function press() {
    if (phase !== "playing" || resolving) return;
    primeAudio();
    setEvent(null);

    if (!spinning) {
      setSpinning(true);
      setMessage(`Stop the die, ${players[turn].name}!`);
      playNote(600, 0.05, 0.09);
      spinRef.current = setInterval(() => {
        setDie(1 + Math.floor(Math.random() * 6));
      }, SPIN_MS);
      return;
    }

    clearSpin();
    setSpinning(false);
    const d = rollDie();
    setDie(d);
    playNote(520, 0.09, 0.18);
    resolve(d);
  }

  function reset() {
    clearTimers();
    clearSpin();
    setPhase("setup");
    setWinner(null);
    setEvent(null);
    setDie(null);
    setSpinning(false);
    setResolving(false);
    setPlayers((prev) => prev.map((p) => ({ ...p, pos: 0, skipNext: false })));
    setBoard(buildBoard(difficulty));
    setTurn(0);
    setMessage("Choose your seekers.");
  }

  return {
    phase,
    playerCount,
    players,
    turn,
    die,
    spinning,
    resolving,
    message,
    winner,
    event,
    difficulty,
    board,
    setCount,
    setName,
    setDifficulty,
    shuffle,
    start,
    press,
    reset,
  };
}
