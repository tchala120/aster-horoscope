import type { AssetRepo, HistoryRepo, MatchScoreRepo, SchoolRepo, UserRepo } from "./types";
import {
  memoryHistoryRepo,
  memoryMatchScoreRepo,
  memoryUserRepo,
  missionRepo,
  rewardRepo,
  stateRepo,
} from "./memory";
import { prismaAssetRepo } from "./prisma-asset-repo";
import { prismaUserRepo } from "./prisma-user-repo";
import { prismaHistoryRepo } from "./prisma-history-repo";
import { prismaMatchScoreRepo } from "./prisma-match-score-repo";
import { prismaSchoolRepo } from "./prisma-school-repo";

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

// Aster School requires a database (PDF blobs + relational engagement data);
// it always uses the Prisma store.
export const schoolRepo: SchoolRepo = prismaSchoolRepo;
export const assetRepo: AssetRepo = prismaAssetRepo;

export { stateRepo, missionRepo, rewardRepo };
