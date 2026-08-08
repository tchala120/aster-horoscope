"use client";

import type { ReactNode } from "react";
import Image from "next/image";

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
  deadRole,
  onContinue,
  continueLabel = "Continue",
}: {
  title: string;
  message: string;
  deadRole?: RoleDisplay;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <div className="werewolf-game-stage werewolf-game-stage--result mx-auto flex w-full max-w-sm flex-col items-center gap-4 px-7 py-8 text-center">
      <p className="werewolf-stage-kicker text-amber-300">
        {title}
      </p>
      {deadRole && <RolePortrait role={deadRole} size={88} />}
      <p className="text-text-md text-grey-200">{message}</p>
      <PrimaryButton onClick={onContinue}>{continueLabel}</PrimaryButton>
    </div>
  );
}
