"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { MAX_PLAYERS, MIN_PLAYERS, ROLES, type RoleId, rolePoolFor } from "./core/werewolf";
import type {
  ChatEntry,
  GameLogEntry,
  PublicPlayer,
  PublicRoom,
  RoomPhase,
  RoomSettings,
} from "./core/room";
import {
  AnnouncementPanel,
  Backdrop,
  PhaseIndicator,
  PrimaryButton,
  RolePortrait,
  TEAM_LABEL,
} from "./components/shared";
import { PlayerPickGrid } from "./components/PlayerSeat";
import { WerewolfLoadingScreen } from "./components/WerewolfLoadingScreen";
import { AvatarMedia } from "./components/AvatarMedia";
import { useWerewolfOnline } from "./state/use-werewolf-online";
import { peekParticipantToken } from "./state/participant-storage";
import { useKnownWerewolfRooms } from "./state/use-known-rooms";

const BACKDROP: Partial<Record<RoomPhase, string>> = {
  "night-wolf": "/werewolf-game/system/night.png",
  "night-seer": "/werewolf-game/system/night.png",
  "night-doctor": "/werewolf-game/system/night.png",
  dawn: "/werewolf-game/system/morning.png",
  "hunter-revenge": "/werewolf-game/system/hunter-event.png",
  "day-discuss": "/werewolf-game/system/day-discuss.png",
  "day-vote": "/werewolf-game/system/day-vote.png",
  "day-runoff": "/werewolf-game/system/day-vote.png",
  "day-result": "/werewolf-game/system/morning.png",
  over: "/werewolf-game/system/morning.png",
};

const NIGHT_PHASES: RoomPhase[] = ["night-wolf", "night-seer", "night-doctor", "dawn"];

/** Shown to non-acting players during every night sub-phase — identical text so
 *  which role is currently acting can't be inferred from the message. */
const NIGHT_WAITING_TEXT =
  "The village sleeps. Something is happening in the dark, but you can't see what.";

/** Seconds left on the room's discuss/vote timer, ticking down live; null when the
 *  setting is off. The server auto-advances discuss→vote and force-tallies an
 *  unfinished vote once this hits zero — this is just the client-side countdown. */
function usePhaseTimer(phaseStartedAt: string | null, cooldownSec: number): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!phaseStartedAt || cooldownSec <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [phaseStartedAt, cooldownSec]);
  if (!phaseStartedAt || cooldownSec <= 0) return null;
  return Math.max(0, Math.ceil((Date.parse(phaseStartedAt) + cooldownSec * 1000 - now) / 1000));
}

const NIGHT_ACTION_PHASES: RoomPhase[] = ["night-wolf", "night-seer", "night-doctor"];

/** The cooldown/timeout to count down for the current phase — discuss/vote use
 *  actionCooldownSec, the three night-role phases use nightActionTimeoutSec. */
function phaseCooldownFor(view: PublicRoom | null): number {
  if (!view) return 0;
  if (view.phase === "day-discuss" || view.phase === "day-vote") {
    return view.settings.actionCooldownSec;
  }
  if (NIGHT_ACTION_PHASES.includes(view.phase)) {
    return view.settings.nightActionTimeoutSec;
  }
  return 0;
}

function formatTimer(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function Shell({
  backdrop,
  backdropContent,
  wide,
  extraWide,
  backHref,
  backLabel,
  hideBack,
  stackLeft,
  backdropInteractive,
  className = "",
  children,
}: {
  backdrop?: string;
  /** Custom full-screen backdrop layer (e.g. the lobby's campfire scene) — takes priority over `backdrop`. */
  backdropContent?: React.ReactNode;
  /** Wider canvas for layouts with side panels (e.g. the lobby's campfire circle). */
  wide?: boolean;
  /** Full-width canvas for large phase artwork such as the ten-player discussion frame. */
  extraWide?: boolean;
  /** Where the "Back" link goes — defaults to BackLink's own default (the app home page). */
  backHref?: string;
  /** Label for the back-navigation link — defaults to BackLink's own default ("Back"). */
  backLabel?: string;
  /** Skip the built-in top-left back link entirely — the caller renders its own, elsewhere in `children`. */
  hideBack?: boolean;
  /** Pins "Back" to the same fixed left column as content below it (e.g. the lobby's
   *  Back → logo → Room Info stack) instead of leaving it in normal flow. */
  stackLeft?: boolean;
  /** Set when `backdropContent` has its own clickable elements (e.g. the campfire circle's
   *  kick buttons): makes the foreground content column click-through in the empty space
   *  between its panels, so the backdrop can be reached. Callers must then opt individual
   *  foreground pieces back in with `pointer-events-auto` themselves. */
  backdropInteractive?: boolean;
  /** Optional page-specific root treatment. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className={`werewolf-world-shell relative flex min-h-[100dvh] flex-1 flex-col bg-[#05080b] text-[#ddd2c0] ${className}`}
    >
      {backdropContent ?? (backdrop ? <Backdrop src={backdrop} /> : <CelestialBackground />)}
      <div
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col gap-5 p-6 ${extraWide ? "max-w-[1600px]" : wide ? "max-w-5xl" : "max-w-2xl"} ${backdropInteractive ? "pointer-events-none" : ""}`}
      >
        {!hideBack && (
          <div
            className={`${backdropInteractive ? "pointer-events-auto " : ""}${stackLeft ? "lg:fixed lg:left-6 lg:top-6" : ""}`}
          >
            <BackLink href={backHref} label={backLabel} />
          </div>
        )}
        {children}
      </div>
    </main>
  );
}

/** Public, server-authored game history shared by every player. */
function GameLogPanel({ entries }: { entries: GameLogEntry[] }) {
  return (
    <div className="werewolf-ancient-panel flex flex-col gap-3 p-4">
      <p className="werewolf-ancient-heading">Game log</p>
      {entries.length === 0 ? (
        <p className="py-2 text-text-sm text-grey-500">Events will appear when the game starts.</p>
      ) : (
        <div className="flex max-h-72 flex-col overflow-y-auto">
          {entries.map((entry, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 py-2.5 ${i > 0 ? "border-t border-amber-900/25" : ""}`}
            >
              <Image
                src={
                  entry.phase === "day"
                    ? "/werewolf-game/icon-sun.png"
                    : "/werewolf-game/icon-moon.png"
                }
                alt=""
                width={22}
                height={22}
                className="mt-0.5 h-[22px] w-[22px] shrink-0"
              />
              <div>
                <p
                  className={`text-text-sm font-semibold ${entry.phase === "day" ? "text-amber-300" : "text-purple-300"}`}
                >
                  {entry.label}
                </p>
                <p className="text-text-sm text-grey-300">{entry.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** One of the four marketing blurbs along the bottom of the landing screen. */
function FeatureCallout({ icon, title, text }: { icon?: string; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-2">
      {icon && (
        <span className="relative h-16 w-16">
          <Image src={icon} alt="" fill sizes="64px" className="object-contain" />
        </span>
      )}
      <p className="font-serif text-text-sm font-semibold text-[#ead9b6]">{title}</p>
      <p className="text-[11px] leading-relaxed text-grey-400">{text}</p>
    </div>
  );
}

/** Landing-only backdrop — the whole scene fitted to the viewport (no cropping),
 *  closer to the reference composition than the shared full-bleed `Backdrop`. */
function LandingBackdrop() {
  return (
    <div aria-hidden className="werewolf-entry-backdrop pointer-events-none">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/werewolf-game/system/werewolf-landing-video.mp4"
        poster="/werewolf-game/system/werewolf-landing-page.png"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-grey-950/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-grey-950 via-grey-950/40 to-transparent" />
    </div>
  );
}

/** Deterministic scatter of falling-snow positions/timing — fixed values instead of
 *  Math.random() so it's stable across renders (no impure calls during render). */
const SNOWFLAKES = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 47) % 100,
  size: 2 + ((i * 7) % 4),
  duration: 10 + ((i * 13) % 12),
  delay: (i * 3) % 15,
  opacity: 0.4 + ((i * 5) % 6) / 10,
}));

/** Falling snow overlay for the landing/room-list screen — sits above the backdrop
 *  art but below the room list and buttons. */
function SnowOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      {SNOWFLAKES.map((flake, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-full bg-white animate-snow-fall"
          style={{
            left: `${flake.left}%`,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Marketing splash — the room browser now lives on its own page (`/werewolf/rooms`); this
 *  screen is just the pitch plus the door in. */
function LandingScreen() {
  const router = useRouter();
  const { rooms: myRooms, loading: myRoomsLoading } = useKnownWerewolfRooms();
  const continueRoom = !myRoomsLoading && myRooms.length > 0 ? myRooms[0] : null;

  return (
    <Shell
      wide
      hideBack
      className="werewolf-room-list-root"
      backdropContent={
        <>
          <LandingBackdrop />
          <SnowOverlay />
        </>
      }
    >
      <header className="ml-auto w-full max-w-md text-center">
        <Image
          src="/werewolf-game/system/logo-removebg.png"
          alt="Werewolf — The Hidden Among Us"
          width={630}
          height={246}
          className="animate-werewolf-logo mx-auto mt-16 h-auto w-72 sm:mt-24 sm:w-96"
          priority
        />
      </header>

      <div className="ml-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 py-8 text-center">
        {continueRoom && (
          <button
            type="button"
            onClick={() => router.push(`/werewolf/online/${continueRoom.code}`)}
            aria-label={`Continue ${continueRoom.roomName}`}
            className="werewolf-start-link text-lg"
          >
            Continue Game
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/werewolf/rooms")}
          aria-label="Start game"
          className={continueRoom ? "werewolf-start-link text-xs" : "werewolf-start-link text-lg"}
        >
          Start Game
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Exit"
          className="werewolf-start-link text-xs"
        >
          Exit
        </button>
      </div>

      <section
        className="mx-auto mt-auto w-full bg-transparent px-2 pb-2 pt-3 sm:px-4 sm:pb-3"
        aria-label="How the game unfolds"
      >
        <div className="grid grid-cols-2 gap-5 text-center sm:grid-cols-4">
          <FeatureCallout
            icon="/werewolf-game/system/wolf-icon.png"
            title="Social deduction"
            text="Outsmart your opponents and uncover the liar."
          />
          <FeatureCallout
            icon="/werewolf-game/system/role-icon.png"
            title="Unique roles"
            text="Many roles, many abilities. Every game is different."
          />
          <FeatureCallout
            icon="/werewolf-game/system/team-icon.png"
            title="Team up"
            text="Work with your allies or betray them all."
          />
          <FeatureCallout
            icon="/werewolf-game/system/survive-night-icon.png"
            title="Survive the night"
            text="Vote, discuss, and survive until the end."
          />
        </div>
      </section>
    </Shell>
  );
}

function LoadingScreen() {
  return <WerewolfLoadingScreen />;
}

/** Top-left panel: shareable room code + player count, styled to sit over the campfire scene. */
function RoomInfoPanel({
  code,
  playerCount,
  isHost,
  onDelete,
  onAddBot,
}: {
  code: string;
  playerCount: number;
  isHost: boolean;
  onDelete: () => void;
  onAddBot: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="werewolf-ancient-panel flex flex-col gap-3 p-4">
      <p className="werewolf-ancient-heading">Room Info</p>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="group flex items-center justify-between gap-3 border-y border-amber-900/25 py-2 text-left text-text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
      >
        <span className="text-grey-400 group-hover:text-amber-200/80">Room Code</span>
        <span className="font-mono font-bold tracking-[0.22em] text-[#ead9b6]">
          {copied ? "Copied!" : code}
        </span>
      </button>
      <div className="flex items-center justify-between gap-3 text-text-sm">
        <span className="text-grey-400">Players</span>
        <span className="font-serif font-bold text-[#ead9b6]">
          {playerCount} / {MAX_PLAYERS}
        </span>
      </div>
      {playerCount < MIN_PLAYERS && (
        <p className="text-center text-[10px] uppercase tracking-[0.16em] text-amber-400/80">
          Need {MIN_PLAYERS} to begin the rite
        </p>
      )}
      {isHost && (
        <div className="mt-1 flex flex-col gap-2 border-t border-amber-900/25 pt-2.5">
          {playerCount < MAX_PLAYERS && (
            <button
              type="button"
              onClick={onAddBot}
              className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300/80 hover:text-amber-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            >
              + Add bot
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-red-400/75 hover:text-red-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
          >
            Delete room
          </button>
        </div>
      )}
    </div>
  );
}

const COOLDOWN_OPTIONS = [0, 30, 60, 120, 180, 300] as const;
const NIGHT_TIMEOUT_OPTIONS = [0, 60, 300, 600, 1800, 3600] as const;

/** Host-editable house rules — locked for everyone once the game leaves the lobby. */
function SettingsPanel({
  settings,
  isHost,
  onChange,
}: {
  settings: RoomSettings;
  isHost: boolean;
  onChange: (patch: Partial<RoomSettings>) => void;
}) {
  const toggles: { key: keyof RoomSettings; label: string }[] = [
    { key: "hideRoleOnDeath", label: "Hide role on death" },
    { key: "hideWolvesRemaining", label: "Hide wolves remaining" },
    { key: "showVoters", label: "Show who voted for whom" },
  ];
  return (
    <div className="werewolf-ancient-panel flex flex-col gap-3 p-4">
      <p className="werewolf-ancient-heading">House Rules</p>
      <div className="flex items-center justify-between gap-3 text-text-sm">
        <span className="text-grey-400">Discuss &amp; vote timer</span>
        {isHost ? (
          <select
            value={settings.actionCooldownSec}
            onChange={(e) => onChange({ actionCooldownSec: Number(e.target.value) })}
            className="rounded-sm border border-amber-900/40 bg-black/45 px-2 py-1 text-[11px] font-bold text-[#ead9b6] focus:border-amber-600/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
          >
            {COOLDOWN_OPTIONS.map((sec) => (
              <option key={sec} value={sec}>
                {sec === 0 ? "Off" : formatTimer(sec)}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-serif font-bold text-[#ead9b6]">
            {settings.actionCooldownSec === 0 ? "Off" : formatTimer(settings.actionCooldownSec)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 text-text-sm">
        <span className="text-grey-400">Night action timeout</span>
        {isHost ? (
          <select
            value={settings.nightActionTimeoutSec}
            onChange={(e) => onChange({ nightActionTimeoutSec: Number(e.target.value) })}
            className="rounded-sm border border-amber-900/40 bg-black/45 px-2 py-1 text-[11px] font-bold text-[#ead9b6] focus:border-amber-600/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
          >
            {NIGHT_TIMEOUT_OPTIONS.map((sec) => (
              <option key={sec} value={sec}>
                {sec === 0 ? "Off" : formatTimer(sec)}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-serif font-bold text-[#ead9b6]">
            {settings.nightActionTimeoutSec === 0
              ? "Off"
              : formatTimer(settings.nightActionTimeoutSec)}
          </span>
        )}
      </div>
      {toggles.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          disabled={!isHost}
          onClick={() => onChange({ [key]: !settings[key] } as Partial<RoomSettings>)}
          aria-pressed={Boolean(settings[key])}
          className="flex items-center justify-between gap-3 text-left text-text-sm enabled:cursor-pointer disabled:cursor-default"
        >
          <span className="text-grey-400">{label}</span>
          <span
            className={`rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
              settings[key]
                ? "border-amber-700/60 text-amber-300"
                : "border-grey-700/60 text-grey-500"
            }`}
          >
            {settings[key] ? "On" : "Off"}
          </span>
        </button>
      ))}
    </div>
  );
}

const ROLE_ORDER: RoleId[] = ["werewolf", "villager", "seer", "doctor", "hunter"];

/** Transparent-bg portraits for the role-distribution panel — shown frameless so they stand on their own. */
const FRAMELESS_ROLE_PORTRAITS: Partial<Record<RoleId, string>> = {
  werewolf: "/werewolf-game/system/wolf-role.png",
  hunter: "/werewolf-game/system/hunter-role.png",
  seer: "/werewolf-game/system/seer-role.png",
  villager: "/werewolf-game/system/villger-role.png",
  doctor: "/werewolf-game/system/doctor-role.png",
};

/** Top-right panel: previews the role pool for the current headcount, before roles are dealt. */
function RoleDistributionPanel({ playerCount }: { playerCount: number }) {
  const pool = rolePoolFor(playerCount);
  const counts = new Map<RoleId, number>();
  for (const role of pool) counts.set(role, (counts.get(role) ?? 0) + 1);

  return (
    <div className="werewolf-ancient-panel flex flex-col gap-3 p-4">
      <p className="werewolf-ancient-heading ">Role Distribution</p>
      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col">
        {ROLE_ORDER.filter((role) => counts.has(role)).map((role) => {
          const framelessPortrait = FRAMELESS_ROLE_PORTRAITS[role];
          const display = framelessPortrait
            ? { ...ROLES[role], portrait: framelessPortrait }
            : ROLES[role];
          return (
            <div
              key={role}
              className="flex items-center justify-between gap-2 border-b border-amber-900/20 pb-1.5"
            >
              <div className="flex items-center gap-2">
                <div className="h-11 w-11 shrink-0 sm:h-12 sm:w-12">
                  <RolePortrait role={display} size={48} frame={!framelessPortrait} />
                </div>
                <span className="font-serif text-[12px] font-semibold text-[#dfcfaf]">
                  {ROLES[role].label}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-amber-300/80">
                {counts.get(role)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Players seated in a ring around a central campfire glow. */
/**
 * Seat positions, as a percentage of the 1536×1024 backdrop, hand-matched to
 * where each painted figure sits around the fire (clockwise from front-center).
 */
const SEAT_POSITIONS: { x: number; y: number }[] = [
  { x: 48, y: 80 }, // front-center, back to camera
  { x: 66, y: 74 }, // front-right
  { x: 80, y: 57 }, // right-middle
  { x: 70, y: 46 }, // back-right, elder
  { x: 61, y: 42 }, // back-right-center, hat
  { x: 51, y: 41 }, // back-center
  { x: 40, y: 42 }, // back-left-center, hooded seated
  { x: 29, y: 43 }, // back-left, hooded
  { x: 18, y: 57 }, // left-middle
  { x: 25, y: 75 }, // front-left, bearded
  { x: 36, y: 70 }, // player 11 / Bot 10
  { x: 74, y: 74 }, // player 12 / Bot 11, immediately right of Bot 1
  { x: 36, y: 57 }, // player 13, above player 11
  { x: 66, y: 61 }, // player 14 / Bot 13, directly above Bot 1
  { x: 50, y: 55 }, // inner-center
];

/**
 * Full-screen campfire scene used as the lobby's backdrop. The inner layer is
 * sized with the same math `background-size: cover` uses for a 3:2 image
 * (150vh wide when the viewport is taller-than-3:2, 66.667vw tall when it's
 * wider) so it fills the screen edge-to-edge while staying perfectly in sync
 * with the seat percentages below — no JS resize handling needed.
 */
function CampfireCircle({
  players,
  isHost,
  onKick,
}: {
  players: PublicPlayer[];
  isHost: boolean;
  onKick: (playerId: string) => void;
}) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="animate-werewolf-fade-in-op pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: "max(100vw, 150vh)", height: "max(100vh, 66.6667vw)" }}
      >
        <Image
          src="/werewolf-game/werewolf-bg-with-people.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-grey-950/60 via-grey-950/15 to-grey-950/35"
        />
        {players.map((p, i) => {
          const seat = SEAT_POSITIONS[i % SEAT_POSITIONS.length];
          return (
            <div
              key={p.id}
              className="animate-werewolf-fade-in-op absolute hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 lg:flex"
              style={{
                left: `${seat.x}%`,
                top: `${seat.y}%`,
                width: "5.5%",
                minWidth: 26,
                animationDelay: `${0.2 + i * 0.08}s`,
              }}
            >
              <div className="relative w-full">
                {p.isHost && (
                  <span
                    aria-hidden
                    className="absolute -top-5 left-1/2 z-10 -translate-x-1/2 text-[28px] leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  >
                    👑
                  </span>
                )}
                <div
                  aria-hidden
                  className={`relative aspect-square w-full overflow-hidden rounded-full border-2 bg-grey-950 ring-1 ring-black transition-shadow ${p.ready ? "border-amber-300" : "border-red-800/90"}`}
                  style={{
                    boxShadow: p.ready
                      ? "0 0 14px rgba(251,191,36,0.45)"
                      : "0 2px 10px rgba(0,0,0,0.8)",
                  }}
                >
                  {p.avatar ? (
                    <AvatarMedia avatar={p.avatar} sizes="60px" />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-text-md font-bold text-grey-950"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name.slice(0, 1).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                {isHost && !p.isYou && !p.isHost && (
                  <button
                    type="button"
                    onClick={() => onKick(p.id)}
                    aria-label={`Remove ${p.name}`}
                    className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border border-red-900/60 bg-grey-950 text-[9px] font-bold leading-none text-red-400 shadow-md transition-colors hover:border-red-500 hover:bg-red-950 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="max-w-[4rem] truncate rounded-sm border border-amber-900/45 bg-[#090b0e]/90 px-2 py-0.5 font-serif text-[10px] font-semibold text-[#e6d8bb] shadow-lg sm:max-w-[5rem] sm:text-[11px]">
                {p.name}
              </span>
              <span
                className={`rounded-sm border bg-grey-950/90 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.13em] ${p.ready ? "border-amber-700/60 text-amber-300" : "border-red-900/60 text-red-300"}`}
              >
                {p.ready ? "Ready" : "Not ready"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CountdownDisplay({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const seconds = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000));
  return (
    <div aria-live="assertive" className="werewolf-ancient-panel px-9 py-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">
        Game starting
      </p>
      <p className="mt-1 font-serif text-5xl font-black tabular-nums text-[#ead9b6]">{seconds}</p>
    </div>
  );
}

/** Bottom-right panel: system join notices + player chat, polled along with the rest of the room. */
function ChatPanel({
  entries,
  onSend,
  title = "Whispers",
}: {
  entries: ChatEntry[];
  onSend: (text: string) => void;
  title?: string;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div className="werewolf-ancient-panel flex h-56 flex-col gap-2 p-4 lg:h-64">
      <p className="werewolf-ancient-heading">{title}</p>
      <div ref={listRef} className="flex-1 space-y-1.5 overflow-y-auto pr-1 text-text-sm">
        {entries.length === 0 && <p className="text-grey-500">No messages yet.</p>}
        {entries.map((e) =>
          e.kind === "system" ? (
            <p key={e.id} className="leading-snug text-grey-500">
              System: {e.text}
            </p>
          ) : (
            <p key={e.id} className="leading-snug">
              <span className="font-semibold" style={{ color: e.color ?? undefined }}>
                {e.name}:
              </span>{" "}
              <span className="text-grey-200">{e.text}</span>
            </p>
          ),
        )}
      </div>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const text = draft.trim();
          if (!text) return;
          onSend(text);
          setDraft("");
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          maxLength={300}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          aria-label="Chat message"
          className="min-w-0 flex-1 rounded-sm border border-amber-900/40 bg-black/45 px-3 py-2 text-text-sm text-[#ead9b6] placeholder:text-grey-600 focus:border-amber-600/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-amber-700/60 bg-gradient-to-b from-[#6e351d] to-[#280c0b] text-amber-100 transition-transform hover:scale-105 hover:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

function LobbyScreen({
  view,
  onStart,
  onLeave,
  onDelete,
  onSendChat,
  onReady,
  onUpdateSettings,
  onKick,
  onAddBot,
}: {
  view: PublicRoom;
  onStart: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onSendChat: (text: string) => void;
  onReady: (ready: boolean) => void;
  onUpdateSettings: (patch: Partial<RoomSettings>) => void;
  onKick: (playerId: string) => void;
  onAddBot: () => void;
}) {
  const me = view.players.find((p) => p.isYou);
  const allReady = view.players.length >= MIN_PLAYERS && view.players.every((p) => p.ready);
  const isCountingDown = view.phase === "countdown" && Boolean(view.countdownEndsAt);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<
    | { type: "delete" }
    | {
        type: "kick";
        playerId: string;
        playerName: string;
        playerAvatar: string;
        playerColor: string;
      }
    | null
  >(null);
  return (
    <Shell
      wide
      backHref="/werewolf/rooms"
      stackLeft
      backdropInteractive
      backdropContent={
        <CampfireCircle
          players={view.players}
          isHost={view.isHost}
          onKick={(playerId) => {
            const player = view.players.find((candidate) => candidate.id === playerId);
            if (player) {
              setPendingConfirm({
                type: "kick",
                playerId,
                playerName: player.name,
                playerAvatar: player.avatar,
                playerColor: player.color,
              });
            }
          }}
        />
      }
    >
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open house rules settings"
        className="animate-werewolf-fade-in pointer-events-auto fixed right-4 top-4 z-20 flex items-center gap-1.5 rounded-sm border border-amber-900/45 bg-black/55 px-3 py-1.5 shadow-inner transition-colors hover:border-amber-600/70 hover:bg-amber-950/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
      >
        <Image
          src="/werewolf-game/system/setting-gear.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">
          Setting
        </span>
      </button>

      <header
        className="animate-werewolf-fade-in text-center lg:fixed lg:left-6 lg:top-16 lg:w-[220px] lg:text-left"
        style={{ animationDelay: "0.05s" }}
      >
        <Image
          src="/werewolf-game/system/logo-removebg.png"
          alt="Werewolf — The Hidden Among Us"
          width={630}
          height={246}
          className="h-auto w-64 sm:w-80 lg:w-full"
        />
      </header>

      <div
        className="animate-werewolf-fade-in pointer-events-auto mx-auto flex flex-col items-center lg:fixed lg:left-1/2 lg:top-5 lg:z-20 lg:-translate-x-1/2"
        style={{ animationDelay: "0.1s" }}
      >
        {isCountingDown && view.countdownEndsAt ? (
          <CountdownDisplay endsAt={view.countdownEndsAt} />
        ) : view.isHost && allReady ? (
          <button
            type="button"
            onClick={onStart}
            aria-label="Start the game"
            className="group relative h-24 w-72 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Image
              src="/werewolf-game/system/start-game-button.png"
              alt=""
              fill
              sizes="288px"
              className="object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center font-serif text-xl font-black tracking-[0.16em] text-amber-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
              START GAME
            </span>
          </button>
        ) : (
          <div className="werewolf-ancient-panel px-5 py-2.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-200/60">
              The gathering
            </p>
            <p className="mt-0.5 font-serif text-sm font-bold tracking-[0.1em] text-[#ead9b6]">
              {view.players.filter((p) => p.ready).length}/{view.players.length} sworn
            </p>
          </div>
        )}
      </div>

      <div className="pointer-events-none mt-20 flex flex-1 flex-col items-center justify-center gap-5 pb-28 lg:mt-0 lg:pb-0">
        <div
          className="animate-werewolf-fade-in pointer-events-auto flex w-full max-w-md flex-col gap-4 lg:fixed lg:left-6 lg:top-44 lg:max-h-[calc(100vh-18rem)] lg:max-w-[220px] lg:overflow-y-auto lg:pr-1"
          style={{ animationDelay: "0.15s" }}
        >
          <RoomInfoPanel
            code={view.code}
            playerCount={view.players.length}
            isHost={view.isHost}
            onDelete={() => setPendingConfirm({ type: "delete" })}
            onAddBot={onAddBot}
          />
          <div className="werewolf-ancient-panel grid grid-cols-2 gap-2 p-3">
            <p className="werewolf-ancient-heading col-span-2 mb-1">Village Circle</p>
            {view.players.map((player) => (
              <div
                key={player.id}
                className="flex min-w-0 items-center gap-2 border-b border-amber-900/20 pb-2"
              >
                <span
                  className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 ${player.ready ? "border-amber-300" : "border-red-800"}`}
                >
                  {player.avatar ? (
                    <AvatarMedia avatar={player.avatar} sizes="36px" />
                  ) : (
                    <span
                      className="flex h-full items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-[11px] font-semibold text-[#dfcfaf]">
                    {player.name}
                    {player.isBot ? " · Bot" : ""}
                    {player.isHost ? " · Host" : ""}
                  </span>
                  <span
                    className={`block text-[8px] font-bold uppercase tracking-[0.12em] ${player.ready ? "text-amber-300" : "text-red-300"}`}
                  >
                    {player.ready ? "Sworn" : "Not sworn"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="animate-werewolf-fade-in pointer-events-auto flex w-full max-w-md flex-col gap-4 lg:fixed lg:right-6 lg:top-1/2 lg:max-w-[250px] lg:-translate-y-1/2"
          style={{ animationDelay: "0.2s" }}
        >
          <RoleDistributionPanel playerCount={view.players.length} />
          <ChatPanel entries={view.chat} onSend={onSendChat} />
        </div>
      </div>

      <div
        className="animate-werewolf-fade-in pointer-events-auto mx-auto flex w-full max-w-sm flex-col items-center gap-3 lg:fixed lg:bottom-5 lg:left-[15%] lg:z-20 lg:-translate-x-1/2"
        style={{ animationDelay: "0.25s" }}
      >
        <button
          type="button"
          onClick={() => onReady(!me?.ready)}
          disabled={isCountingDown}
          aria-pressed={Boolean(me?.ready)}
          className="group relative h-20 w-64 transition-transform enabled:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <Image
            src={
              me?.ready
                ? "/werewolf-game/system/not ready.png"
                : "/werewolf-game/system/ready-removebg.png"
            }
            alt={me?.ready ? "Not ready" : "Ready"}
            fill
            sizes="256px"
            className="object-contain"
          />
        </button>
      </div>

      {!view.isHost && (
        <button
          type="button"
          onClick={onLeave}
          className="animate-werewolf-fade-in pointer-events-auto mx-auto font-serif text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200/60 underline-offset-4 hover:text-amber-100 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{ animationDelay: "0.3s" }}
        >
          Leave room
        </button>
      )}

      {pendingConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lobby-confirm-title"
          className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPendingConfirm(null)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-[20px] border-2 border-amber-500/75 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.18),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(185,28,28,0.3),transparent_46%),linear-gradient(145deg,#100b08,#030304_58%,#180405)] px-8 py-8 text-center shadow-[inset_0_0_0_2px_#080202,inset_0_0_0_4px_rgba(153,27,27,0.28),0_24px_70px_rgba(0,0,0,0.85)]"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="pointer-events-none absolute inset-3 rounded-[13px] border border-red-900/65" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-400">
              Leave the circle?
            </p>
            <h2
              id="lobby-confirm-title"
              className="mt-2 font-serif text-xl font-black text-[#f0ddb7]"
            >
              {pendingConfirm.type === "delete"
                ? "Delete this room?"
                : `Remove ${pendingConfirm.playerName}?`}
            </h2>
            {pendingConfirm.type === "kick" && (
              <div className="relative mx-auto mt-4 h-24 w-24 overflow-hidden rounded-full border-2 border-red-500/80 bg-grey-950 shadow-[0_0_0_2px_#160505,0_0_20px_rgba(220,38,38,0.5)]">
                {pendingConfirm.playerAvatar ? (
                  <AvatarMedia
                    avatar={pendingConfirm.playerAvatar}
                    sizes="96px"
                    className="object-cover object-top"
                    alt={pendingConfirm.playerName}
                  />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center text-3xl font-black text-grey-950"
                    style={{ backgroundColor: pendingConfirm.playerColor }}
                  >
                    {pendingConfirm.playerName.slice(0, 1).toUpperCase() || "?"}
                  </span>
                )}
              </div>
            )}
            <p className="mx-auto mt-2 max-w-sm text-sm text-grey-400">
              {pendingConfirm.type === "delete"
                ? "Everyone will be removed and this gathering cannot be resumed."
                : "They will be removed from the campfire lobby."}
            </p>
            <div className="relative z-10 mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                aria-label="Stay"
                className="relative aspect-[3/1] w-44 transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <Image
                  src="/werewolf-game/system/stay-button.png"
                  alt="Stay"
                  fill
                  sizes="176px"
                  className="object-contain"
                />
              </button>
              <button
                type="button"
                aria-label={pendingConfirm.type === "delete" ? "Delete room" : "Remove player"}
                onClick={() => {
                  const action = pendingConfirm;
                  setPendingConfirm(null);
                  if (action.type === "delete") onDelete();
                  else onKick(action.playerId);
                }}
                className="relative aspect-[3/1] w-44 transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                {pendingConfirm.type === "delete" ? (
                  <Image
                    src="/werewolf-game/system/delete-room-button.png"
                    alt="Delete room"
                    fill
                    sizes="176px"
                    className="object-contain"
                  />
                ) : (
                  <Image
                    src="/werewolf-game/system/remove-button.png"
                    alt="Remove"
                    fill
                    sizes="176px"
                    className="object-contain"
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="House Rules"
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSettingsOpen(false)}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <SettingsPanel
              settings={view.settings}
              isHost={view.isHost}
              onChange={onUpdateSettings}
            />
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="mt-3 w-full rounded-sm border border-amber-900/50 bg-black/40 py-2 text-center font-serif text-text-sm font-semibold text-[#dfcfaf] transition-colors hover:border-amber-600/70 hover:bg-amber-950/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}

/** Live "time left" note for the discuss/vote timer — hidden when the setting is off. */
function PhaseTimerNote({ seconds }: { seconds: number | null }) {
  if (seconds === null) return null;
  return (
    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-400/80">
      {seconds > 0 ? `Time left: ${formatTimer(seconds)}` : "Time's up…"}
    </p>
  );
}

/** Shown when the host has turned on "show who voted for whom" — live during voting and after. */
function VoteDetailsList({
  voteDetails,
  players,
}: {
  voteDetails: Record<string, string> | null;
  players: PublicPlayer[];
}) {
  if (!voteDetails || Object.keys(voteDetails).length === 0) return null;
  const nameById = new Map(players.map((p) => [p.id, p.name]));
  return (
    <div className="werewolf-ancient-panel mx-auto flex w-full max-w-xs flex-col gap-1 p-3">
      <p className="werewolf-ancient-heading">Votes so far</p>
      {Object.entries(voteDetails).map(([voterId, targetId]) => (
        <p key={voterId} className="text-text-sm text-grey-300">
          <span className="font-semibold text-[#ead9b6]">{nameById.get(voterId) ?? "Someone"}</span>{" "}
          &rarr; {nameById.get(targetId) ?? "Someone"}
        </p>
      ))}
    </div>
  );
}

function WaitingCard({ text }: { text: string }) {
  return (
    <div className="relative isolate mx-auto flex w-full max-w-[650px] flex-col items-center gap-4 overflow-hidden rounded-[24px] border-2 border-amber-500/80 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.22),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(185,28,28,0.28),transparent_42%),linear-gradient(145deg,rgba(12,10,8,0.99),rgba(2,2,3,0.99)_55%,rgba(20,3,4,0.99))] px-7 py-9 text-center shadow-[inset_0_0_0_2px_#090302,inset_0_0_0_4px_rgba(245,158,11,0.22),inset_0_-24px_45px_rgba(127,29,29,0.2),0_0_28px_rgba(245,158,11,0.16),0_24px_45px_rgba(0,0,0,0.8)]">
      <Image
        src="/werewolf-game/icon-moon.png"
        alt=""
        width={42}
        height={42}
        className="h-10 w-10 opacity-80"
      />
      <p className="font-serif text-text-md text-[#ddd2c0]">{text}</p>
    </div>
  );
}

/** Role-name plaque with a circular avatar slot burned into its left edge — pinned to
 *  the top-left of the screen for every phase, for whichever role the viewer has. */
const ROLE_LABEL: Partial<Record<RoleId, string>> = {
  werewolf: "/werewolf-game/system/werewolf-role-lable.png",
  villager: "/werewolf-game/system/villeger-lable.png",
  hunter: "/werewolf-game/system/hunter-label.png",
  seer: "/werewolf-game/system/seer-label.png",
  doctor: "/werewolf-game/system/doctor-label.png",
};

function RoleBadge({ role, avatar, alive }: { role: RoleId; avatar?: string; alive: boolean }) {
  const labelSrc = ROLE_LABEL[role];
  return (
    <div className="mx-auto w-full max-w-sm lg:fixed lg:left-8 lg:top-6 lg:mx-0 lg:w-[400px]">
      {labelSrc ? (
        <div className="relative aspect-[4/1] w-full">
          <Image src={labelSrc} alt="" fill sizes="220px" className="object-cover" />
          {avatar && role !== "werewolf" && (
            <span className="absolute left-[9%] top-[40%] aspect-square h-[68%] -translate-y-1/2 overflow-hidden rounded-full">
              <AvatarMedia avatar={avatar} sizes="60px" />
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-sm border border-amber-900/45 bg-black/50 py-1.5 pl-1.5 pr-4 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur">
          <div className="h-10 w-10 shrink-0">
            <RolePortrait role={ROLES[role]} size={40} />
          </div>
          <p className="text-text-sm text-grey-400">
            Your hidden role:{" "}
            <span className="font-serif font-semibold text-[#ead9b6]">{ROLES[role].label}</span>
          </p>
        </div>
      )}
      {!alive && (
        <p className="mt-1 text-center text-[11px] text-grey-500 lg:text-left">
          Eliminated — you can still watch
        </p>
      )}
    </div>
  );
}

/** The wolves' victim-selection screen: role banner, framed avatar grid, and a
 *  two-step select-then-confirm hunt (matches the "Confirm the Hunt" reference). */
/** Select-then-confirm target picker — the seer/doctor/hunter counterpart to WolfHuntPanel's hunt UI. */
function ConfirmPickPanel({
  kicker,
  kickerClassName,
  title,
  players,
  onConfirm,
  confirmLabel = "Confirm",
}: {
  kicker: string;
  kickerClassName: string;
  title: string;
  players: PublicPlayer[];
  onConfirm: (id: string) => void;
  confirmLabel?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-4 rounded-[24px] border-2 border-amber-500/80 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.22),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(185,28,28,0.28),transparent_42%),linear-gradient(145deg,rgba(12,10,8,0.99),rgba(2,2,3,0.99)_55%,rgba(20,3,4,0.99))] px-[6%] py-10 shadow-[inset_0_0_0_2px_#090302,inset_0_0_0_4px_rgba(245,158,11,0.22),inset_0_-24px_45px_rgba(127,29,29,0.2),0_0_28px_rgba(245,158,11,0.16),0_24px_45px_rgba(0,0,0,0.8)]">
      <div className="text-center">
        <p className={`werewolf-stage-kicker ${kickerClassName}`}>{kicker}</p>
        <h2 className="werewolf-stage-title mt-1">{title}</h2>
      </div>
      <PlayerPickGrid players={players} onPick={setSelected} selectedId={selected} />
      <PrimaryButton onClick={() => selected && onConfirm(selected)} disabled={!selected}>
        {confirmLabel}
      </PrimaryButton>
    </div>
  );
}

function WolfHuntPanel({
  nightNumber,
  targets,
  onConfirm,
}: {
  nightNumber: number;
  targets: PublicPlayer[];
  onConfirm: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-5 rounded-[24px] border-2 border-amber-500/80 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.22),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(185,28,28,0.28),transparent_42%),linear-gradient(145deg,rgba(12,10,8,0.99),rgba(2,2,3,0.99)_55%,rgba(20,3,4,0.99))] px-[6%] py-10 shadow-[inset_0_0_0_2px_#090302,inset_0_0_0_4px_rgba(245,158,11,0.22),inset_0_-24px_45px_rgba(127,29,29,0.2),0_0_28px_rgba(245,158,11,0.16),0_24px_45px_rgba(0,0,0,0.8)]">
        <div className="text-center">
          <p className="werewolf-stage-kicker text-red-300">Night {nightNumber} &middot; Wolves</p>

          <h2 className="werewolf-stage-title mt-1">Choose tonight&apos;s victim</h2>
        </div>

        <PlayerPickGrid players={targets} onPick={setSelected} selectedId={selected} />
      </div>

      {/* Confirm Hunt */}
      <button
        type="button"
        disabled={!selected}
        onClick={() => selected && onConfirm(selected)}
        aria-label="Confirm the hunt"
        className="
        group
        relative mx-auto
        flex w-full max-w-xs
        shrink-0
        flex-col items-center
        gap-20

        transition-[filter]
        duration-300

        disabled:cursor-not-allowed
        disabled:opacity-40

        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-red-400

        lg:fixed
        lg:bottom-6
        lg:right-6
        lg:mx-0
      "
      >
        <Image
          src="/werewolf-game/system/hun_circle.png"
          alt=""
          width={100}
          height={100}
          className={`
          h-auto
          w-full
          object-contain
          transition-[filter]
          duration-300

          ${
            selected
              ? `
                group-hover:drop-shadow-[0_0_8px_rgba(255,0,0,1)]
                group-hover:drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]
              `
              : ""
          }
        `}
        />

        <Image
          src="/werewolf-game/system/confirm_hun.png"
          alt=""
          width={320}
          height={100}
          className={`
          -mt-40
          h-auto
          w-full
          object-contain
          transition-[filter]
          duration-300
        `}
        />
      </button>
    </>
  );
}

export function WerewolfOnline({ code }: { code?: string }) {
  const reduced = useReducedMotion() ?? false;
  const o = useWerewolfOnline(code);
  const router = useRouter();
  const [detailsForResult, setDetailsForResult] = useState<string | null>(null);
  const phaseTimer = usePhaseTimer(o.view?.phaseStartedAt ?? null, phaseCooldownFor(o.view));

  // A direct link to a room (/werewolf/online/[code]) with no saved session for it — send the
  // visitor to the room list to pick a name/avatar and join, instead of joining here. Checked
  // with the synchronous peek (not the hook's deliberately-deferred restore) so a session that
  // was just saved (e.g. right after creating the room) isn't redirected away from under itself.
  const hasJoinedRef = useRef(false);
  useEffect(() => {
    if (o.joined) hasJoinedRef.current = true;
  }, [o.joined]);
  useEffect(() => {
    // Once this tab has actually joined, leaving is handled entirely by leaveRoom's own
    // redirect — skip this one so a just-cleared token doesn't bounce back here with the
    // old room's code still attached (which would pop the join modal open again).
    if (
      o.storageReady &&
      code &&
      !o.joined &&
      !hasJoinedRef.current &&
      !peekParticipantToken(code)
    ) {
      router.replace(`/werewolf/rooms?code=${code}`);
    }
  }, [code, o.joined, o.storageReady, router]);

  if (!o.joined) {
    if (code) return <LoadingScreen />;
    return <LandingScreen />;
  }

  if (!o.view) return <LoadingScreen />;
  const view = o.view;

  if (view.phase === "lobby" || view.phase === "countdown") {
    return (
      <LobbyScreen
        view={view}
        onStart={o.start}
        onLeave={o.leaveRoom}
        onDelete={o.deleteRoom}
        onSendChat={o.sendChat}
        onReady={o.setReady}
        onUpdateSettings={o.updateSettings}
        onKick={o.kickPlayer}
        onAddBot={o.addBot}
      />
    );
  }

  const alive = view.players.filter((p) => p.alive);
  const wolvesRemaining = view.wolvesRemaining;
  const isNight = NIGHT_PHASES.includes(view.phase);
  const you = view.you;
  const currentResultKey =
    view.phase === "over" ? (view.phaseStartedAt ?? `${view.winner}-${view.nightNumber}`) : null;
  const showingResultReveal = currentResultKey !== null && detailsForResult !== currentResultKey;

  function renderStage(): React.ReactNode {
    switch (view.phase) {
      case "night-wolf": {
        if (you?.alive && you.role === "werewolf") {
          const targets = alive.filter((p) => !p.isYou);
          return (
            <div className="flex flex-col items-center gap-2">
              <WolfHuntPanel
                nightNumber={view.nightNumber}
                targets={targets}
                onConfirm={o.chooseWolfTarget}
              />
              <PhaseTimerNote seconds={phaseTimer} />
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center gap-3">
            <WaitingCard text={NIGHT_WAITING_TEXT} />
            <PhaseTimerNote seconds={phaseTimer} />
          </div>
        );
      }

      case "night-seer": {
        if (you?.alive && you.role === "seer") {
          if (view.seerVision) {
            const v = view.seerVision;
            return (
              <div className="relative isolate mx-auto flex w-full max-w-[650px] flex-col items-center gap-4 overflow-hidden rounded-[24px] border-2 border-amber-500/80 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.22),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(185,28,28,0.28),transparent_42%),linear-gradient(145deg,rgba(12,10,8,0.99),rgba(2,2,3,0.99)_55%,rgba(20,3,4,0.99))] px-6 py-8 text-center shadow-[inset_0_0_0_2px_#090302,inset_0_0_0_4px_rgba(245,158,11,0.22),inset_0_-24px_45px_rgba(127,29,29,0.2),0_0_28px_rgba(245,158,11,0.16),0_24px_45px_rgba(0,0,0,0.8)]">
                <p className="werewolf-stage-kicker text-violet-300">Vision</p>
                <RolePortrait role={ROLES.seer} size={80} />
                <p className="text-text-md text-grey-100">
                  <span className="font-bold">{v.targetName}</span> is{" "}
                  <span
                    className={
                      v.isWerewolf ? "font-bold text-[#ff5a8a]" : "font-bold text-aster-teal-300"
                    }
                  >
                    {v.isWerewolf ? "a Werewolf" : "not a Werewolf"}
                  </span>
                  .
                </p>
                <PrimaryButton onClick={o.continueSeer}>Continue</PrimaryButton>
                <PhaseTimerNote seconds={phaseTimer} />
              </div>
            );
          }
          const targets = alive.filter((p) => p.role !== "seer");
          return (
            <div className="flex flex-col items-center gap-2">
              <ConfirmPickPanel
                kicker={`Night ${view.nightNumber} · Seer`}
                kickerClassName="text-violet-300"
                title="Peer into someone's nature"
                players={targets}
                onConfirm={o.chooseSeerTarget}
                confirmLabel="Confirm the reading"
              />
              <PhaseTimerNote seconds={phaseTimer} />
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center gap-3">
            <WaitingCard text={NIGHT_WAITING_TEXT} />
            <PhaseTimerNote seconds={phaseTimer} />
          </div>
        );
      }

      case "night-doctor": {
        if (you?.alive && you.role === "doctor") {
          const lastProtected = view.players.find((p) => p.id === view.doctorLastProtectId);
          const targets = alive.filter((p) => p.id !== view.doctorLastProtectId);
          return (
            <div className="flex flex-col items-center gap-2">
              <ConfirmPickPanel
                kicker={`Night ${view.nightNumber} · Doctor`}
                kickerClassName="text-emerald-300"
                title="Choose someone to protect"
                players={targets}
                onConfirm={o.chooseDoctorTarget}
                confirmLabel="Confirm the protection"
              />
              {lastProtected && (
                <p className="text-center text-[11px] text-grey-500">
                  You protected {lastProtected.name} last night — pick someone else tonight.
                </p>
              )}
              <PhaseTimerNote seconds={phaseTimer} />
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center gap-3">
            <WaitingCard text={NIGHT_WAITING_TEXT} />
            <PhaseTimerNote seconds={phaseTimer} />
          </div>
        );
      }

      case "dawn":
        return (
          <AnnouncementPanel
            title={`Night ${view.nightNumber}`}
            message={view.message}
            revealedPlayer={view.players.find((p) => p.id === view.lastNightKilledId)}
            onContinue={o.continueDawn}
            continueLabel="Gather the village"
          />
        );

      case "hunter-revenge": {
        if (you?.id === view.hunterRevengeFor) {
          return (
            <div className="flex flex-col items-center gap-3">
              <ConfirmPickPanel
                kicker="Your final shot"
                kickerClassName="text-orange-300"
                title="Take one more with you"
                players={alive}
                onConfirm={o.chooseHunterTarget}
                confirmLabel="Confirm the shot"
              />
            </div>
          );
        }
        return <WaitingCard text="The Hunter takes aim with their final shot…" />;
      }

      case "day-discuss": {
        return (
          <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center justify-center gap-4">
            <div className="relative isolate flex w-full min-w-0 max-w-[1000px] flex-col items-center overflow-hidden rounded-[24px] border-2 border-[#8b633c] bg-[radial-gradient(circle_at_50%_0%,rgba(105,70,35,0.28),transparent_38%),linear-gradient(145deg,rgba(38,27,18,0.98),rgba(12,10,8,0.99)_58%,rgba(29,18,12,0.98))] px-[5%] py-10 text-center shadow-[inset_0_0_0_2px_#160e09,inset_0_0_0_4px_rgba(190,132,70,0.24),inset_0_0_50px_rgba(0,0,0,0.8),0_24px_45px_rgba(0,0,0,0.75)] sm:px-[6%] sm:py-12">
              <span className="pointer-events-none absolute inset-3 -z-10 rounded-[16px] border border-[#76502f]/70" />
              <span className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
              <span className="pointer-events-none absolute inset-x-[8%] bottom-0 h-px bg-gradient-to-r from-transparent via-red-800/60 to-transparent" />

              <div className="flex items-center justify-center gap-2 font-serif text-[11px] font-black uppercase tracking-[0.18em] text-amber-300 sm:text-sm">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-amber-600/70" />
                Day {view.nightNumber}
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-amber-600/70" />
              </div>
              <h2 className="mt-1 font-serif text-[15px] font-black uppercase tracking-[0.05em] text-[#ead9b6] drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] sm:text-xl">
                Discuss who the wolves might be
              </h2>
              <p className="mt-0.5 text-[9px] text-grey-400 sm:text-xs">
                Talk it over before the village votes.
              </p>

              <div className="relative mt-2 flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/70 bg-[#130d08]/95 font-serif text-sm font-black text-amber-300 shadow-[inset_0_0_0_3px_#080706,0_0_0_2px_#68431e,0_0_15px_rgba(218,142,38,0.25)] sm:h-16 sm:w-16 sm:text-lg">
                <span className="absolute -inset-2 -z-10 rounded-full border border-amber-900/60" />
                {phaseTimer === null ? "∞" : formatTimer(Math.max(phaseTimer, 0))}
              </div>

              <div className="mt-3 flex w-full max-w-[867px] flex-wrap justify-center gap-1 px-0.5 pb-1 sm:gap-2">
                {alive.map((p) => (
                  <div
                    key={p.id}
                    className="relative flex aspect-[1082/1454] w-[117px] max-w-[calc(20%-0.4rem)] min-w-0 flex-col items-center justify-center bg-black/40 px-[12%] py-[13%] shadow-[0_4px_12px_rgba(0,0,0,0.45)] sm:max-w-[117px]"
                  >
                    <Image
                      src="/werewolf-game/system/select-avatar-frame.png"
                      alt=""
                      fill
                      sizes="120px"
                      className="pointer-events-none z-10 object-fill"
                    />
                    <div className="absolute left-1/2 top-[17%] z-30 aspect-square w-[56%] -translate-x-1/2 overflow-hidden rounded-full border border-amber-500/80 bg-grey-950 shadow-[0_0_0_2px_#0a0806,0_0_12px_rgba(180,72,28,0.45)]">
                      {p.avatar ? (
                        <AvatarMedia
                          avatar={p.avatar}
                          sizes="72px"
                          className="z-30 object-cover object-top"
                        />
                      ) : (
                        <span
                          className="flex h-full w-full items-center justify-center font-bold text-grey-950"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.name.slice(0, 1).toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <p className="absolute bottom-[19%] left-1/2 z-30 w-[72%] -translate-x-1/2 truncate font-serif text-[9px] font-bold text-[#ead9b6] sm:text-[11px]">
                      {p.name}
                    </p>
                    <span className="absolute bottom-[13%] left-1/2 z-30 block h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
                  </div>
                ))}
              </div>

              <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-[#95612f]/80 to-transparent" />
              <button
                type="button"
                onClick={o.continueDiscuss}
                aria-label="Proceed to vote"
                className="relative mt-3 aspect-[3/1] w-56 transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <Image
                  src="/werewolf-game/system/proceed-to-vote-button.png"
                  alt="Proceed to vote"
                  fill
                  sizes="224px"
                  className="object-contain"
                />
              </button>
              <p className="mt-1.5 text-[9px] text-[#b39a74] sm:text-[10px]">Continue discussing</p>
            </div>

            <aside
              className="w-full max-w-sm shrink-0 lg:fixed lg:right-6 lg:top-1/2 lg:z-20 lg:w-[250px] lg:-translate-y-1/2"
              aria-label="Village chat"
            >
              <ChatPanel entries={view.chat} onSend={o.sendChat} title="Village Chat" />
            </aside>
          </div>
        );
      }

      case "day-vote": {
        if (you?.alive && !view.youHaveVoted) {
          const targets = alive.filter((p) => p.id !== you.id);
          return (
            <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-4 rounded-[24px] border-2 border-[#8b633c] bg-[radial-gradient(circle_at_50%_0%,rgba(105,70,35,0.28),transparent_38%),linear-gradient(145deg,rgba(38,27,18,0.98),rgba(12,10,8,0.99)_58%,rgba(29,18,12,0.98))] px-[6%] py-10 shadow-[inset_0_0_0_2px_#160e09,inset_0_0_0_4px_rgba(190,132,70,0.24),inset_0_0_50px_rgba(0,0,0,0.8),0_24px_45px_rgba(0,0,0,0.75)]">
              <div className="text-center">
                <p className="werewolf-stage-kicker text-amber-300">
                  {view.votesIn} of {view.votesNeeded} voted
                </p>
                <h2 className="werewolf-stage-title mt-1">Who do you accuse?</h2>
                <PhaseTimerNote seconds={phaseTimer} />
              </div>
              <PlayerPickGrid players={targets} onPick={o.castVote} />
              <VoteDetailsList voteDetails={view.voteDetails} players={view.players} />
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center gap-3">
            <WaitingCard
              text={
                you?.alive
                  ? `Waiting for the rest of the village to vote (${view.votesIn}/${view.votesNeeded})…`
                  : "The dead don't vote — watch and wait."
              }
            />
            <PhaseTimerNote seconds={phaseTimer} />
            <VoteDetailsList voteDetails={view.voteDetails} players={view.players} />
          </div>
        );
      }

      case "day-runoff": {
        const candidate = view.players.find((p) => p.id === view.runoffCandidateId);
        if (you?.alive && !view.youHaveVotedRunoff) {
          return (
            <div className="werewolf-game-stage werewolf-game-stage--day mx-auto flex w-full max-w-sm flex-col items-center gap-4 px-6 py-7 text-center">
              <p className="werewolf-stage-kicker text-amber-300">
                {view.runoffVotesIn} of {view.runoffVotesNeeded} voted
              </p>
              <h2 className="werewolf-stage-title mt-1">
                Cast out {candidate?.name ?? "the accused"}?
              </h2>
              {candidate && (
                <div className="relative aspect-[1082/1454] w-[160px] bg-black/40 shadow-[0_4px_14px_rgba(0,0,0,0.55)]">
                  <Image
                    src="/werewolf-game/system/select-avatar-frame.png"
                    alt=""
                    fill
                    sizes="160px"
                    className="pointer-events-none z-10 object-fill"
                  />
                  <div className="absolute left-1/2 top-[15%] z-20 aspect-square w-[64%] -translate-x-1/2 overflow-hidden rounded-full border border-red-400/90 bg-grey-950 shadow-[0_0_0_2px_#0a0806,0_0_16px_rgba(239,68,68,0.65)]">
                    {candidate.avatar ? (
                      <AvatarMedia
                        avatar={candidate.avatar}
                        sizes="104px"
                        className="object-cover object-top"
                        alt={candidate.name}
                      />
                    ) : (
                      <span
                        className="flex h-full w-full items-center justify-center font-bold text-grey-950"
                        style={{ backgroundColor: candidate.color }}
                      >
                        {candidate.name.slice(0, 1).toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <p className="absolute bottom-[18%] left-1/2 z-20 w-[72%] -translate-x-1/2 truncate font-serif text-[10px] font-bold text-[#ead9b6]">
                    {candidate.name}
                  </p>
                </div>
              )}
              <div className="mt-6 flex w-full justify-center gap-3 px-4">
                <button
                  type="button"
                  onClick={() => o.castRunoffVote(true)}
                  aria-label="Yes, cast out"
                  className="relative aspect-[3/1] w-[46%] max-w-52 transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <Image
                    src="/werewolf-game/system/yes-cast-out-button.png"
                    alt="Yes, cast out"
                    fill
                    sizes="208px"
                    className="object-contain"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => o.castRunoffVote(false)}
                  aria-label="No, spare them"
                  className="relative aspect-[3/1] w-[46%] max-w-52 transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <Image
                    src="/werewolf-game/system/no-spare-button.png"
                    alt="No, spare them"
                    fill
                    sizes="208px"
                    className="object-contain"
                  />
                </button>
              </div>
            </div>
          );
        }
        return (
          <WaitingCard
            text={
              you?.alive
                ? `Waiting for the rest of the verdict (${view.runoffVotesIn}/${view.runoffVotesNeeded})…`
                : "The dead don't vote — watch and wait."
            }
          />
        );
      }

      case "day-result":
        return (
          <AnnouncementPanel
            title="The village has spoken"
            message={view.message}
            revealedPlayer={view.players.find((p) => p.id === view.dayEliminatedId)}
            onContinue={o.continueDayResult}
          />
        );

      case "over": {
        const resultKey = view.phaseStartedAt ?? `${view.winner}-${view.nightNumber}`;
        const showGameDetails = detailsForResult === resultKey;
        const hunterName = view.players.find((player) => player.role === "hunter")?.name;
        const deathDetailFor = (player: PublicPlayer): string | null => {
          let roundNumber: number | null = null;
          for (const entry of view.gameLog) {
            const roundMatch = entry.label.match(/(?:Night|Day)\s+(\d+)/i);
            if (roundMatch) roundNumber = Number(roundMatch[1]);
            if (!entry.text.includes(player.name)) continue;

            if (entry.text.includes("was found dead")) {
              return `Killed by the Werewolves${roundNumber ? ` · Night ${roundNumber}` : ""}`;
            }
            if (entry.text.includes("village casts out")) {
              return `Cast out by the Village${roundNumber ? ` · Day ${roundNumber}` : ""}`;
            }
            if (entry.text.includes("Hunter's last shot fells")) {
              return `${hunterName ? `Killed by ${hunterName}` : "Killed by the Hunter"}${
                roundNumber ? ` · ${entry.phase === "night" ? "Night" : "Day"} ${roundNumber}` : ""
              }`;
            }
          }
          return player.alive ? null : "Eliminated earlier";
        };

        if (!showGameDetails) {
          const werewolvesWon = view.winner === "werewolf";
          const winnerLabel = werewolvesWon ? "The Werewolves Prevail" : "The Village Survives";
          return (
            <div className="relative isolate flex h-full min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-black shadow-[inset_0_0_120px_rgba(0,0,0,0.95)]">
              <motion.div
                aria-hidden
                initial={reduced ? false : { opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 0.75, 0.3], scale: [0.2, 1.1, 1.45] }}
                transition={{ duration: 2.2, ease: "easeOut" }}
                className={`absolute aspect-square w-[75%] rounded-full blur-3xl ${werewolvesWon ? "bg-red-700/35" : "bg-amber-400/25"}`}
              />

              <motion.div
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: reduced ? 0 : 1.35, times: [0, 0.45, 1] }}
                className="absolute z-20 font-serif text-lg font-black uppercase tracking-[0.35em] text-[#ead9b6] drop-shadow-[0_0_18px_rgba(245,158,11,0.8)] sm:text-3xl"
              >
                The final fate is sealed
              </motion.div>

              <motion.div
                initial={reduced ? false : { opacity: 0, scale: 1.12, filter: "blur(12px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ delay: reduced ? 0 : 1.15, duration: 1.2, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={
                    werewolvesWon
                      ? "/werewolf-game/system/game-over-werewolf.png"
                      : "/werewolf-game/system/game-over-villager.png"
                  }
                  alt={winnerLabel}
                  fill
                  priority
                  sizes="(max-width: 1200px) 100vw, 1180px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/25" />
              </motion.div>

              <motion.div
                initial={reduced ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduced ? 0 : 2.15, duration: 0.65 }}
                className="relative z-30 mt-auto flex flex-col items-center gap-3 px-4 pb-8 pt-72 sm:pb-10 sm:pt-96"
              >
                <p className="font-serif text-xl font-black uppercase tracking-[0.12em] text-[#f1dfbd] drop-shadow-[0_3px_8px_#000] sm:text-3xl">
                  {winnerLabel}
                </p>
                <button
                  type="button"
                  onClick={() => setDetailsForResult(resultKey)}
                  className={`rounded-md border-2 px-8 py-3 font-serif text-sm font-black uppercase tracking-[0.15em] text-[#f7ead0] shadow-[inset_0_0_0_2px_#160b08,0_0_22px_rgba(0,0,0,0.75)] transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:text-base ${
                    werewolvesWon
                      ? "border-red-500/90 bg-gradient-to-b from-[#8d251d] to-[#2a0808]"
                      : "border-amber-400/90 bg-gradient-to-b from-[#8a6426] to-[#2c1707]"
                  }`}
                >
                  See Game Details
                </button>
              </motion.div>
            </div>
          );
        }

        return (
          <div className="relative isolate mx-auto flex w-full max-w-[1000px] flex-col items-center gap-3 overflow-hidden rounded-[24px] border-2 border-amber-500/80 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.22),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(185,28,28,0.28),transparent_42%),linear-gradient(145deg,rgba(12,10,8,0.99),rgba(2,2,3,0.99)_55%,rgba(20,3,4,0.99))] px-[4%] py-6 text-center shadow-[inset_0_0_0_2px_#090302,inset_0_0_0_4px_rgba(245,158,11,0.22),inset_0_-24px_45px_rgba(127,29,29,0.2),0_0_28px_rgba(245,158,11,0.16),0_24px_45px_rgba(0,0,0,0.8)] sm:py-8">
            <span className="pointer-events-none absolute inset-3 -z-10 rounded-[16px] border border-red-800/60" />
            <span className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
            <span className="pointer-events-none absolute inset-x-[8%] bottom-0 h-px bg-gradient-to-r from-transparent via-red-800/60 to-transparent" />
            <p className="werewolf-stage-kicker text-amber-300">Game over</p>
            <h2 className="font-serif text-heading-lg font-black text-[#ead9b6]">
              {view.winner ? TEAM_LABEL[view.winner] : ""} win{view.winner === "village" ? "s" : ""}
              !
            </h2>
            <div className="grid w-full max-w-[760px] grid-cols-2 gap-1 sm:grid-cols-5">
              {view.players.map((p) => {
                const isWinner = Boolean(
                  view.winner && p.role && ROLES[p.role].team === view.winner,
                );
                const deathDetail = deathDetailFor(p);
                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col items-center gap-0.5 rounded-xl p-2 transition ${
                      isWinner
                        ? view.winner === "werewolf"
                          ? "werewolf-winner-celebrate werewolf-winner-celebrate--wolf border-2 border-red-600/90 bg-red-950/20 shadow-[inset_0_0_0_2px_#210706,0_0_20px_rgba(220,38,38,0.55)]"
                          : "werewolf-winner-celebrate werewolf-winner-celebrate--village border-2 border-amber-400/90 bg-amber-950/20 shadow-[inset_0_0_0_2px_#241707,0_0_20px_rgba(251,191,36,0.5)]"
                        : "border-2 border-transparent"
                    } ${p.alive || isWinner ? "" : "opacity-55"}`}
                  >
                    {isWinner && (
                      <span className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-amber-400/70 bg-[#231307] px-2 py-0.5 font-serif text-[9px] font-black uppercase tracking-[0.14em] text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.45)]">
                        Winner
                      </span>
                    )}
                    <div
                      className={`relative h-32 w-32 overflow-hidden rounded-full bg-transparent transition ${
                        p.alive ? "" : "grayscale contrast-75 brightness-50"
                      }`}
                    >
                      {p.avatar ? (
                        <AvatarMedia
                          avatar={p.avatar}
                          sizes="128px"
                          className="object-cover object-top"
                          alt={p.name}
                        />
                      ) : (
                        <span
                          className="flex h-full w-full items-center justify-center text-4xl font-black text-grey-950"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.name.slice(0, 1).toUpperCase() || "?"}
                        </span>
                      )}
                      {!p.alive && (
                        <span
                          aria-label={`${p.name} was eliminated`}
                          className="absolute inset-0 z-30 block"
                        >
                          <span className="absolute left-1/2 top-1/2 h-[7px] w-[125%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full border border-grey-950 bg-grey-300/85 shadow-[0_0_4px_#000]" />
                          <span className="absolute left-1/2 top-1/2 h-[7px] w-[125%] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full border border-grey-950 bg-grey-300/85 shadow-[0_0_4px_#000]" />
                        </span>
                      )}
                    </div>
                    <p
                      className={`truncate text-[11px] font-semibold ${
                        p.alive ? "text-grey-200" : "text-grey-500 line-through"
                      }`}
                    >
                      {p.name}
                    </p>
                    {p.role && (
                      <p className="font-serif text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300/80">
                        {ROLES[p.role].label}
                      </p>
                    )}
                    {deathDetail && (
                      <p className="max-w-[150px] text-center font-serif text-[9px] leading-tight text-grey-500">
                        {deathDetail}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {view.isHost ? (
              <div className="mt-1 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={o.playAgain}
                  aria-label="Play again"
                  className="relative aspect-[3/1] w-48 transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <Image
                    src="/werewolf-game/system/play-again-button.png"
                    alt="Play again"
                    fill
                    sizes="192px"
                    className="object-contain"
                  />
                </button>
                <button
                  type="button"
                  onClick={o.newPlayers}
                  aria-label="Back to lobby"
                  className="relative aspect-[3/1] w-48 transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <Image
                    src="/werewolf-game/system/back-to-lobby-button.png"
                    alt="Back to lobby"
                    fill
                    sizes="192px"
                    className="object-contain"
                  />
                </button>
              </div>
            ) : (
              <p className="text-text-sm text-grey-400">
                Waiting for the host to start a new game…
              </p>
            )}
            <button
              type="button"
              onClick={o.leaveRoom}
              aria-label="Quit room"
              className="relative aspect-[3/1] w-48 transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Image
                src="/werewolf-game/system/quite-room-button.png"
                alt="Quit room"
                fill
                sizes="192px"
                className="object-contain"
              />
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  }

  return (
    <Shell
      backdrop={BACKDROP[view.phase]}
      extraWide={[
        "day-discuss",
        "day-vote",
        "night-wolf",
        "night-seer",
        "night-doctor",
        "hunter-revenge",
        "dawn",
        "day-result",
        "over",
      ].includes(view.phase)}
    >
      <header
        className={`werewolf-phase-header flex items-center justify-center gap-3 text-center ${isNight ? "werewolf-phase-header--night" : "werewolf-phase-header--day"}`}
      >
        <PhaseIndicator isNight={isNight} />
        <div>
          <h1 className="font-serif text-heading-sm font-black tracking-[0.04em] text-[#ead9b6]">
            Werewolves of Aster Village
          </h1>
          <p className="text-text-sm text-grey-400">
            {alive.length} alive
            {wolvesRemaining !== null && (
              <>
                {" "}
                &middot; {wolvesRemaining} {wolvesRemaining === 1 ? "wolf" : "wolves"} remain
                {wolvesRemaining === 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>
      </header>

      {you?.role && (
        <RoleBadge
          role={you.role}
          avatar={view.players.find((p) => p.isYou)?.avatar}
          alive={you.alive}
        />
      )}

      <div className="mx-auto w-full max-w-sm lg:fixed lg:left-6 lg:top-40 lg:w-[220px]">
        <GameLogPanel entries={view.gameLog} />
      </div>

      {view.wolfChat !== null && view.phase !== "day-discuss" && (
        <div className="mx-auto w-full max-w-sm lg:fixed lg:right-6 lg:top-40 lg:w-[220px]">
          <ChatPanel entries={view.wolfChat} onSend={o.sendWolfChat} title="Wolf Den" />
        </div>
      )}

      <motion.div
        key={view.phase}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex flex-1 flex-col justify-center ${
          showingResultReveal ? "fixed inset-0 z-50" : ""
        }`}
      >
        {renderStage()}
      </motion.div>

      {view.phase !== "over" && (
        <p
          aria-live="polite"
          className="mx-auto max-w-md border-t border-amber-900/30 px-4 pt-3 text-center font-serif text-[11px] tracking-[0.04em] text-grey-400"
        >
          {view.message}
        </p>
      )}
    </Shell>
  );
}
