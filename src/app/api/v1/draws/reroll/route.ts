import type { DrawResponse } from "@/shared";
import { reroll } from "@/server/services/session-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";

export async function POST() {
  try {
    const userId = await requireUserId();
    return jsonOk<DrawResponse>({ daily: reroll(userId) });
  } catch (e) {
    return handleError(e);
  }
}
