import type { Difficulty, HistoryEntry, RewardType } from "@/shared";
import { getPrisma } from "../db/prisma";
import type { HistoryRepo } from "./types";

/** Shape of a `history_entries` row as returned by Prisma. */
interface HistoryRow {
  id: string;
  cardRef: string;
  featureRef: string;
  difficulty: string;
  rewardType: string | null;
  rewardValue: number | null;
  rewardGranted: boolean;
  completedAt: Date;
}

function toEntry(row: HistoryRow): HistoryEntry {
  return {
    id: row.id,
    cardRef: row.cardRef,
    featureRef: row.featureRef,
    difficulty: row.difficulty as Difficulty,
    rewardType: row.rewardType as RewardType | null,
    rewardValue: row.rewardValue,
    rewardGranted: row.rewardGranted,
    completedAt: row.completedAt.toISOString(),
  };
}

/**
 * PostgreSQL-backed history store (Prisma). One row per completed mission,
 * scoped by userId. The Prisma client is created lazily (see getPrisma), so
 * importing this module never opens a connection unless the repo is used.
 */
export const prismaHistoryRepo: HistoryRepo = {
  async add(entry) {
    const row = await getPrisma().historyEntry.create({
      data: {
        userId: entry.userId,
        cardRef: entry.cardRef,
        featureRef: entry.featureRef,
        difficulty: entry.difficulty,
        rewardType: entry.rewardType,
        rewardValue: entry.rewardValue,
        rewardGranted: entry.rewardGranted,
      },
    });
    return toEntry(row);
  },

  async listByUser(userId) {
    const rows = await getPrisma().historyEntry.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
    });
    return rows.map(toEntry);
  },
};
