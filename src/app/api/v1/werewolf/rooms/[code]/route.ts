import { deleteRoom, getRoomView } from "@/server/services/werewolf-room-service";
import { handleError, jsonOk } from "@/server/http";
import { serviceError } from "@/server/service-error";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const token = new URL(req.url).searchParams.get("token");
    if (!token) throw serviceError("WEREWOLF_VALIDATION", "token is required.", 400);
    return jsonOk(await getRoomView(code, token));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    // No token: a "delete from the open-rooms list" request (caller hasn't
    // joined). deleteRoom() only allows that while the room is still a lobby.
    const token = new URL(req.url).searchParams.get("token");
    await deleteRoom(code, token);
    return jsonOk({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
