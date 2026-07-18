import type { CommentInput, CommentsResponse } from "@/shared";
import { addComment, listComments, resolveAuthorName } from "@/server/services/school-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";

export const dynamic = "force-dynamic";

/** GET /api/v1/school/lessons/:id/comments — public. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    return jsonOk<CommentsResponse>(await listComments(id));
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/v1/school/lessons/:id/comments — add a comment (auth). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const name = await resolveAuthorName(userId);
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as CommentInput | null;
    return jsonOk<CommentsResponse>(await addComment(userId, name, id, body?.body), 201);
  } catch (e) {
    return handleError(e);
  }
}
