import { handleError } from "@/server/http";
import { serviceError } from "@/server/service-error";

/**
 * Self-service signup is closed — Aster Horoscope is whitelist-only. Accounts are
 * provisioned by an admin (see prisma/seed.ts); this route only ever rejects.
 */
export async function POST() {
  try {
    throw serviceError("AUTH_002", "Registration is closed. Contact an admin for access.", 403);
  } catch (e) {
    return handleError(e);
  }
}
