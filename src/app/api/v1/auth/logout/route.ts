import { cookies } from "next/headers";
import { SESSION_COOKIE, destroySession } from "@/server/auth/session-store";
import { handleError, jsonOk } from "@/server/http";

export async function POST() {
  try {
    const store = await cookies();
    destroySession(store.get(SESSION_COOKIE)?.value);
    store.delete(SESSION_COOKIE);
    return jsonOk({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
