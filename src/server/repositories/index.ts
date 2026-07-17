import type { HistoryRepo, MatchScoreRepo, UserRepo } from "./types";
import {
  memoryHistoryRepo,
  memoryMatchScoreRepo,
  memoryUserRepo,
  missionRepo,
  rewardRepo,
  stateRepo,
} from "./memory";
import { prismaUserRepo } from "./prisma-user-repo";
import { prismaHistoryRepo } from "./prisma-history-repo";
import { prismaMatchScoreRepo } from "./prisma-match-score-repo";

/**
 * User + history storage: PostgreSQL (Prisma) when DATABASE_URL is configured,
 * otherwise an in-memory store (dev-without-Docker). The test runner always uses
 * the in-memory store so unit tests never require a live database. Daily state,
 * missions, and rewards remain in-memory for now.
 */
const useDatabase = Boolean(process.env.DATABASE_URL) && process.env.VITEST !== "true";

export const userRepo: UserRepo = useDatabase ? prismaUserRepo : memoryUserRepo;
export const historyRepo: HistoryRepo = useDatabase ? prismaHistoryRepo : memoryHistoryRepo;
export const matchScoreRepo: MatchScoreRepo = useDatabase ? prismaMatchScoreRepo : memoryMatchScoreRepo;

export { stateRepo, missionRepo, rewardRepo };
