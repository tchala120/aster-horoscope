"use client";

import Image from "next/image";
import type { CardArtworkTheme, Difficulty, HistoryEntry } from "@/shared";
import { getCardById } from "@/data/deck";
import { MISSION_CATALOG } from "@/data/mission-catalog";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const THEMES: readonly CardArtworkTheme[] = ["life", "love", "money", "work"];

/** Stable pseudo-random artwork theme per entry so a row's thumbnail never shifts. */
function themeFor(seed: string): CardArtworkTheme {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % THEMES.length;
  return THEMES[h];
}

function rewardLabel(entry: HistoryEntry): string {
  if (!entry.rewardGranted || entry.rewardType === null || entry.rewardValue === null) {
    return "No reward";
  }
  return entry.rewardType === "discount" ? `${entry.rewardValue}% off` : `${entry.rewardValue} ASTR`;
}

/** One completed-mission record: card thumbnail, quest, reward, and date. */
export function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const card = getCardById(entry.cardRef);
  const quest = MISSION_CATALOG.find((m) => m.featureId === entry.featureRef);
  const imageUrl = card?.artwork[themeFor(entry.id || entry.cardRef)];
  const rewarded = entry.rewardGranted && entry.rewardValue !== null;
  const isDiscount = entry.rewardType === "discount";
  const date = new Date(entry.completedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const rewardChip = rewarded
    ? isDiscount
      ? "bg-aster-sky-500/16 text-aster-sky-300"
      : "bg-aster-teal-500/16 text-aster-teal-300"
    : "bg-white/8 text-grey-400";

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-grey-gradient p-3 ring-1 ring-white/8 sm:p-4">
      {/* Card thumbnail */}
      <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-grey-900 ring-1 ring-white/16 sm:w-16">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={card?.name ?? "Tarot card"}
            fill
            className="object-cover"
            sizes="4rem"
          />
        ) : (
          <span aria-hidden className="block h-full w-full bg-brand-gradient" />
        )}
      </div>

      {/* Card + quest */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-text-md font-semibold text-grey-50">
            {card?.name ?? "Card"}
          </p>
          <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-text-sm text-grey-300">
            {DIFFICULTY_LABEL[entry.difficulty]}
          </span>
        </div>
        <p className="truncate text-text-sm font-medium text-aster-teal-400">
          {quest?.feature ?? entry.featureRef}
        </p>
        {quest?.action ? (
          <p className="truncate text-text-sm text-grey-400">{quest.action}</p>
        ) : null}
      </div>

      {/* Reward + date */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className={`rounded-full px-2.5 py-1 text-text-sm font-bold ${rewardChip}`}>
          {rewardLabel(entry)}
        </span>
        <span className="text-text-sm text-grey-500">{date}</span>
      </div>
    </div>
  );
}
