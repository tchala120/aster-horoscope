import { randomUUID } from "node:crypto";

/** httpOnly cookie name carrying the opaque session id. */
export const SESSION_COOKIE = "aster_session";

/**
 * In-memory session registry (sessionId -> userId).
 * Swap for a durable store (DB/Redis) alongside the Prisma adapter.
 */
const sessions = new Map<string, string>();

export function createSession(userId: string): string {
  const id = randomUUID();
  sessions.set(id, userId);
  return id;
}

export function getUserIdForSession(sessionId: string | undefined): string | null {
  if (!sessionId) return null;
  return sessions.get(sessionId) ?? null;
}

export function destroySession(sessionId: string | undefined): void {
  if (sessionId) sessions.delete(sessionId);
}
