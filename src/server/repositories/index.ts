import type { UserRepo } from "./types";
import { memoryUserRepo, missionRepo, stateRepo } from "./memory";
import { prismaUserRepo } from "./prisma-user-repo";

/**
 * User storage: PostgreSQL (Prisma) when DATABASE_URL is configured, otherwise
 * an in-memory store (dev-without-Docker). The test runner always uses the
 * in-memory store so unit tests never require a live database. Daily state and
 * missions remain in-memory for now.
 */
const useDatabase = Boolean(process.env.DATABASE_URL) && process.env.VITEST !== "true";

export const userRepo: UserRepo = useDatabase ? prismaUserRepo : memoryUserRepo;

export { stateRepo, missionRepo };
