import { createHmac, timingSafeEqual } from "node:crypto";

/** httpOnly cookie name carrying the signed session token. */
export const SESSION_COOKIE = "aster_session";

/**
 * Stateless, signed session tokens of the form `<userId>.<hmac>`.
 *
 * The token is self-contained and verified with a server-side secret, so ANY
 * instance can validate it. The previous implementation kept sessions in an
 * in-memory Map, which broke on serverless (Vercel): a session created during
 * login lived in one instance's memory and was missing on the next request's
 * instance, silently logging users out ("can't log in").
 */
function signingKey(): string {
  // SESSION_SECRET if provided; otherwise derive a stable per-environment key
  // from DATABASE_URL (already a secret, present in prod + local). Never commit
  // a real secret — this keeps the key out of the repo.
  return process.env.SESSION_SECRET || process.env.DATABASE_URL || "aster-dev-insecure-secret";
}

function sign(userId: string): string {
  return createHmac("sha256", signingKey()).update(userId).digest("base64url");
}

/** Issue a signed session token for a user. */
export function createSession(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

/** Verify a session token; returns its userId, or null if missing/invalid. */
export function getUserIdForSession(token: string | undefined): string | null {
  if (!token) return null;
  const sep = token.lastIndexOf(".");
  if (sep <= 0) return null;
  const userId = token.slice(0, sep);
  const provided = Buffer.from(token.slice(sep + 1));
  const expected = Buffer.from(sign(userId));
  if (provided.length !== expected.length) return null;
  return timingSafeEqual(provided, expected) ? userId : null;
}

/**
 * Stateless sessions have no server-side record to remove; the logout route
 * clears the cookie, which ends the session for that client.
 */
export function destroySession(token?: string): void {
  void token; // no-op — clearing the cookie (in the logout route) is sufficient
}
