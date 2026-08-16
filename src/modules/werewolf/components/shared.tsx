"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { AvatarMedia } from "./AvatarMedia";

/** The bits RolePortrait needs — callers resolve ROLES[roleId] and pass the result down. */
export interface RoleDisplay {
  label: string;
  portrait: string;
}

export const TEAM_LABEL: Record<string, string> = {
  village: "The Village",
  werewolf: "The Werewolves",
};

/** Full-bleed mood art behind a phase, with a dark gradient for text legibility. */
export function Backdrop({ src }: { src: string }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <Image src={src} alt="" fill sizes="100vw" className="object-cover" priority />
      <div className="absolute inset-0 bg-grey-950/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-grey-950 via-grey-950/40 to-transparent" />
    </div>
  );
}

/** Sun/moon glow badge marking day vs. night phases. */
export function PhaseIndicator({ isNight }: { isNight: boolean }) {
  return (
    <span
      aria-hidden
      className="relative h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-amber-800/50 bg-black/40 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.7)]"
      style={{
        boxShadow: isNight ? "0 0 14px rgba(96,165,250,0.5)" : "0 0 14px rgba(255,212,90,0.5)",
      }}
    >
      <Image
        src={isNight ? "/werewolf-game/icon-moon.png" : "/werewolf-game/icon-sun.png"}
        alt=""
        fill
        sizes="36px"
        className="object-contain"
      />
    </span>
  );
}

/** Bust portrait for a role — only ever rendered where that role is meant to be public. */
export function RolePortrait({
  role,
  size = 96,
  fit = "contain",
  frame = true,
}: {
  role: RoleDisplay;
  size?: number;
  /** "cover" fills the square edge-to-edge (crops); "contain" (default) letterboxes with padding. */
  fit?: "contain" | "cover";
  /** false drops the background/ring square so a transparent-bg image stands on its own. */
  frame?: boolean;
}) {
  return (
    <div
      className={`relative mx-auto overflow-hidden rounded-sm ${frame ? "border border-amber-900/50 bg-black/45 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.75)]" : ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={role.portrait}
        alt={role.label}
        fill
        sizes={`${size}px`}
        className={fit === "cover" ? "object-cover" : "object-contain p-1"}
      />
    </div>
  );
}

/** Decorative scroll banner with centered caption text, used on setup/lobby screens. */
export function Banner({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex w-full max-w-xs items-center justify-center">
      <Image src="/werewolf-game/banner.png" alt="" width={320} height={120} className="w-full" />
      <p className="absolute px-8 text-center text-text-sm font-semibold uppercase tracking-[0.15em] text-[#f3e6c8]">
        {children}
      </p>
    </div>
  );
}

export function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-sm border border-amber-700/60 bg-gradient-to-b from-[#6e351d] via-[#4d1d14] to-[#280c0b] px-8 py-3 font-serif text-text-md font-black uppercase tracking-[0.12em] text-[#f3dfb6] shadow-[inset_0_1px_0_rgba(255,221,153,0.2),0_6px_18px_rgba(0,0,0,0.4)] transition enabled:hover:scale-[1.02] enabled:hover:border-amber-500 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      {children}
    </button>
  );
}

/** A shared "here's what happened, tap to continue" card (dawn / day-result). */
export function AnnouncementPanel({
  title,
  message,
  revealedPlayer,
  onContinue,
  continueLabel = "Continue",
}: {
  title: string;
  message: string;
  revealedPlayer?: { avatar?: string; color: string; name: string };
  onContinue: () => void;
  continueLabel?: string;
}) {
  const [showDeadStyle, setShowDeadStyle] = useState(false);
  useEffect(() => {
    if (!revealedPlayer) return;
    const timer = window.setTimeout(() => setShowDeadStyle(true), 1650);
    return () => window.clearTimeout(timer);
  }, [revealedPlayer]);

  return (
    <div className="relative isolate mx-auto flex w-full max-w-[650px] flex-col items-center gap-4 overflow-hidden rounded-[24px] border-2 border-[#8b633c] bg-[radial-gradient(circle_at_50%_0%,rgba(105,70,35,0.28),transparent_38%),linear-gradient(145deg,rgba(38,27,18,0.98),rgba(12,10,8,0.99)_58%,rgba(29,18,12,0.98))] px-[6%] py-10 text-center shadow-[inset_0_0_0_2px_#160e09,inset_0_0_0_4px_rgba(190,132,70,0.24),inset_0_0_50px_rgba(0,0,0,0.8),0_24px_45px_rgba(0,0,0,0.75)] sm:py-12">
      <span className="pointer-events-none absolute inset-3 -z-10 rounded-[16px] border border-[#76502f]/70" />
      <span className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
      <span className="pointer-events-none absolute inset-x-[8%] bottom-0 h-px bg-gradient-to-r from-transparent via-red-800/60 to-transparent" />
      <p className="werewolf-stage-kicker text-amber-300">
        {title}
      </p>
      {revealedPlayer && (
        <div className="werewolf-kill-reveal relative aspect-[1082/1454] w-[160px] bg-black/40 shadow-[0_4px_14px_rgba(0,0,0,0.55)]">
          <Image
            src="/werewolf-game/system/select-avatar-frame.png"
            alt=""
            fill
            sizes="160px"
            className="pointer-events-none z-10 object-fill"
          />
          <div
            className={`absolute left-1/2 top-[15%] z-20 aspect-square w-[64%] -translate-x-1/2 overflow-hidden rounded-full border border-red-400/90 bg-grey-950 shadow-[0_0_0_2px_#0a0806,0_0_16px_rgba(239,68,68,0.65)] transition duration-500 ${
              showDeadStyle ? "grayscale contrast-75 brightness-50" : ""
            }`}
          >
            {revealedPlayer.avatar ? (
              <AvatarMedia
                avatar={revealedPlayer.avatar}
                sizes="104px"
                className="object-cover object-top"
                alt={revealedPlayer.name}
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center font-bold text-grey-950"
                style={{ backgroundColor: revealedPlayer.color }}
              >
                {revealedPlayer.name.slice(0, 1).toUpperCase() || "?"}
              </span>
            )}
            {showDeadStyle && (
              <span
                aria-label={`${revealedPlayer.name} was eliminated`}
                className="absolute inset-0 z-30 block"
              >
                <span className="absolute left-1/2 top-1/2 h-[5px] w-[125%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full border border-grey-950 bg-grey-300/90 shadow-[0_0_4px_#000]" />
                <span className="absolute left-1/2 top-1/2 h-[5px] w-[125%] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full border border-grey-950 bg-grey-300/90 shadow-[0_0_4px_#000]" />
              </span>
            )}
          </div>
          <p
            className={`absolute bottom-[18%] left-1/2 z-20 w-[72%] -translate-x-1/2 truncate font-serif text-[10px] font-bold transition-colors duration-500 ${
              showDeadStyle ? "text-grey-500 line-through" : "text-[#ead9b6]"
            }`}
          >
            {revealedPlayer.name}
          </p>
        </div>
      )}
      <p className="text-text-md text-grey-200">{message}</p>
      {continueLabel === "Gather the village" ? (
        <button
          type="button"
          onClick={onContinue}
          aria-label="Gather the village"
          className="relative aspect-[3/1] w-56 transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <Image
            src="/werewolf-game/system/gather-the-village-button.png"
            alt="Gather the village"
            fill
            sizes="224px"
            className="object-contain"
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={onContinue}
          aria-label={continueLabel}
          className="relative aspect-[3/1] w-56 transition hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <Image
            src="/werewolf-game/system/continue-button.png"
            alt={continueLabel}
            fill
            sizes="224px"
            className="object-contain"
          />
        </button>
      )}
    </div>
  );
}
