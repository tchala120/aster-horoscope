import { startRoom } from "@/server/services/werewolf-room-service";
import { handleError, jsonOk } from "@/server/http";
import { serviceError } from "@/server/service-error";

interface StartRoomRequest {
  token?: string;
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const body = (await req.json().catch(() => null)) as StartRoomRequest | null;
    if (!body?.token) throw serviceError("WEREWOLF_VALIDATION", "token is required.", 400);
    return jsonOk(await startRoom(code, body.token));
  } catch (e) {
    return handleError(e);
  }
}
