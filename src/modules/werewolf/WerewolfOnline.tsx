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
import { PlayerPickGrid, PlayerSeat } from "./components/PlayerSeat";
import { WerewolfLoadingScreen } from "./components/WerewolfLoadingScreen";
import { avatarVideoFor } from "./avatar-media";
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
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col gap-5 p-6 ${wide ? "max-w-5xl" : "max-w-2xl"} ${backdropInteractive ? "pointer-events-none" : ""}`}
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
}: {
  code: string;
  playerCount: number;
  isHost: boolean;
  onDelete: () => void;
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
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete this room? Everyone will be removed from it.")) {
              onDelete();
            }
          }}
          className="mt-1 border-t border-amber-900/25 pt-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-red-400/75 hover:text-red-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
        >
          Delete room
        </button>
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
  werewolf: "/werewolf-game/system/werewolf-role-removebg.png",
  hunter: "/werewolf-game/system/hunter_role-removebg.png",
  seer: "/werewolf-game/system/seer_role-removebg.png",
  villager: "/werewolf-game/system/villeger.png",
  doctor: "/werewolf-game/system/doctor.png",
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
                  {avatarVideoFor(p.avatar) ? (
                    <video
                      src={avatarVideoFor(p.avatar)}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  ) : p.avatar ? (
                    <Image src={p.avatar} alt="" fill sizes="60px" className="object-cover object-top" />
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
                    onClick={() => {
                      if (window.confirm(`Remove ${p.name} from the room?`)) {
                        onKick(p.id);
                      }
                    }}
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
}: {
  view: PublicRoom;
  onStart: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onSendChat: (text: string) => void;
  onReady: (ready: boolean) => void;
  onUpdateSettings: (patch: Partial<RoomSettings>) => void;
  onKick: (playerId: string) => void;
}) {
  const me = view.players.find((p) => p.isYou);
  const allReady = view.players.length >= MIN_PLAYERS && view.players.every((p) => p.ready);
  const isCountingDown = view.phase === "countdown" && Boolean(view.countdownEndsAt);
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <Shell
      wide
      backHref="/werewolf/rooms"
      stackLeft
      backdropInteractive
      backdropContent={
        <CampfireCircle players={view.players} isHost={view.isHost} onKick={onKick} />
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
            onDelete={onDelete}
          />
          <GameLogPanel entries={view.gameLog} />
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
                    <Image
                      src={player.avatar}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover object-top"
                    />
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
          <span className="absolute inset-x-7 bottom-1 top-3 -z-10 rounded-sm border border-amber-900/45 bg-black/55 shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition group-enabled:group-hover:border-amber-600/70" />
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
    <div className="werewolf-game-stage werewolf-game-stage--night mx-auto flex w-full max-w-sm flex-col items-center gap-4 px-7 py-9 text-center">
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
              <Image src={avatar} alt="" fill sizes="60px" className="object-cover object-top" />
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
    <div className="werewolf-game-stage werewolf-game-stage--night mx-auto flex w-full max-w-sm flex-col gap-4 px-6 py-7">
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
      <div className="werewolf-game-stage werewolf-game-stage--danger mx-auto flex w-full max-w-2xl flex-col gap-5 px-6 py-7">
        <div className="text-center">
          <p className="werewolf-stage-kicker text-red-300">Night {nightNumber} &middot; Wolves</p>

          <h2 className="werewolf-stage-title mt-1">Choose tonight&apos;s victim</h2>
        </div>

        {/* Victim List */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
          {targets.map((p) => {
            const isSelected = selected === p.id;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                aria-pressed={isSelected}
                className={`
                group
                flex w-[100px] shrink-0
                flex-col items-center gap-1
                rounded-lg p-1
                transition

                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-red-400

                ${isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"}
              `}
              >
                <div className="relative aspect-[3/4] w-full">
                  <span className="absolute inset-[2%] overflow-visible bg-transparent">
                    <Image
                      src={p.avatar}
                      alt={p.name}
                      fill
                      sizes="200px"
                      className={`
                      bg-transparent
                      object-contain
                      transition-[filter]
                      duration-300

                      group-hover:drop-shadow-[0_0_8px_rgba(255,0,0,1)]
                      group-hover:drop-shadow-[0_0_18px_rgba(255,0,0,0.9)]

                      ${
                        isSelected
                          ? `
                            drop-shadow-[0_0_8px_rgba(255,0,0,1)]
                            drop-shadow-[0_0_18px_rgba(255,0,0,0.9)]
                          `
                          : ""
                      }
                    `}
                    />
                  </span>
                  {p.role === "werewolf" && (
                    <span
                      className="absolute -right-1 -top-1 h-6 w-6 overflow-hidden rounded-full border border-red-900/60 bg-grey-950"
                      title="Fellow werewolf"
                    >
                      <Image
                        src="/werewolf-game/system/wolf-icon.png"
                        alt="Fellow werewolf"
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </span>
                  )}
                </div>

                <span
                  className={`
                  w-full truncate text-center
                  text-[11px] font-semibold
                  transition-colors duration-300

                  ${isSelected ? "text-red-300" : "text-[#ead9b6] group-hover:text-red-300"}
                `}
                >
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
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
      />
    );
  }

  const alive = view.players.filter((p) => p.alive);
  const wolvesRemaining = view.wolvesRemaining;
  const isNight = NIGHT_PHASES.includes(view.phase);
  const you = view.you;

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
              <div className="werewolf-game-stage werewolf-game-stage--night mx-auto flex w-full max-w-sm flex-col items-center gap-4 px-6 py-8 text-center">
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
            deadRole={(() => {
              const r = view.players.find((p) => p.id === view.lastNightKilledId)?.role;
              return r ? ROLES[r] : undefined;
            })()}
            onContinue={o.continueDawn}
            continueLabel="Gather the village"
          />
        );

      case "hunter-revenge": {
        if (you?.id === view.hunterRevengeFor) {
          return (
            <div className="flex flex-col items-center gap-3">
              <RolePortrait role={ROLES.hunter} size={72} />
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

      case "day-discuss":
        return (
          <div className="werewolf-game-stage werewolf-game-stage--day mx-auto flex w-full max-w-sm flex-col gap-4 px-6 py-7">
            <div className="text-center">
              <p className="werewolf-stage-kicker text-amber-300">Day</p>
              <h2 className="werewolf-stage-title mt-1">Discuss who the wolves might be</h2>
              <p className="mt-1 text-text-sm text-grey-400">Talk it over, then move to a vote.</p>
              <PhaseTimerNote seconds={phaseTimer} />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {alive.map((p) => (
                <PlayerSeat key={p.id} player={p} />
              ))}
            </div>
            <PrimaryButton onClick={o.continueDiscuss}>Proceed to vote</PrimaryButton>
          </div>
        );

      case "day-vote": {
        if (you?.alive && !view.youHaveVoted) {
          const targets = alive.filter((p) => p.id !== you.id);
          return (
            <div className="werewolf-game-stage werewolf-game-stage--day mx-auto flex w-full max-w-sm flex-col gap-4 px-6 py-7">
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
              <div className="mt-2 flex justify-center gap-3">
                <PrimaryButton onClick={() => o.castRunoffVote(true)}>Yes, cast out</PrimaryButton>
                <button
                  type="button"
                  onClick={() => o.castRunoffVote(false)}
                  className="rounded-sm border border-amber-900/50 bg-black/35 px-7 py-3 font-serif text-text-md font-semibold text-[#dfcfaf] transition-colors hover:border-amber-600/70 hover:bg-amber-950/20 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  No, spare them
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
            deadRole={(() => {
              const r = view.players.find((p) => p.id === view.dayEliminatedId)?.role;
              return r ? ROLES[r] : undefined;
            })()}
            onContinue={o.continueDayResult}
          />
        );

      case "over":
        return (
          <div className="werewolf-game-stage werewolf-game-stage--result mx-auto flex w-full max-w-md flex-col items-center gap-5 px-8 py-8 text-center">
            <p className="werewolf-stage-kicker text-amber-300">Game over</p>
            <h2 className="font-serif text-heading-lg font-black text-[#ead9b6]">
              {view.winner ? TEAM_LABEL[view.winner] : ""} win{view.winner === "village" ? "s" : ""}
              !
            </h2>
            <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
              {view.players.map((p) => (
                <div
                  key={p.id}
                  className={`flex flex-col items-center gap-1 rounded-sm border p-2 ${
                    p.alive
                      ? "border-amber-900/45 bg-black/40"
                      : "border-grey-800/50 bg-black/20 opacity-55"
                  }`}
                >
                  {p.role && <RolePortrait role={ROLES[p.role]} size={56} />}
                  <p className="truncate text-[11px] font-semibold text-grey-200">{p.name}</p>
                </div>
              ))}
            </div>
            {view.isHost ? (
              <div className="mt-1 flex justify-center gap-3">
                <PrimaryButton onClick={o.playAgain}>Play again</PrimaryButton>
                <button
                  type="button"
                  onClick={o.newPlayers}
                  className="rounded-sm border border-amber-900/50 bg-black/35 px-7 py-3 font-serif text-text-md font-semibold text-[#dfcfaf] transition-colors hover:border-amber-600/70 hover:bg-amber-950/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  Back to lobby
                </button>
              </div>
            ) : (
              <p className="text-text-sm text-grey-400">
                Waiting for the host to start a new game…
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <Shell backdrop={BACKDROP[view.phase]}>
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

      {view.wolfChat !== null && (
        <div className="mx-auto w-full max-w-sm lg:fixed lg:right-6 lg:top-40 lg:w-[220px]">
          <ChatPanel entries={view.wolfChat} onSend={o.sendWolfChat} title="Wolf Den" />
        </div>
      )}

      <motion.div
        key={view.phase}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-1 flex-col justify-center"
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
