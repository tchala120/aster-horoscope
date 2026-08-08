"use client";

import Image from "next/image";

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
        <Image
          src={player.avatar}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover object-top"
        />
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
}: {
  player: SeatLike;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      <PlayerToken player={player} />
      <span className="truncate font-serif text-text-sm font-semibold text-[#e5d5b5]">{player.name}</span>
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
      className="flex items-center gap-2 rounded-sm border border-amber-900/45 bg-black/45 px-3 py-2 shadow-inner transition enabled:hover:border-amber-400/70 enabled:hover:bg-amber-950/25 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      {content}
    </button>
  );
}

/** A grid of pickable player seats. */
export function PlayerPickGrid({
  players,
  onPick,
}: {
  players: SeatLike[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {players.map((p) => (
        <PlayerSeat key={p.id} player={p} onClick={() => onPick(p.id)} />
      ))}
    </div>
  );
}
