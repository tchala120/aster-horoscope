"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { AVATARS, MAX_PLAYERS } from "./core/werewolf";
import type { RoomPhase } from "./core/room";
import { useWerewolfOnline } from "./state/use-werewolf-online";
import { useKnownWerewolfRooms } from "./state/use-known-rooms";
import { avatarVideoFor } from "./avatar-media";

const ASSET = "/werewolf-game/room-list";
const CHARACTER_FRAME = "/werewolf-game/system/character-frame.png";
const ANSWER_SUMMON_TITLE = "/werewolf-game/system/anwser-summon.png";
const SUMMON_BAR = "/werewolf-game/system/summon-bar.png";
const CLOSE_BUTTON = "/werewolf-game/system/x-button.png";

/** The public lobby list only ever shows "Gathering" (it's lobby-phase by construction);
 *  a merged-in own-room can be in any phase, so its label needs to reflect that. */
function phaseLabel(phase: RoomPhase): string {
  if (phase === "lobby" || phase === "countdown") return "Gathering";
  if (phase === "over") return "Game Over";
  return "In Progress";
}

/** Grid of selectable character pictures — required before creating or joining a room. */
function AvatarPicker({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (src: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-3 text-[#ca6c5d]">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#7c402f] to-[#7c402f]/20" />
        <p className="shrink-0 text-center text-[12px] font-semibold uppercase tracking-[0.24em] sm:text-[14px]">
          Choose your character
        </p>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#7c402f] to-[#7c402f]/20" />
      </div>
      <div className="werewolf-room-scroll grid max-h-[280px] grid-cols-5 gap-2 overflow-y-auto px-1 py-1 sm:max-h-[340px] sm:gap-3">
        {AVATARS.map((src, index) => {
          const isSelected = src === selected;
          const hoverVideo = avatarVideoFor(src);
          return (
            <button
              key={src}
              type="button"
              onClick={() => onSelect(src)}
              onMouseEnter={() => hoverVideo && setHovered(src)}
              onMouseLeave={() => setHovered(null)}
              aria-pressed={isSelected}
              aria-label={`Select character ${index + 1}`}
              className={`group relative aspect-square w-full rounded-full bg-[#080706] p-[3px] transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${
                isSelected
                  ? "scale-[1.07] shadow-[0_0_8px_2px_rgba(255,72,35,0.9),0_0_24px_rgba(206,38,17,0.8)]"
                  : "grayscale-[18%] hover:scale-[1.1] hover:grayscale-0 hover:shadow-[0_0_8px_2px_rgba(255,58,30,0.75),0_0_24px_5px_rgba(175,22,12,0.55)]"
              }`}
            >
              <span aria-hidden className="werewolf-avatar-fire absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100" />
              <span className="absolute inset-0 rounded-full border border-[#9a6b42]/85 shadow-[inset_0_0_0_2px_#17110d,inset_0_0_0_3px_rgba(195,132,70,0.38)] transition-colors duration-200 group-hover:border-[#e05a38]" />
              <span className="relative block h-full w-full overflow-hidden rounded-full border border-black/90">
                <Image src={src} alt="" fill sizes="96px" className="object-cover object-top" />
                {hoverVideo && (hovered === src || isSelected) && (
                  <video
                    src={hoverVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                )}
                <span className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-transparent to-black/40" />
              </span>
              {isSelected && (
                <span className="absolute -bottom-1 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#e58947] bg-[#351209] text-[14px] text-[#f2bd6d] shadow-[0_0_10px_rgba(239,76,36,0.9)]">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Membership = "checking" | "valid" | "invalid";

export function WerewolfRoomList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCode = searchParams.get("code") ?? undefined;
  const o = useWerewolfOnline(presetCode);
  const {
    rooms: myRooms,
    loading: myRoomsLoading,
    refresh: refreshMyRooms,
  } = useKnownWerewolfRooms();

  const [roomName, setRoomName] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState(presetCode ?? "");
  const [modalMode, setModalMode] = useState<"create" | "join" | null>(presetCode ? "join" : null);
  const [pendingDeleteRoom, setPendingDeleteRoom] = useState<{
    code: string;
    roomName: string;
  } | null>(null);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const trimmedRoomName = roomName.trim();
  const trimmedName = name.trim();
  const canCreate = Boolean(trimmedRoomName && trimmedName && avatar);
  const canJoinByCode = Boolean(trimmedName && avatar && joinCode.trim());

  // Already have a valid session for a directly-linked room — skip the browser and resume it.
  useEffect(() => {
    if (o.joined && o.code) router.replace(`/werewolf/online/${o.code}`);
  }, [o.joined, o.code, router]);

  const myRoomCodes = new Set(myRooms.map((r) => r.code));
  // Public lobby rooms, plus any of my own rooms the public list wouldn't show (already
  // past the lobby phase, or full) — so a game in progress never "disappears" on the browser.
  const displayRooms = [
    ...o.openRooms.map((room) => ({ ...room, phase: "lobby" as RoomPhase })),
    ...myRooms
      .filter((room) => !o.openRooms.some((r) => r.code === room.code))
      .map((room) => ({
        code: room.code,
        roomName: room.roomName,
        hostName: room.isHost ? "You" : "Someone",
        playerCount: room.playerCount,
        maxPlayers: MAX_PLAYERS,
        phase: room.phase,
      })),
  ];

  const membershipFor = (code: string): Membership =>
    myRoomsLoading ? "checking" : myRoomCodes.has(code) ? "valid" : "invalid";
  const myRoom = myRooms[0] ?? null;
  const membershipPending = myRoomsLoading;

  const openJoinModal = (code?: string) => {
    if (code) setJoinCode(code);
    setModalMode("join");
  };

  const handleConfirm = () => {
    if (!avatar) return;
    if (modalMode === "create") o.createGame(roomName, name, avatar);
    else o.joinGame(joinCode, name, avatar);
  };

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden bg-black text-[#ddd2c0]">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <Image
          src={`${ASSET}/background.png`}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1300px] flex-1 flex-col gap-2 px-4 pt-5 pb-16">
        <div className="animate-werewolf-fade-in">
          <BackLink href="/werewolf" variant="chip" />
        </div>

        <div className="relative mx-auto mt-4 flex w-full max-w-[1060px] flex-col items-center">
          {/* Sits in normal flow, then pulled down to straddle the frame's top edge. */}
          <div
            className="animate-werewolf-fade-in relative z-20 -mb-[10%] w-[40%] max-w-[380px]"
            style={{ animationDelay: "0.1s" }}
          >
            <Image
              src={`${ASSET}/crest-logo.png`}
              alt="Werewolf"
              width={471}
              height={314}
              className="h-auto w-full brightness-[0.7] saturate-[0.85]"
              priority
            />
          </div>

          <div
            className="animate-werewolf-fade-in relative aspect-[1536/1024] w-full"
            style={{ animationDelay: "0.2s" }}
          >
            <Image
              src="/werewolf-game/system/roomlist-panel.png"
              alt=""
              fill
              sizes="980px"
              className="object-fill"
              priority
            />

            <div className="absolute inset-x-[10%] top-[15%] bottom-[32%] flex flex-col px-6">
              {o.roomsLoading ? (
                <p className="m-auto text-center text-text-sm text-grey-300">
                  Looking for open rooms…
                </p>
              ) : displayRooms.length === 0 ? (
                <p className="m-auto max-w-xs text-center text-text-sm text-grey-300">
                  No open rooms right now — forge one below.
                </p>
              ) : (
                <div className="werewolf-room-scroll flex max-h-[264px] min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 pt-6 sm:max-h-[344px]">
                  {displayRooms.map((room, index) => {
                    const membership = membershipFor(room.code);
                    return (
                      <div
                        key={room.code}
                        className="animate-werewolf-fade-in flex items-center gap-2 rounded-md border border-[#332a1e]/50 bg-gradient-to-b from-[#241e16]/60 via-[#15110c]/60 to-[#0a0806]/65 px-3 py-2 shadow-[inset_0_1px_0_rgba(150,130,100,0.10),inset_0_-1px_0_rgba(0,0,0,0.45)] transition-colors hover:border-[#4a3c28]/70 hover:from-[#2e2618]/85 hover:via-[#181209]/85 hover:to-[#0a0806]/90 sm:gap-3 sm:py-2.5"
                        style={{ animationDelay: `${0.3 + index * 0.06}s` }}
                      >
                        <span className="relative h-10 w-10 shrink-0 sm:h-14 sm:w-14">
                          <Image
                            src={`${ASSET}/avatar-wolf.png`}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-contain"
                          />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#f2e7d0] sm:text-text-md">
                          {room.roomName}
                        </span>
                        <span className="hidden shrink-0 items-center gap-1.5 text-text-sm text-grey-300 sm:flex">
                          <span className="relative h-9 w-9">
                            <Image
                              src={`${ASSET}/players-icon.png`}
                              alt=""
                              fill
                              className="object-contain"
                            />
                          </span>
                          {room.playerCount}/{room.maxPlayers}
                        </span>
                        <div className="flex flex-1 items-center justify-start">
                          <span className="hidden shrink-0 text-text-md font-semibold text-amber-400 sm:inline">
                            {phaseLabel(room.phase)}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={membership === "checking"}
                          aria-busy={membership === "checking"}
                          onClick={() =>
                            membership === "valid"
                              ? router.push(`/werewolf/online/${room.code}`)
                              : openJoinModal(room.code)
                          }
                          aria-label={
                            membership === "valid" ? "Resume room" : `Join ${room.roomName}`
                          }
                          className="relative aspect-[1507/463] h-8 shrink-0 transition hover:scale-105 disabled:opacity-50 sm:h-10"
                        >
                          <Image
                            src={`${ASSET}/join-button.png`}
                            alt={membership === "valid" ? "Resume" : "Join"}
                            fill
                            className="object-fill"
                          />
                          {/* Opaque patch hides the "JOIN" baked into the artwork so every
                              state (Join, Resume, checking) draws its own label instead. */}
                          <span className="absolute inset-x-[15%] inset-y-[20%] rounded-[2px] bg-[#3a0d0d]" />
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold uppercase tracking-wide text-[#f0dab0] sm:text-[10px]">
                            {membership === "valid"
                              ? "Resume"
                              : membership === "checking"
                                ? "…"
                                : "Join"}
                          </span>
                        </button>
                        {room.phase === "lobby" && (
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDeleteRoom({ code: room.code, roomName: room.roomName })
                            }
                            aria-label={`Delete ${room.roomName}`}
                            className="shrink-0 px-1 text-grey-500 transition-colors hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalMode("create")}
              disabled={Boolean(myRoom) || membershipPending}
              aria-label="Create room"
              title={myRoom ? "You already have a room open — resume it above." : undefined}
              className="animate-werewolf-fade-in absolute bottom-[1.5%] right-[7%] aspect-[1536/593] h-[19%] min-w-[160px] max-w-[320px] brightness-75 transition hover:scale-105 hover:brightness-110 disabled:pointer-events-none disabled:brightness-50 disabled:grayscale-[0.4] disabled:hover:scale-100"
              style={{ animationDelay: "0.35s" }}
            >
              <Image
                src={`${ASSET}/create-button.png`}
                alt=""
                fill
                className="object-fill"
                priority
              />
              <span className="absolute inset-y-0 left-[10%] right-[30%] flex items-center justify-center text-xs font-bold uppercase tracking-[0.08em] text-[#f5e2c0] sm:text-[15px]">
                Create Room
              </span>
            </button>
          </div>
        </div>

        {myRoom && (
          <p className="text-center text-[11px] text-grey-400">
            You already have a room open — resume it above to create a new one.
          </p>
        )}
      </div>

      {pendingDeleteRoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="room-list-delete-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => !deletingRoom && setPendingDeleteRoom(null)}
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
              id="room-list-delete-title"
              className="mt-2 font-serif text-xl font-black text-[#f0ddb7]"
            >
              Delete {pendingDeleteRoom.roomName}?
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-grey-400">
              Everyone will be removed and this gathering cannot be resumed.
            </p>
            <div className="relative z-10 mt-6 flex justify-center gap-3">
              <button
                type="button"
                disabled={deletingRoom}
                onClick={() => setPendingDeleteRoom(null)}
                aria-label="Stay"
                className="relative aspect-[3/1] w-44 transition enabled:hover:scale-105 enabled:hover:brightness-125 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
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
                disabled={deletingRoom}
                aria-label="Delete room"
                onClick={async () => {
                  const room = pendingDeleteRoom;
                  setDeletingRoom(true);
                  const deleted = await o.deleteOpenRoom(room.code);
                  if (deleted) await refreshMyRooms();
                  setDeletingRoom(false);
                  if (deleted) setPendingDeleteRoom(null);
                }}
                className="relative aspect-[3/1] w-44 transition enabled:hover:scale-105 enabled:hover:brightness-125 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Image
                  src="/werewolf-game/system/delete-room-button.png"
                  alt="Delete room"
                  fill
                  sizes="176px"
                  className="object-contain"
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-1 backdrop-blur-[2px] sm:p-2"
          onClick={() => setModalMode(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="werewolf-room-dialog-title"
            className="werewolf-character-dialog relative isolate aspect-auto max-h-[calc(100dvh-0.5rem)] w-full max-w-[1380px] overflow-x-hidden overflow-y-auto px-[7%] pb-[8%] pt-[8%] shadow-[0_30px_90px_rgba(0,0,0,0.8)] sm:aspect-[1672/941] sm:overflow-hidden sm:px-[6.5%] sm:pb-[7%] sm:pt-[7.5%]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={CHARACTER_FRAME}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 1380px"
              className="pointer-events-none -z-10 origin-top scale-[1.08] object-fill"
              priority
            />

            <div className="mb-4 text-center sm:mb-5">
              <h2
                id="werewolf-room-dialog-title"
                className="sr-only"
              >
                {modalMode === "create" ? "Forge a New Pact" : "Answer the Summons"}
              </h2>
              <div aria-hidden className="relative mx-auto h-10 w-[72%] max-w-[620px] overflow-hidden sm:h-14">
                <Image
                  src={ANSWER_SUMMON_TITLE}
                  alt=""
                  width={1649}
                  height={954}
                  className="absolute left-1/2 top-1/2 h-auto w-full -translate-x-1/2 -translate-y-1/2 object-contain"
                />
              </div>
              <div aria-hidden className="relative mx-auto -mt-1 h-5 w-[70%] max-w-[680px] overflow-hidden sm:h-7">
                <Image
                  src={SUMMON_BAR}
                  alt=""
                  width={2172}
                  height={724}
                  className="absolute left-1/2 top-1/2 h-auto w-full -translate-x-1/2 -translate-y-1/2 object-contain"
                />
              </div>
              <p className="mt-2 text-[13px] font-bold tracking-wide text-[#9f8d76] sm:text-[15px]">
                Reveal your name, sigil, and the room that calls you.
              </p>
            </div>
            <div className="absolute right-[3%] top-[13%] sm:right-[3%] sm:top-[14%]">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                aria-label="Close"
                className="relative h-11 w-11 rounded-full transition hover:scale-110 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:h-14 sm:w-14"
              >
                <Image src={CLOSE_BUTTON} alt="" fill sizes="56px" className="object-contain" />
              </button>
            </div>

            <div className="mx-auto flex w-full flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-0">
              {/* Left panel — name/room fields and actions. */}
              <div className="flex w-full flex-col gap-4 sm:w-[27%] sm:shrink-0 sm:border-r sm:border-[#5d402b]/45 sm:pr-[3%]">
                {modalMode === "create" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-red-300/70 sm:text-[14px]">
                      Room name
                    </span>
                    <input
                      type="text"
                      value={roomName}
                      maxLength={24}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Name your room"
                      aria-label="Room name"
                      className="w-full rounded-md border border-red-900/45 bg-black/45 px-4 py-3 text-text-sm text-[#f2e7d0] shadow-inner placeholder:text-grey-600 focus:border-red-600/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                    />
                  </label>
                )}

                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-red-300/70 sm:text-[14px]">
                    Keeper name
                  </span>
                  <input
                    type="text"
                    value={name}
                    maxLength={16}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    aria-label="Your name"
                    className="w-full rounded-md border border-red-900/45 bg-black/45 px-4 py-3 text-text-sm text-[#f2e7d0] shadow-inner placeholder:text-grey-600 focus:border-red-600/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                  />
                </label>

                {modalMode === "join" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-red-300/70">
                      Ancient room code
                    </span>
                    <input
                      type="text"
                      value={joinCode}
                      maxLength={6}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Room code"
                      aria-label="Room code"
                      className="w-full rounded-md border border-red-900/45 bg-black/45 px-4 py-3 text-center font-mono text-text-md uppercase tracking-[0.3em] text-[#f2e7d0] shadow-inner placeholder:text-grey-600 placeholder:tracking-normal focus:border-red-600/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                    />
                  </label>
                )}

                {o.error && <p className="text-center text-text-sm text-red-400">{o.error}</p>}

                <button
                  type="button"
                  disabled={o.busy || (modalMode === "create" ? !canCreate : !canJoinByCode)}
                  onClick={handleConfirm}
                  aria-label={modalMode === "create" ? "Create room" : "Join room"}
                  className={
                    modalMode === "create"
                      ? "relative mt-2 aspect-[2112/744] w-full transition enabled:hover:scale-[1.02] enabled:hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      : "werewolf-create-dialog-action mt-2 w-full bg-gradient-to-b from-[#761f1b] via-[#4b100e] to-[#250706] px-5 py-3 font-serif text-text-md font-black uppercase tracking-[0.14em] text-[#dfc6a4] transition enabled:hover:scale-[1.02] enabled:hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:py-4"
                  }
                >
                  {modalMode === "create" ? (
                    <>
                      <Image
                        src="/werewolf-game/system/create-room-button.png"
                        alt="Create room"
                        fill
                        sizes="320px"
                        className="object-contain"
                      />
                      {o.busy && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 font-serif text-xl font-black text-amber-100">
                          …
                        </span>
                      )}
                    </>
                  ) : o.busy ? (
                    "…"
                  ) : (
                    "Join room"
                  )}
                </button>

                {modalMode === "join" && o.error === "This game has already started." && (
                  <button
                    type="button"
                    disabled={o.busy || !trimmedName}
                    onClick={() => o.reclaimGame(joinCode, name)}
                    className="w-full rounded-md border border-amber-700/50 bg-black/40 px-8 py-2.5 font-serif text-text-sm font-bold uppercase tracking-[0.12em] text-amber-300 transition enabled:hover:border-amber-500 enabled:hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    Reclaim your seat as {trimmedName || "…"}
                  </button>
                )}
              </div>

              {/* Right panel — avatar picker. */}
              <div className="min-w-0 flex-1 sm:pl-[3%]">
                <AvatarPicker selected={avatar} onSelect={setAvatar} />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
