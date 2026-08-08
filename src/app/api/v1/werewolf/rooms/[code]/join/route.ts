import { joinRoom } from "@/server/services/werewolf-room-service";
import { handleError, jsonOk } from "@/server/http";
import { serviceError } from "@/server/service-error";

interface JoinRoomRequest {
  name?: string;
  avatar?: string;
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const body = (await req.json().catch(() => null)) as JoinRoomRequest | null;
    if (!body?.name) throw serviceError("WEREWOLF_VALIDATION", "name is required.", 400);
    return jsonOk(await joinRoom(code, body.name, body.avatar), 201);
  } catch (e) {
    return handleError(e);
  }
}
