"use client";

import Image from "next/image";
import { AvatarMedia } from "./AvatarMedia";

/** Minimal shape PlayerSeat needs — satisfied by the online PublicPlayer. */
export interface SeatLike {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

/** A player's chosen character picture, or a colored initial if none was set. */
export function PlayerToken({ player, size = 40 }: { player: SeatLike; size?: number }) {
  if (player.avatar) {
    return (
      <span
        aria-hidden
        className="relative shrink-0 overflow-hidden rounded-full ring-2"
        style={{ width: size, height: size, borderColor: player.color }}
      >
        <AvatarMedia avatar={player.avatar} sizes={`${size}px`} />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full text-text-sm font-bold text-grey-950"
      style={{ width: size, height: size, backgroundColor: player.color }}
    >
      {player.name.slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}

/** Neutral colored token for a player — never leaks their role. */
export function PlayerSeat({
  player,
  onClick,
  disabled,
  selected,
}: {
  player: SeatLike;
  onClick?: () => void;
  disabled?: boolean;
  /** Highlights this seat as the pending (not-yet-confirmed) pick. */
  selected?: boolean;
}) {
  const content = (
    <>
      <PlayerToken player={player} />
      <span className="truncate font-serif text-text-sm font-semibold text-[#e5d5b5]">
        {player.name}
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div className="flex items-center gap-2 rounded-sm border border-amber-900/40 bg-black/40 px-3 py-2 shadow-inner">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex items-center gap-2 rounded-sm border px-3 py-2 shadow-inner transition enabled:hover:border-amber-400/70 enabled:hover:bg-amber-950/25 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
        selected
          ? "border-amber-400/80 bg-amber-950/35 shadow-[0_0_10px_rgba(251,191,36,0.35)]"
          : "border-amber-900/45 bg-black/45"
      }`}
    >
      {content}
    </button>
  );
}

/** A grid of pickable player seats. */
export function PlayerPickGrid({
  players,
  onPick,
  disabled,
  selectedId,
}: {
  players: SeatLike[];
  onPick: (id: string) => void;
  disabled?: boolean;
  selectedId?: string | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[867px] flex-wrap justify-center gap-1 sm:gap-2">
      {players.map((p) => {
        const selected = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id)}
            disabled={disabled}
            aria-pressed={selected}
            className={`group relative flex aspect-[1082/1454] w-[117px] max-w-[calc(20%-0.4rem)] min-w-0 flex-col items-center justify-center bg-black/40 px-[12%] py-[13%] shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:max-w-[117px] ${
              selected ? "scale-[1.04] brightness-125" : "hover:scale-[1.03] hover:brightness-110"
            }`}
          >
            <Image
              src="/werewolf-game/system/select-avatar-frame.png"
              alt=""
              fill
              sizes="117px"
              className="pointer-events-none z-10 object-fill"
            />
            <span
              className={`absolute left-1/2 top-[17%] z-20 aspect-square w-[56%] -translate-x-1/2 overflow-hidden rounded-full border bg-grey-950 ${
                selected
                  ? "border-red-400 shadow-[0_0_16px_rgba(239,68,68,0.85)]"
                  : "border-amber-500/80 shadow-[0_0_0_2px_#0a0806]"
              }`}
            >
              {p.avatar ? (
                <AvatarMedia avatar={p.avatar} sizes="72px" className="object-cover object-top" />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center font-bold text-grey-950"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.slice(0, 1).toUpperCase() || "?"}
                </span>
              )}
            </span>
            <span className="absolute bottom-[18%] left-1/2 z-20 w-[72%] -translate-x-1/2 truncate text-center font-serif text-[10px] font-bold text-[#ead9b6]">
              {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
