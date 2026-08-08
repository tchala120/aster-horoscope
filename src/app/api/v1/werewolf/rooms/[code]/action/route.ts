import type { WerewolfAction } from "@/modules/werewolf/core/room";
import { applyRoomAction } from "@/server/services/werewolf-room-service";
import { handleError, jsonOk } from "@/server/http";
import { serviceError } from "@/server/service-error";

interface ActionRequest {
  token?: string;
  action?: WerewolfAction;
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const body = (await req.json().catch(() => null)) as ActionRequest | null;
    if (!body?.token) throw serviceError("WEREWOLF_VALIDATION", "token is required.", 400);
    if (!body.action?.type) throw serviceError("WEREWOLF_VALIDATION", "action is required.", 400);
    return jsonOk(await applyRoomAction(code, body.token, body.action));
  } catch (e) {
    return handleError(e);
  }
}
