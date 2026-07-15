"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { Fireworks } from "@/foundation/ui/components/Fireworks";
import {
  DIFFICULTIES,
  type DifficultyId,
  type EffectKind,
  type SpaceDef,
  MAX_PLAYERS,
  MIN_PLAYERS,
  getDifficulty,
} from "./core/race";
import { type Player, useRaceGame } from "./state/use-race-game";

/** Pip layout (3x3 grid positions) for each die face. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DieFace({ value }: { value: number }) {
  const on = new Set(PIPS[value] ?? []);
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-0.5 p-2">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`rounded-full ${on.has(i) ? "bg-grey-950" : "bg-transparent"}`} />
      ))}
    </div>
  );
}

/** Visual treatment for each special-space effect. */
function effectStyle(effect: EffectKind): { glow: string; glyph: string } {
  switch (effect) {
    case "again":
      return { glow: "255,196,75", glyph: "\u21BB" }; // ↻
    case "forward":
      return { glow: "51,204,173", glyph: "\u2191" }; // ↑
    case "back":
      return { glow: "239,68,68", glyph: "\u2193" }; // ↓
    case "skip":
      return { glow: "148,163,184", glyph: "\u23F8" }; // ⏸
    case "swap":
      return { glow: "124,77,255", glyph: "\u21C4" }; // ⇄
    default:
      return { glow: "255,255,255", glyph: "" };
  }
}

/** Short label describing what an event does. */
function effectLabel(effect: EffectKind): string {
  switch (effect) {
    case "again":
      return "Roll again";
    case "forward":
      return "Leap ahead";
    case "back":
      return "Fall back";
    case "skip":
      return "Skip a turn";
    case "swap":
      return "Swap places";
    default:
      return "";
  }
}

const COUNT_OPTIONS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i);

/** Illustrated event cards (public/snake-game) — one per effect. */
const EVENT_IMAGES: Partial<Record<EffectKind, string>> = {
  forward: "/snake-game/leap.png",
  back: "/snake-game/fall.png",
  again: "/snake-game/roll-again.png",
  skip: "/snake-game/skip.png",
  swap: "/snake-game/swap.png",
};
const WIN_IMAGE = "/snake-game/win.png";

/** The event card that depicts a space's effect (the goal shows the win card). */
function spaceImage(effect: EffectKind, isGoal: boolean): string | null {
  if (isGoal) return WIN_IMAGE;
  return EVENT_IMAGES[effect] ?? null;
}

/** Serpentine visual order for a board of `len` spaces: odd rows run
 *  right-to-left so the track snakes and every step lands on a neighbour. */
const COLS = 6;
function serpentine(len: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let r = 0; r * COLS < len; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      row.push(idx < len ? idx : null);
    }
    if (r % 2 === 1) row.reverse();
    out.push(...row);
  }
  return out;
}

/** Adventure atmosphere behind the board: rough rock grain, weathered cracks, torchlight. */
function AdventureDecor({ reduced }: { reduced: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {/* Procedural rock grain */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.18] mix-blend-overlay">
        <filter id="rockGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="11" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#rockGrain)" />
      </svg>

      {/* Weathered cracks running across the stone */}
      <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
        <g stroke="rgba(0,0,0,0.42)" strokeWidth="0.35" fill="none" strokeLinejoin="round">
          <path d="M0,24 L15,27 L23,21 L40,31 L52,27" />
          <path d="M100,58 L85,64 L73,58 L60,69 L49,63" />
          <path d="M28,100 L33,86 L27,73 L31,60" />
          <path d="M74,0 L69,13 L75,24 L69,34" />
        </g>
      </svg>

      {/* Flickering torchlight from the corners */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(30% 32% at 6% 6%, rgba(255,170,80,0.22), transparent 70%), radial-gradient(30% 32% at 94% 7%, rgba(255,150,60,0.18), transparent 70%), radial-gradient(55% 42% at 50% 110%, rgba(120,90,60,0.28), transparent 72%)",
        }}
        animate={reduced ? undefined : { opacity: [0.8, 1, 0.85, 1] }}
        transition={reduced ? undefined : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/** A player pawn rendered as a mini tarot card that magic-moves between cells. */
function Pawn({ player, seat, active, reduced }: { player: Player; seat: number; active: boolean; reduced: boolean }) {
  return (
    <motion.div
      layoutId={player.id}
      transition={reduced ? { duration: 0 } : { duration: 0.16, ease: "easeInOut" }}
      className="relative aspect-[2/3] w-5 shrink-0 overflow-hidden rounded-[5px] sm:w-7"
      style={{
        zIndex: active ? 4 : 2,
        boxShadow: active
          ? `0 0 0 2px #fff, 0 0 10px ${player.color}, 0 3px 8px rgba(0,0,0,0.6)`
          : `0 0 0 1.5px ${player.color}, 0 2px 6px rgba(0,0,0,0.55)`,
      }}
    >
      <Image src={player.image} alt={player.name} fill sizes="32px" className="object-cover" />
      <span
        className="absolute inset-x-0 bottom-0 text-center text-[8px] font-bold leading-[1.3] text-white"
        style={{ background: `linear-gradient(180deg, transparent, ${player.color})` }}
      >
        {seat + 1}
      </span>
    </motion.div>
  );
}

/** One board space. Event spaces (and the goal) carry meaningful art; the rest stay clean. */
function BoardCell({
  index,
  space,
  isGoal,
  players,
  turn,
  playing,
  reduced,
}: {
  index: number;
  space: SpaceDef;
  isGoal: boolean;
  players: Player[];
  turn: number;
  playing: boolean;
  reduced: boolean;
}) {
  const isStart = index === 0;
  const special = space.effect !== "none";
  const { glow, glyph } = effectStyle(space.effect);
  const here = players.map((p, i) => ({ p, i })).filter((x) => x.p.pos === index);

  const pawns = (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <div className="flex -space-x-2 sm:-space-x-2.5">
        {here.map(({ p, i }) => (
          <Pawn key={p.id} player={p} seat={i} active={i === turn && playing} reduced={reduced} />
        ))}
      </div>
    </div>
  );

  // Clean start marker (no art).
  if (isStart) {
    return (
      <div className="relative aspect-square" title="0 · Start">
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
          style={{
            background: "linear-gradient(155deg, #6b5a43 0%, #4a3e2f 100%)",
            boxShadow: "inset 0 1.5px 0 rgba(255,220,170,0.2), inset 0 -3px 5px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.35)",
          }}
        >
          <span aria-hidden className="text-[13px] text-[#ffcf8a]">
            {"\u2726"}
          </span>
          <span
            className="text-[8px] font-bold uppercase tracking-wide text-[#ffcf8a]"
            style={{ textShadow: "0 1px 1px rgba(0,0,0,0.6)" }}
          >
            Start
          </span>
        </div>
        {pawns}
      </div>
    );
  }

  // Clean neutral space — just the step number.
  if (!special && !isGoal) {
    return (
      <div className="relative aspect-square" title={`${index} · ${space.name}`}>
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg"
          style={{
            background: "linear-gradient(155deg, #5a5048 0%, #453d34 55%, #322b24 100%)",
            boxShadow:
              "inset 0 1.5px 0 rgba(255,235,205,0.14), inset 0 -3px 5px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.35)",
          }}
        >
          <span className="text-text-sm font-bold text-[#cbbaa0]" style={{ textShadow: "0 1px 1px rgba(0,0,0,0.6)" }}>
            {index}
          </span>
        </div>
        {pawns}
      </div>
    );
  }

  // Event / goal space — illustrated event card + effect cue.
  const ring = isGoal
    ? "inset 0 0 0 2px rgba(255,196,75,0.85), 0 0 18px rgba(255,196,75,0.55)"
    : `inset 0 0 0 1.5px rgba(${glow},0.7), 0 0 12px rgba(${glow},0.3)`;

  return (
    <div className="relative aspect-square" title={`${index} · ${space.name}`}>
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-[#15110c]" style={{ boxShadow: ring }}>
        <Image src={spaceImage(space.effect, isGoal) ?? WIN_IMAGE} alt={space.name} fill sizes="160px" className="object-contain" />
        {isGoal && !reduced && (
          <motion.div
            className="absolute inset-0"
            style={{ background: "radial-gradient(circle, rgba(255,196,75,0.45), transparent 70%)" }}
            animate={{ opacity: [0.25, 0.7, 0.25] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <span className="absolute left-1 top-1 rounded-full bg-grey-950/80 px-1.5 text-[9px] font-bold leading-[1.4] text-grey-100 ring-1 ring-white/15">
          {index}
        </span>
        <span
          aria-hidden
          className="absolute right-1 top-1 text-[12px] leading-none drop-shadow"
          style={{ color: isGoal ? "#ffd45a" : `rgb(${glow})` }}
        >
          {isGoal ? "\u2605" : glyph}
        </span>
      </div>
      {pawns}
    </div>
  );
}

export function FoolsRace() {
  const reduced = useReducedMotion() ?? false;
  const { phase, playerCount, players, turn, die, spinning, resolving, message, winner, event, difficulty, board, setCount, setName, setDifficulty, shuffle, start, press, reset } =
    useRaceGame();

  const ev = event
    ? {
        ...event,
        ...effectStyle(event.effect),
        label: effectLabel(event.effect),
        image: EVENT_IMAGES[event.effect] ?? WIN_IMAGE,
      }
    : null;

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-6">
        <BackLink />

        <header className="text-center">
          <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
            Party game · 2&ndash;6 players
          </p>
          <h1 className="mt-1 text-heading-lg font-bold text-grey-50">The Fool&apos;s Race</h1>
          <p className="mt-2 text-text-md text-grey-400">
            Race up the trail. First to <span className="font-semibold text-aster-teal-300">the summit</span> wins
            &mdash; but the path loves to meddle.
          </p>
        </header>

        {phase === "setup" ? (
          <SetupPanel
            players={players}
            playerCount={playerCount}
            difficulty={difficulty}
            onCount={setCount}
            onName={setName}
            onDifficulty={setDifficulty}
            onStart={start}
          />
        ) : (
          <>
            {/* Difficulty badge */}
            <div className="flex justify-center">
              <span className="rounded-full bg-grey-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-aster-teal-300 ring-1 ring-white/10">
                {getDifficulty(difficulty).label}
              </span>
            </div>

            {/* Turn banner */}
            <div className="flex items-center justify-center gap-3">
              <div
                className="relative aspect-[2/3] w-8 overflow-hidden rounded-md"
                style={{ boxShadow: `0 0 0 2px ${players[turn].color}, 0 0 14px ${players[turn].color}` }}
              >
                <Image src={players[turn].image} alt="" fill sizes="32px" className="object-cover" />
              </div>
              <div className="text-left">
                <p className="text-heading-sm font-bold leading-tight text-grey-50">{players[turn].name}</p>
                <p className="text-text-sm leading-tight text-grey-400">{players[turn].cardName}</p>
              </div>
            </div>

            {/* Board — a rocky adventure trail through the arcana.
                Breaks out to 1.1x on large screens where there's room. */}
            <div
              className="relative overflow-hidden rounded-2xl p-2 ring-1 ring-[#7a6a54]/45 sm:p-3 lg:-ml-[5%] lg:w-[110%]"
              style={{ background: "radial-gradient(125% 100% at 50% -10%, #4b4038 0%, #2c251e 52%, #15110c 100%)" }}
            >
              <AdventureDecor reduced={reduced} />
              <div className="relative grid grid-cols-6 gap-1.5 sm:gap-2">
                {serpentine(board.length).map((index, cellKey) =>
                  index === null ? (
                    <div key={`e${cellKey}`} aria-hidden />
                  ) : (
                    <BoardCell
                      key={index}
                      index={index}
                      space={board[index]}
                      isGoal={index === board.length - 1}
                      players={players}
                      turn={turn}
                      playing={phase === "playing"}
                      reduced={reduced}
                    />
                  ),
                )}
              </div>
            </div>

            {/* Legend */}
            <p className="text-center text-[11px] text-grey-500">
              <span className="text-aster-teal-300">{"\u2191"}</span> leap ·{" "}
              <span className="text-red-400">{"\u2193"}</span> fall ·{" "}
              <span className="text-yellow-300">{"\u21BB"}</span> roll again ·{" "}
              <span className="text-[#a78bfa]">{"\u21C4"}</span> swap ·{" "}
              <span className="text-slate-300">{"\u23F8"}</span> skip ·{" "}
              <span className="text-yellow-300">{"\u2605"}</span> finish
            </p>

            {/* Status */}
            <p
              aria-live="polite"
              className="min-h-[2.5rem] rounded-xl bg-grey-900/50 px-4 py-2.5 text-center text-text-sm text-grey-200 ring-1 ring-white/8"
            >
              {message}
            </p>

            {/* Die + spin/stop button */}
            <div className="flex items-center justify-center gap-4">
              <motion.div
                className="h-14 w-14 rounded-xl bg-grey-50 ring-1 ring-white/20"
                animate={
                  reduced
                    ? { rotate: 0 }
                    : spinning
                      ? { rotate: 360 }
                      : resolving
                        ? { rotate: [0, -10, 8, -5, 0], scale: [1, 1.08, 1] }
                        : { rotate: 0, scale: 1 }
                }
                transition={spinning ? { rotate: { repeat: Infinity, duration: 0.45, ease: "linear" } } : { duration: 0.5 }}
              >
                <DieFace value={die ?? 1} />
              </motion.div>
              <button
                type="button"
                onClick={press}
                disabled={resolving}
                className={`min-w-[8rem] rounded-full px-9 py-3 text-text-md font-semibold transition-transform enabled:hover:scale-105 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                  spinning ? "bg-yellow-400 text-grey-950" : "bg-brand-gradient text-grey-950"
                }`}
              >
                {resolving ? "\u2026" : spinning ? "Stop" : "Roll"}
              </button>
            </div>

            {/* Shuffle the event placement */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={shuffle}
                disabled={spinning || resolving}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-text-sm font-semibold text-grey-200 ring-1 ring-white/15 transition-colors enabled:hover:bg-white/8 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
              >
                <span aria-hidden>{"\u21C6"}</span> Shuffle events
              </button>
            </div>
          </>
        )}
      </div>

      {/* Event announcement — tells the player what they landed on */}
      <AnimatePresence>
        {ev && phase === "playing" && (
          <motion.div
            key={`${ev.rank}-${ev.name}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
            transition={reduced ? { duration: 0.12 } : { type: "spring", stiffness: 380, damping: 26 }}
            className="pointer-events-none fixed left-1/2 top-20 z-40 w-[min(92vw,22rem)] -translate-x-1/2"
          >
            <div
              className="flex items-center gap-3 rounded-2xl bg-grey-900/95 p-3 backdrop-blur"
              style={{ boxShadow: `0 0 0 1.5px rgba(${ev.glow},0.7), 0 12px 40px -12px rgba(${ev.glow},0.85)` }}
            >
              <div
                className="relative aspect-[5/7] w-12 shrink-0 overflow-hidden rounded-lg bg-grey-950"
                style={{ boxShadow: `inset 0 0 0 1px rgba(${ev.glow},0.5)` }}
              >
                <Image src={ev.image} alt={ev.name} fill sizes="48px" className="object-contain" />
              </div>
              <div className="min-w-0">
                <p
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: `rgb(${ev.glow})` }}
                >
                  <span aria-hidden>{ev.glyph}</span> {ev.label}
                </p>
                <p className="truncate text-heading-sm font-bold text-grey-50">{ev.name}</p>
                <p className="text-text-sm text-grey-300">{ev.blurb}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win overlay */}
      {phase === "over" && winner !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-grey-950/70 p-4 backdrop-blur-sm">
          {!reduced && <Fireworks count={32} radius={220} />}
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-grey-gradient px-8 py-7 text-center ring-1 ring-white/10">
            <div
              className="relative mx-auto aspect-[2/3] w-24 overflow-hidden rounded-xl"
              style={{ boxShadow: `0 0 0 2px ${players[winner].color}, 0 0 30px ${players[winner].color}` }}
            >
              <Image src={players[winner].image} alt={players[winner].cardName} fill sizes="96px" className="object-cover" />
            </div>
            <p className="mt-4 text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
              The summit is reached
            </p>
            <h2 className="mt-1 text-heading-lg font-bold text-grey-50">{players[winner].name} wins!</h2>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={start}
                className="rounded-full bg-brand-gradient px-7 py-3 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Race again
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-full px-7 py-3 text-text-md font-semibold text-grey-200 ring-1 ring-white/15 transition-colors hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                New players
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SetupPanel({
  players,
  playerCount,
  difficulty,
  onCount,
  onName,
  onDifficulty,
  onStart,
}: {
  players: Player[];
  playerCount: number;
  difficulty: DifficultyId;
  onCount: (n: number) => void;
  onName: (i: number, name: string) => void;
  onDifficulty: (id: DifficultyId) => void;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-3xl bg-grey-gradient px-7 py-8 ring-1 ring-white/10">
      <div className="text-center">
        <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">Gather the seekers</p>
        <h2 className="mt-1 text-heading-md font-bold text-grey-50">How many players?</h2>
        <p className="mt-1 text-text-sm text-grey-400">Pass one device around the table.</p>
      </div>

      <div className="flex justify-center gap-2">
        {COUNT_OPTIONS.map((n) => {
          const active = n === playerCount;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onCount(n)}
              aria-pressed={active}
              className={`flex h-11 w-11 items-center justify-center rounded-full text-text-md font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400 ${
                active
                  ? "bg-brand-gradient text-grey-950"
                  : "bg-grey-900/60 text-grey-200 ring-1 ring-white/10 hover:bg-grey-800/70"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Difficulty — a work-themed career ladder */}
      <div>
        <p className="mb-2 text-center text-text-sm text-grey-400">Difficulty</p>
        <div className="flex justify-center gap-2">
          {DIFFICULTIES.map((d) => {
            const active = d.id === difficulty;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDifficulty(d.id)}
                aria-pressed={active}
                className={`flex-1 rounded-full px-3 py-2 text-text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400 ${
                  active
                    ? "bg-brand-gradient text-grey-950"
                    : "bg-grey-900/60 text-grey-200 ring-1 ring-white/10 hover:bg-grey-800/70"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[11px] text-grey-500">{getDifficulty(difficulty).tagline}</p>
      </div>

      {/* Name each player (their pawn card is shown alongside) */}
      <div className="flex flex-col gap-2.5">
        {players.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3">
            <div
              className="relative aspect-[2/3] w-9 shrink-0 overflow-hidden rounded-md"
              style={{ boxShadow: `0 0 0 2px ${p.color}, 0 0 10px ${p.color}` }}
            >
              <Image src={p.image} alt={p.cardName} fill sizes="36px" className="object-cover" />
            </div>
            <input
              type="text"
              value={p.name}
              maxLength={16}
              onChange={(e) => onName(i, e.target.value)}
              placeholder={`Player ${i + 1}`}
              aria-label={`Name for player ${i + 1}`}
              className="min-w-0 flex-1 rounded-lg bg-grey-900/60 px-3 py-2 text-text-sm text-grey-100 ring-1 ring-white/10 placeholder:text-grey-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="rounded-full bg-brand-gradient px-9 py-3 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Begin the race
      </button>
    </div>
  );
}
