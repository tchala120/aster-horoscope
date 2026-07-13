import type { MissionActionRequest } from "@/shared";
import { accept, complete, reject } from "@/server/services/mission-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as MissionActionRequest | null;
    switch (body?.action) {
      case "accept":
        return jsonOk(accept(userId, id));
      case "reject":
        return jsonOk(reject(userId, id));
      case "complete":
        return jsonOk(complete(userId, id));
      default:
        throw serviceError("VALIDATION_001", "action must be accept, reject, or complete.", 400);
    }
  } catch (e) {
    return handleError(e);
  }
}
