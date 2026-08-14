"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { AVATARS } from "./core/werewolf";
import { useWerewolfOnline } from "./state/use-werewolf-online";
import {
  clearParticipantToken,
  loadParticipantToken,
  peekParticipantToken,
} from "./state/participant-storage";

const ASSET = "/werewolf-game/room-list";

/** True if this browser already holds a player token for that room — used to offer "Resume"
 *  instead of "Join" so a host who hit Back doesn't join their own room as a second player. */
function hasStoredToken(code: string): boolean {
  return Boolean(peekParticipantToken(code));
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
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-red-300/70">
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
              className={`relative aspect-square w-full overflow-hidden rounded-full bg-grey-950/70 ring-2 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
                isSelected
                  ? "scale-105 ring-red-400 shadow-[0_0_18px_rgba(248,113,113,0.45)]"
                  : "ring-red-900/45 grayscale-[25%] hover:scale-105 hover:grayscale-0 hover:ring-red-500/70"
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

type Membership = "checking" | "valid" | "invalid";

export function WerewolfRoomList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCode = searchParams.get("code") ?? undefined;
  const o = useWerewolfOnline(presetCode);

  const [roomName, setRoomName] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState(presetCode ?? "");
  const [modalMode, setModalMode] = useState<"create" | "join" | null>(presetCode ? "join" : null);
  const [roomMembership, setRoomMembership] = useState<Record<string, Membership>>({});
  const trimmedRoomName = roomName.trim();
  const trimmedName = name.trim();
  const canCreate = Boolean(trimmedRoomName && trimmedName && avatar);
  const canJoinByCode = Boolean(trimmedName && avatar && joinCode.trim());

  // Already have a valid session for a directly-linked room — skip the browser and resume it.
  useEffect(() => {
    if (o.joined && o.code) router.replace(`/werewolf/online/${o.code}`);
  }, [o.joined, o.code, router]);

  useEffect(() => {
    let cancelled = false;

    async function validateStoredMemberships() {
      const results = await Promise.all(
        o.openRooms.map(async (room) => {
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
  }, [o.openRooms]);

  const membershipFor = (code: string): Membership =>
    roomMembership[code] ?? (hasStoredToken(code) ? "checking" : "invalid");
  const myRoom = o.openRooms.find((r) => membershipFor(r.code) === "valid") ?? null;
  const membershipPending = o.openRooms.some((r) => membershipFor(r.code) === "checking");

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
              ) : o.openRooms.length === 0 ? (
                <p className="m-auto max-w-xs text-center text-text-sm text-grey-300">
                  No open rooms right now — forge one below.
                </p>
              ) : (
                <div className="werewolf-room-scroll flex max-h-[264px] min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 pt-6 sm:max-h-[344px]">
                  {o.openRooms.map((room, index) => {
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
                            Gathering
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
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete "${room.roomName}"?`))
                              o.deleteOpenRoom(room.code);
                          }}
                          aria-label={`Delete ${room.roomName}`}
                          className="shrink-0 px-1 text-grey-500 transition-colors hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                        >
                          ✕
                        </button>
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

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
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
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-grey-500 ring-1 ring-red-900/40 transition hover:bg-red-950/40 hover:text-red-300 hover:ring-red-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                ✕
              </button>
            </div>

            <div className="mx-auto flex max-w-md flex-col gap-4">
              {modalMode === "create" && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-red-300/70">
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
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-red-300/70">
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

              <AvatarPicker selected={avatar} onSelect={setAvatar} />

              {o.error && <p className="text-center text-text-sm text-red-400">{o.error}</p>}

              <button
                type="button"
                disabled={o.busy || (modalMode === "create" ? !canCreate : !canJoinByCode)}
                onClick={handleConfirm}
                className="mt-1 w-full rounded-md border border-red-700/60 bg-gradient-to-b from-[#7a1f1f] via-[#4d1414] to-[#1a0808] px-8 py-3 font-serif text-text-md font-black uppercase tracking-[0.16em] text-[#f3dfb6] shadow-[inset_0_1px_0_rgba(255,180,153,0.24),0_5px_18px_rgba(0,0,0,0.4)] transition enabled:hover:scale-[1.02] enabled:hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                {o.busy ? "…" : modalMode === "create" ? "Create room" : "Join room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
