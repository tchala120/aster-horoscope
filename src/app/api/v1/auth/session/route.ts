import type { AuthResponse } from "@/shared";
import { buildSession } from "@/server/services/session-service";
import { currentUserId, handleError, jsonError, jsonOk } from "@/server/http";
import { createError, ErrorCodes } from "@/shared";

export async function GET() {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return jsonError(createError(ErrorCodes.AUTH_UNAUTHENTICATED, "Not authenticated.", 401));
    }
    return jsonOk<AuthResponse>({ session: buildSession(userId) });
  } catch (e) {
    return handleError(e);
  }
}
