import type { AuthResponse } from "@/shared";
import { buildSession } from "@/server/services/session-service";
import { userRepo } from "@/server/repositories";
import { currentUserId, handleError, jsonError, jsonOk } from "@/server/http";
import { createError, ErrorCodes } from "@/shared";

export async function GET() {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return jsonError(createError(ErrorCodes.AUTH_UNAUTHENTICATED, "Not authenticated.", 401));
    }
    const user = await userRepo.findById(userId);
    if (!user) {
      return jsonError(createError(ErrorCodes.AUTH_UNAUTHENTICATED, "Not authenticated.", 401));
    }
    return jsonOk<AuthResponse>({ session: buildSession(userId, user.username) });
  } catch (e) {
    return handleError(e);
  }
}
