import { userRepo } from "@/server/repositories";
import { handleError, jsonOk, requireUserId } from "@/server/http";

/** Unlink the current user's wallet address. */
export async function DELETE() {
  try {
    const userId = await requireUserId();
    await userRepo.setWalletAddress(userId, null);
    return jsonOk({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
