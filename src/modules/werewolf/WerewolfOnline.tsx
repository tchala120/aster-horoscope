"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import {
  AVATARS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROLES,
  type RoleId,
  rolePoolFor,
} from "./core/werewolf";
import type {
  ChatEntry,
  GameLogEntry,
  OpenRoomSummary,
  PublicPlayer,
  PublicRoom,
  RoomPhase,
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
import { useWerewolfOnline } from "./state/use-werewolf-online";
import {
  clearParticipantToken,
  loadParticipantToken,
  peekParticipantToken,
} from "./state/participant-storage";

const BACKDROP: Partial<Record<RoomPhase, string>> = {
  "night-wolf": "/werewolf-game/forest.png",
  "night-seer": "/werewolf-game/village-night.png",
  "night-doctor": "/werewolf-game/village-night.png",
  dawn: "/werewolf-game/village-night.png",
  "hunter-revenge": "/werewolf-game/forest.png",
  "day-discuss": "/werewolf-game/village-day.png",
  "day-vote": "/werewolf-game/village-day.png",
  "day-result": "/werewolf-game/village-day.png",
  over: "/werewolf-game/village-day.png",
};

const NIGHT_PHASES: RoomPhase[] = ["night-wolf", "night-seer", "night-doctor", "dawn"];

/** True if this browser already holds a player token for that room (same key `useWerewolfOnline`
 *  saves to) — used to offer "Resume" instead of "Join" so a host who hit Back doesn't join their
 *  own room as a second player. */
function hasStoredToken(code: string): boolean {
  return Boolean(peekParticipantToken(code));
}

function Shell({
  backdrop,
  backdropContent,
  wide,
  backHref,
  stackLeft,
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
  /** Pins "Back" to the same fixed left column as content below it (e.g. the lobby's
   *  Back → logo → Room Info stack) instead of leaving it in normal flow. */
  stackLeft?: boolean;
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
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col gap-5 p-6 ${wide ? "max-w-5xl" : "max-w-2xl"}`}
      >
        <div className={stackLeft ? "lg:fixed lg:left-6 lg:top-6" : undefined}>
          <BackLink href={backHref} />
        </div>
        {children}
      </div>
    </main>
  );
}

/** Grid of selectable character pictures — required before creating or joining a room. */
function AvatarPicker({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (src: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/70">
        Choose your character
      </p>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {AVATARS.map((src, index) => {
          const isSelected = src === selected;
          return (
            <button
              key={src}
              type="button"
              onClick={() => onSelect(src)}
              aria-pressed={isSelected}
              aria-label={`Select character ${index + 1}`}
              className={`relative aspect-square w-full overflow-hidden rounded-full bg-grey-950/70 ring-2 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                isSelected
                  ? "scale-105 ring-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.42)]"
                  : "ring-amber-900/45 grayscale-[25%] hover:scale-105 hover:grayscale-0 hover:ring-amber-500/70"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover object-top" />
            </button>
          );
        })}
      </div>
    </div>
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

function RoomActionButton({
  children,
  onClick,
  disabled,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`werewolf-room-action ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Landing-only backdrop — the whole scene fitted to the viewport (no cropping),
 *  closer to the reference composition than the shared full-bleed `Backdrop`. */
function LandingBackdrop() {
  return (
    <div aria-hidden className="werewolf-entry-backdrop pointer-events-none">
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

function LandingScreen({
  presetCode,
  busy,
  error,
  openRooms,
  roomsLoading,
  onCreate,
  onJoin,
  onDeleteOpenRoom,
}: {
  presetCode?: string;
  busy: boolean;
  error: string | null;
  openRooms: OpenRoomSummary[];
  roomsLoading: boolean;
  onCreate: (name: string, avatar: string) => void;
  onJoin: (code: string, name: string, avatar: string) => void;
  onDeleteOpenRoom: (code: string) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState(presetCode ?? "");
  const [modalMode, setModalMode] = useState<"create" | "join" | null>(presetCode ? "join" : null);
  const [roomMembership, setRoomMembership] = useState<
    Record<string, "checking" | "valid" | "invalid">
  >({});
  const trimmedName = name.trim();
  const canSubmit = Boolean(trimmedName && avatar);
  const canJoinByCode = canSubmit && joinCode.trim().length > 0;

  useEffect(() => {
    let cancelled = false;

    async function validateStoredMemberships() {
      const results = await Promise.all(
        openRooms.map(async (room) => {
          const token = loadParticipantToken(room.code);
          if (!token) return [room.code, "invalid"] as const;
          try {
            const res = await fetch(
              `/api/v1/werewolf/rooms/${room.code}?token=${encodeURIComponent(token)}`,
            );
            if (res.ok) return [room.code, "valid"] as const;
          } catch {
            // Do not claim resume access when membership could not be verified.
            return [room.code, "checking"] as const;
          }
          clearParticipantToken(room.code);
          return [room.code, "invalid"] as const;
        }),
      );
      if (!cancelled) setRoomMembership(Object.fromEntries(results));
    }

    void validateStoredMemberships();
    return () => {
      cancelled = true;
    };
  }, [openRooms]);

  const membershipFor = (code: string) =>
    roomMembership[code] ?? (hasStoredToken(code) ? "checking" : "invalid");
  /** A validated room this browser already participates in. */
  const myRoom = openRooms.find((r) => membershipFor(r.code) === "valid") ?? null;
  const membershipPending = openRooms.some((r) => membershipFor(r.code) === "checking");

  const openJoinModal = (code?: string) => {
    if (code) setJoinCode(code);
    setModalMode("join");
  };

  const handleConfirm = () => {
    if (!avatar) return;
    if (modalMode === "create") onCreate(name, avatar);
    else onJoin(joinCode, name, avatar);
  };

  return (
    <Shell
      wide
      className="werewolf-room-list-root"
      backdropContent={
        <>
          <LandingBackdrop />
          <SnowOverlay />
        </>
      }
    >
      <header className="text-center">
        <p className="font-serif text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300/80">
          An ancient game of hidden loyalties &middot; 5&ndash;10 players
        </p>
        <Image
          src="/werewolf-game/system/logo-removebg.png"
          alt="Werewolf — The Hidden Among Us"
          width={630}
          height={246}
          className="mx-auto mt-1 h-auto w-72 sm:w-96"
          priority
        />
      </header>

      <section
        className="werewolf-room-ledger werewolf-metal-frame flex flex-col gap-3 p-4 sm:p-5"
        aria-labelledby="room-ledger-title"
      >
        <span aria-hidden className="werewolf-frame-corner werewolf-frame-corner--tl" />
        <span aria-hidden className="werewolf-frame-corner werewolf-frame-corner--tr" />
        <span aria-hidden className="werewolf-frame-corner werewolf-frame-corner--bl" />
        <span aria-hidden className="werewolf-frame-corner werewolf-frame-corner--br" />
        <div className="werewolf-ledger-header -mx-4 -mt-4 flex flex-col gap-3 px-4 py-3 sm:-mx-5 sm:-mt-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="werewolf-ancient-heading text-amber-200/80" id="room-ledger-title">
              Village ledger
            </p>
            <p className="mt-1 font-serif text-[11px] text-grey-400">
              Open gatherings awaiting another voice
            </p>
          </div>
          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            <RoomActionButton
              onClick={() => setModalMode("create")}
              disabled={Boolean(myRoom) || membershipPending}
              aria-label="Create room"
              title={myRoom ? "You already have a room open — resume it below." : undefined}
              className="werewolf-room-action--create w-full min-w-44 px-7 py-2 text-xs sm:w-auto"
            >
              Create room
            </RoomActionButton>
            <Image
              src="/werewolf-game/icon-scroll.png"
              alt=""
              width={34}
              height={34}
              className="hidden h-8 w-8 opacity-70 sm:block"
            />
          </div>
        </div>

        {myRoom && (
          <p className="text-center text-[11px] text-grey-500">
            You already have a room open — resume it below to create a new one.
          </p>
        )}

        {roomsLoading ? (
          <p className="py-6 text-center text-text-sm text-grey-500">Looking for open rooms…</p>
        ) : openRooms.length === 0 ? (
          <p className="py-6 text-center text-text-sm text-grey-500">
            No open rooms right now — start one!
          </p>
        ) : (
          <div>
            <div className="divide-y divide-amber-900/25 sm:hidden">
              {openRooms.map((room) => {
                const membership = membershipFor(room.code);
                return (
                  <article
                    key={room.code}
                    className="werewolf-ledger-row grid grid-cols-2 gap-x-4 gap-y-3 py-4 first:pt-1"
                  >
                    <div>
                      <p className="werewolf-ancient-heading !text-[8px] !text-amber-200/50">
                        Room
                      </p>
                      <p className="mt-1 font-mono font-bold tracking-[0.16em] text-[#ead9b6]">
                        {room.code}
                      </p>
                    </div>
                    <div>
                      <p className="werewolf-ancient-heading !text-[8px] !text-amber-200/50">
                        Keeper
                      </p>
                      <p className="mt-1 truncate text-text-sm text-grey-300">{room.hostName}</p>
                    </div>
                    <div>
                      <p className="werewolf-ancient-heading !text-[8px] !text-amber-200/50">
                        Circle
                      </p>
                      <p className="mt-1 text-text-sm text-grey-300">
                        {room.playerCount}/{room.maxPlayers} gathered
                      </p>
                    </div>
                    <div>
                      <p className="werewolf-ancient-heading !text-[8px] !text-amber-200/50">
                        State
                      </p>
                      <p className="mt-1 font-serif text-text-sm text-amber-400/80">Gathering</p>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 border-t border-amber-900/20 pt-3">
                      <RoomActionButton
                        disabled={membership === "checking"}
                        aria-busy={membership === "checking"}
                        onClick={() =>
                          membership === "valid"
                            ? router.push(`/werewolf/online/${room.code}`)
                            : openJoinModal(room.code)
                        }
                        className="min-w-40 px-6 py-2 text-[11px]"
                      >
                        {membership === "valid"
                          ? "Resume"
                          : membership === "checking"
                            ? "Checking…"
                            : "Join gathering"}
                      </RoomActionButton>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete ${room.hostName}'s room?`))
                            onDeleteOpenRoom(room.code);
                        }}
                        aria-label={`Delete ${room.hostName}'s room`}
                        className="p-2 text-grey-500 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                      >
                        ✕
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <table className="hidden w-full text-left text-text-sm sm:table">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.15em] text-grey-500">
                  <th className="pb-2 font-semibold">Room</th>
                  <th className="pb-2 font-semibold">Owner</th>
                  <th className="pb-2 font-semibold">Players</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 text-right font-semibold">Join</th>
                </tr>
              </thead>
              <tbody>
                {openRooms.map((room) => {
                  const membership = membershipFor(room.code);
                  return (
                    <tr
                      key={room.code}
                      className="werewolf-ledger-row border-t border-amber-900/25"
                    >
                      <td
                        data-label="Room"
                        className="py-3 pr-3 font-mono font-semibold tracking-[0.15em] text-[#ead9b6]"
                      >
                        {room.code}
                      </td>
                      <td
                        data-label="Keeper"
                        className="max-w-[10rem] truncate py-3 pr-3 text-grey-300"
                      >
                        {room.hostName}
                      </td>
                      <td data-label="Circle" className="py-3 pr-3 text-grey-300">
                        {room.playerCount}/{room.maxPlayers}
                      </td>
                      <td data-label="State" className="py-3 pr-3 font-serif text-amber-400/80">
                        Gathering
                      </td>
                      <td data-label="Passage" className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <RoomActionButton
                            disabled={membership === "checking"}
                            aria-busy={membership === "checking"}
                            onClick={() =>
                              membership === "valid"
                                ? router.push(`/werewolf/online/${room.code}`)
                                : openJoinModal(room.code)
                            }
                            className="min-w-24 px-4 py-1.5 text-[11px]"
                          >
                            {membership === "valid"
                              ? "Resume"
                              : membership === "checking"
                                ? "Checking…"
                                : "Join"}
                          </RoomActionButton>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete ${room.hostName}'s room?`)) {
                                onDeleteOpenRoom(room.code);
                              }
                            }}
                            aria-label={`Delete ${room.hostName}'s room`}
                            title="Delete room"
                            className="rounded-full p-1 text-grey-500 transition-colors hover:bg-red-400/10 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

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

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-grey-950/90 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setModalMode(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="werewolf-room-dialog-title"
            className="werewolf-create-dialog-shell relative max-h-[calc(100vh-1.5rem)] w-full max-w-xl overflow-y-auto px-7 pb-8 pt-11 shadow-[0_30px_90px_rgba(0,0,0,0.75)] sm:px-12 sm:pb-11 sm:pt-14"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 text-center sm:mb-6">
              <p className="text-[9px] font-semibold uppercase tracking-[0.38em] text-red-400/80">
                Enter the hidden village
              </p>
              <h2
                id="werewolf-room-dialog-title"
                className="mt-1 font-serif text-2xl font-black uppercase tracking-[0.12em] text-[#ead9b6] drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] sm:text-3xl"
              >
                {modalMode === "create" ? "Forge a New Pact" : "Answer the Summons"}
              </h2>
              <p className="mt-1 text-[11px] text-grey-400">
                {modalMode === "create"
                  ? "Name your keeper and choose the face you will wear."
                  : "Reveal your name, sigil, and the room that calls you."}
              </p>
            </div>
            <div className="absolute right-6 top-7 sm:right-9 sm:top-9">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-grey-500 ring-1 ring-amber-900/40 transition hover:bg-red-950/40 hover:text-red-300 hover:ring-red-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                ✕
              </button>
            </div>

            <div className="mx-auto flex max-w-md flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/70">
                  Keeper name
                </span>
                <input
                  type="text"
                  value={name}
                  maxLength={16}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your name"
                  className="w-full rounded-md border border-amber-900/45 bg-black/45 px-4 py-3 text-text-sm text-[#f2e7d0] shadow-inner placeholder:text-grey-600 focus:border-amber-600/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                />
              </label>

              {modalMode === "join" && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/70">
                    Ancient room code
                  </span>
                  <input
                    type="text"
                    value={joinCode}
                    maxLength={6}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Room code"
                    aria-label="Room code"
                    className="w-full rounded-md border border-amber-900/45 bg-black/45 px-4 py-3 text-center font-mono text-text-md uppercase tracking-[0.3em] text-[#f2e7d0] shadow-inner placeholder:text-grey-600 placeholder:tracking-normal focus:border-amber-600/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                  />
                </label>
              )}

              <AvatarPicker selected={avatar} onSelect={setAvatar} />

              {error && <p className="text-center text-text-sm text-red-400">{error}</p>}

              <button
                type="button"
                disabled={busy || (modalMode === "create" ? !canSubmit : !canJoinByCode)}
                onClick={handleConfirm}
                className={`mt-1 w-full rounded-md border border-amber-700/60 bg-gradient-to-b from-[#6e351d] via-[#4d1d14] to-[#280c0b] px-8 py-3 font-serif text-text-md font-black uppercase tracking-[0.16em] text-[#f3dfb6] shadow-[inset_0_1px_0_rgba(255,221,153,0.24),0_5px_18px_rgba(0,0,0,0.4)] transition enabled:hover:scale-[1.02] enabled:hover:border-amber-500 enabled:hover:from-[#824424] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${modalMode === "create" ? "werewolf-create-dialog-action" : ""}`}
              >
                {busy ? "…" : modalMode === "create" ? "Create room" : "Join room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function LoadingScreen() {
  return (
    <Shell backdrop="/werewolf-game/village-night.png">
      <div
        className="werewolf-game-stage werewolf-game-stage--night mx-auto mt-20 flex w-full max-w-sm flex-col items-center gap-4 px-8 py-9 text-center"
        role="status"
      >
        <Image
          src="/werewolf-game/icon-moon.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 opacity-80"
        />
        <p className="werewolf-stage-kicker text-violet-300">Crossing the forest</p>
        <p className="font-serif text-text-md text-[#ddd2c0]">Connecting to Aster Village…</p>
      </div>
    </Shell>
  );
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
      <p className="werewolf-ancient-heading">Role Distribution</p>
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
                ×{counts.get(role)}
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
function CampfireCircle({ players }: { players: PublicPlayer[] }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
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
              className="absolute hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 lg:flex"
              style={{ left: `${seat.x}%`, top: `${seat.y}%`, width: "5.5%", minWidth: 26 }}
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
                    <Image
                      src={p.avatar}
                      alt=""
                      fill
                      sizes="60px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-text-md font-bold text-grey-950"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name.slice(0, 1).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
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
function ChatPanel({ entries, onSend }: { entries: ChatEntry[]; onSend: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div className="werewolf-ancient-panel flex h-56 flex-col gap-2 p-4 lg:h-64">
      <p className="werewolf-ancient-heading">Whispers</p>
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
}: {
  view: PublicRoom;
  onStart: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onSendChat: (text: string) => void;
  onReady: (ready: boolean) => void;
}) {
  const me = view.players.find((p) => p.isYou);
  const allReady = view.players.length >= MIN_PLAYERS && view.players.every((p) => p.ready);
  const isCountingDown = view.phase === "countdown" && Boolean(view.countdownEndsAt);
  return (
    <Shell
      wide
      backHref="/werewolf"
      stackLeft
      backdropContent={<CampfireCircle players={view.players} />}
    >
      <header className="text-center lg:fixed lg:left-6 lg:top-16 lg:w-[220px] lg:text-left">
        <Image
          src="/werewolf-game/system/logo-removebg.png"
          alt="Werewolf — The Hidden Among Us"
          width={630}
          height={246}
          className="h-auto w-64 sm:w-80 lg:w-full"
        />
      </header>

      <div className="mx-auto flex flex-col items-center lg:fixed lg:left-1/2 lg:top-5 lg:z-20 lg:-translate-x-1/2">
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

      <div className="mt-20 flex flex-1 flex-col items-center justify-center gap-5 pb-28 lg:mt-0 lg:pb-0">
        <div className="flex w-full max-w-md flex-col gap-4 lg:fixed lg:left-6 lg:top-44 lg:max-w-[220px]">
          <RoomInfoPanel
            code={view.code}
            playerCount={view.players.length}
            isHost={view.isHost}
            onDelete={onDelete}
          />
          <GameLogPanel entries={view.gameLog} />
          <div className="werewolf-ancient-panel grid grid-cols-2 gap-2 p-3 lg:hidden">
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
                <span className="min-w-0">
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

        <div className="flex w-full max-w-md flex-col gap-4 lg:fixed lg:right-6 lg:top-1/2 lg:max-w-[250px] lg:-translate-y-1/2">
          <RoleDistributionPanel playerCount={view.players.length} />
          <ChatPanel entries={view.chat} onSend={onSendChat} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 lg:fixed lg:bottom-5 lg:left-[15%] lg:z-20 lg:-translate-x-1/2">
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
                ? "/werewolf-game/system/ready-removebg.png"
                : "/werewolf-game/system/not ready.png"
            }
            alt={me?.ready ? "Ready" : "Not ready"}
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
          className="mx-auto font-serif text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200/60 underline-offset-4 hover:text-amber-100 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Leave room
        </button>
      )}
    </Shell>
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

export function WerewolfOnline({ code }: { code?: string }) {
  const reduced = useReducedMotion() ?? false;
  const o = useWerewolfOnline(code);

  if (!o.joined) {
    return (
      <LandingScreen
        presetCode={code}
        busy={o.busy}
        error={o.error}
        openRooms={o.openRooms}
        roomsLoading={o.roomsLoading}
        onCreate={o.createGame}
        onJoin={o.joinGame}
        onDeleteOpenRoom={o.deleteOpenRoom}
      />
    );
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
          const targets = alive.filter((p) => p.role !== "werewolf");
          return (
            <div className="werewolf-game-stage werewolf-game-stage--danger mx-auto flex w-full max-w-sm flex-col gap-4 px-6 py-7">
              <div className="text-center">
                <p className="werewolf-stage-kicker text-red-300">
                  Night {view.nightNumber} &middot; Wolves
                </p>
                <h2 className="werewolf-stage-title mt-1">Choose tonight&apos;s victim</h2>
              </div>
              <PlayerPickGrid players={targets} onPick={o.chooseWolfTarget} />
            </div>
          );
        }
        return <WaitingCard text="The wolves are choosing their victim…" />;
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
              </div>
            );
          }
          const targets = alive.filter((p) => p.role !== "seer");
          return (
            <div className="werewolf-game-stage werewolf-game-stage--night mx-auto flex w-full max-w-sm flex-col gap-4 px-6 py-7">
              <div className="text-center">
                <p className="werewolf-stage-kicker text-violet-300">
                  Night {view.nightNumber} &middot; Seer
                </p>
                <h2 className="werewolf-stage-title mt-1">Peer into someone&apos;s nature</h2>
              </div>
              <PlayerPickGrid players={targets} onPick={o.chooseSeerTarget} />
            </div>
          );
        }
        return <WaitingCard text="The seer is peering into the darkness…" />;
      }

      case "night-doctor": {
        if (you?.alive && you.role === "doctor") {
          return (
            <div className="werewolf-game-stage werewolf-game-stage--night mx-auto flex w-full max-w-sm flex-col gap-4 px-6 py-7">
              <div className="text-center">
                <p className="werewolf-stage-kicker text-emerald-300">
                  Night {view.nightNumber} &middot; Doctor
                </p>
                <h2 className="werewolf-stage-title mt-1">Choose someone to protect</h2>
              </div>
              <PlayerPickGrid players={alive} onPick={o.chooseDoctorTarget} />
            </div>
          );
        }
        return <WaitingCard text="The doctor is choosing who to protect…" />;
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
            <div className="werewolf-game-stage werewolf-game-stage--danger mx-auto flex w-full max-w-sm flex-col gap-4 px-6 py-7">
              <div className="text-center">
                <RolePortrait role={ROLES.hunter} size={72} />
                <p className="werewolf-stage-kicker mt-2 text-orange-300">Your final shot</p>
                <h2 className="werewolf-stage-title mt-1">Take one more with you</h2>
              </div>
              <PlayerPickGrid players={alive} onPick={o.chooseHunterTarget} />
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
              </div>
              <PlayerPickGrid players={targets} onPick={o.castVote} />
            </div>
          );
        }
        return (
          <WaitingCard
            text={
              you?.alive
                ? `Waiting for the rest of the village to vote (${view.votesIn}/${view.votesNeeded})…`
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
            {alive.length} alive &middot; {wolvesRemaining}{" "}
            {wolvesRemaining === 1 ? "wolf" : "wolves"} remain
            {wolvesRemaining === 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm lg:fixed lg:left-6 lg:top-24 lg:w-[220px]">
        <GameLogPanel entries={view.gameLog} />
      </div>

      {you?.role && (
        <div className="mx-auto flex items-center gap-3 rounded-sm border border-amber-900/45 bg-black/50 py-1.5 pl-1.5 pr-4 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur">
          <div className="h-10 w-10 shrink-0">
            <RolePortrait role={ROLES[you.role]} size={40} />
          </div>
          <p className="text-text-sm text-grey-400">
            Your hidden role:{" "}
            <span className="font-serif font-semibold text-[#ead9b6]">{ROLES[you.role].label}</span>
            {!you.alive && " (eliminated — you can still watch)"}
          </p>
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
