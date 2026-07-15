import { getState } from "@/server/services/session-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";

export async function GET() {
  try {
    const userId = await requireUserId();
    return jsonOk(await getState(userId));
  } catch (e) {
    return handleError(e);
  }
}
