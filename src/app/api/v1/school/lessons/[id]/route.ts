import type { LessonDetailResponse, LessonInput, LessonResponse } from "@/shared";
import { ErrorCodes } from "@/shared";
import { deleteLesson, getLesson, updateLesson } from "@/server/services/school-service";
import { currentUserId, handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

export const dynamic = "force-dynamic";

/** GET /api/v1/school/lessons/:id — public detail with engagement + viewer reactions. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const userId = await currentUserId();
    return jsonOk<LessonDetailResponse>(await getLesson(id, userId));
  } catch (e) {
    return handleError(e);
  }
}

/** PUT /api/v1/school/lessons/:id — update own lesson. */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as LessonInput | null;
    if (!body) throw serviceError(ErrorCodes.VALIDATION, "Invalid request body.", 400);
    const lesson = await updateLesson(userId, id, body);
    return jsonOk<LessonResponse>({ lesson });
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/v1/school/lessons/:id — delete own lesson. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deleteLesson(userId, id);
    return jsonOk({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
