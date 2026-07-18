import { deleteComment } from "@/server/services/school-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";

export const dynamic = "force-dynamic";

/** DELETE /api/v1/school/comments/:id — delete own comment (auth). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deleteComment(userId, id);
    return jsonOk({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
