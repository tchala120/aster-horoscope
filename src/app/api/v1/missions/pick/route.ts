import type { PickRequest } from "@/shared";
import { pick } from "@/server/services/mission-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = (await req.json().catch(() => null)) as PickRequest | null;
    if (!body?.cardId) throw serviceError("VALIDATION_001", "cardId is required.", 400);
    return jsonOk(pick(userId, body.cardId), 201);
  } catch (e) {
    return handleError(e);
  }
}
