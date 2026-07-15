import type { HistoryResponse } from "@/shared";
import { historyRepo } from "@/server/repositories";
import { handleError, jsonOk, requireUserId } from "@/server/http";

/** GET /api/v1/history — the authenticated player's own completed-mission history. */
export async function GET() {
  try {
    const userId = await requireUserId();
    const entries = await historyRepo.listByUser(userId);
    return jsonOk<HistoryResponse>({ entries });
  } catch (e) {
    return handleError(e);
  }
}
