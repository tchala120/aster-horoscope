import type { MatchScore } from "@/shared";
import { getPrisma } from "../db/prisma";
import type { MatchScoreRepo } from "./types";

/** Shape of a `match_scores` row as returned by Prisma. */
interface MatchScoreRow {
  id: string;
  name: string;
  moves: number;
  createdAt: Date;
}

function toScore(row: MatchScoreRow): MatchScore {
  return {
    id: row.id,
    name: row.name,
    moves: row.moves,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * PostgreSQL-backed Tarot Match ranking store (Prisma). The Prisma client is
 * created lazily (see getPrisma), so importing never opens a connection unless
 * the repo is used.
 */
export const prismaMatchScoreRepo: MatchScoreRepo = {
  async add(entry) {
    const row = await getPrisma().matchScore.create({
      data: { name: entry.name, moves: entry.moves },
    });
    return toScore(row);
  },

  async top(limit) {
    const rows = await getPrisma().matchScore.findMany({
      orderBy: [{ moves: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
    return rows.map(toScore);
  },
};
