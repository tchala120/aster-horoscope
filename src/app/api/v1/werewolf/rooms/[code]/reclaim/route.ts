import { reclaimSeat } from "@/server/services/werewolf-room-service";
import { handleError, jsonOk } from "@/server/http";
import { serviceError } from "@/server/service-error";

interface ReclaimRequest {
  name?: string;
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const body = (await req.json().catch(() => null)) as ReclaimRequest | null;
    if (!body?.name) throw serviceError("WEREWOLF_VALIDATION", "name is required.", 400);
    return jsonOk(await reclaimSeat(code, body.name), 201);
  } catch (e) {
    return handleError(e);
  }
}
