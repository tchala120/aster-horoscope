import { PrismaClient } from "@prisma/client";

/**
 * Lazily-created Prisma client, cached on globalThis so Next.js dev hot-reloads
 * don't spawn a new connection pool on every reload. Only instantiated when
 * actually used (i.e. when DATABASE_URL is configured).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
