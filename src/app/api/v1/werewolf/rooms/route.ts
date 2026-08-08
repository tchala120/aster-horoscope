import { createRoom, listOpenRooms } from "@/server/services/werewolf-room-service";
import { handleError, jsonOk } from "@/server/http";
import { serviceError } from "@/server/service-error";

interface CreateRoomRequest {
  name?: string;
  avatar?: string;
}

export async function GET() {
  try {
    return jsonOk(await listOpenRooms());
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as CreateRoomRequest | null;
    if (!body?.name) throw serviceError("WEREWOLF_VALIDATION", "name is required.", 400);
    return jsonOk(await createRoom(body.name, body.avatar), 201);
  } catch (e) {
    return handleError(e);
  }
}
