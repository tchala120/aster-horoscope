import type { LessonInput, LessonResponse, LessonsResponse } from "@/shared";
import { ErrorCodes } from "@/shared";
import {
  createArticle,
  createPdf,
  createVideo,
  listLessons,
  resolveAuthorName,
} from "@/server/services/school-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

export const dynamic = "force-dynamic";

/** GET /api/v1/school/lessons — public, paginated feed (search `q`, filter `tag`, filter `type`). */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const typeParam = url.searchParams.get("type");
    const res = await listLessons({
      page: Number(url.searchParams.get("page")) || 1,
      limit: Number(url.searchParams.get("limit")) || undefined,
      q: url.searchParams.get("q") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      types: typeParam ? typeParam.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    });
    return jsonOk<LessonsResponse>(res);
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/v1/school/lessons — create an article or video (JSON) or a PDF (multipart). */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const name = await resolveAuthorName(userId);
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw serviceError(ErrorCodes.VALIDATION, "A PDF file is required.", 400);
      }
      if (file.type && file.type !== "application/pdf") {
        throw serviceError(ErrorCodes.VALIDATION, "Only PDF files are allowed.", 400);
      }
      let tags: string[] = [];
      const rawTags = form.get("tags");
      if (typeof rawTags === "string" && rawTags) {
        try {
          const parsed: unknown = JSON.parse(rawTags);
          if (Array.isArray(parsed)) tags = parsed.map(String);
        } catch {
          tags = [];
        }
      }
      const buf = new Uint8Array(await file.arrayBuffer());
      const lesson = await createPdf(
        userId,
        name,
        {
          title: String(form.get("title") ?? ""),
          summary: form.get("summary") ? String(form.get("summary")) : undefined,
          tags,
          fileName: file.name || "document.pdf",
        },
        buf,
      );
      return jsonOk<LessonResponse>({ lesson }, 201);
    }

    const body = (await req.json().catch(() => null)) as LessonInput | null;
    if (!body) throw serviceError(ErrorCodes.VALIDATION, "Invalid request body.", 400);
    const lesson =
      body.type === "video" ? await createVideo(userId, name, body) : await createArticle(userId, name, body);
    return jsonOk<LessonResponse>({ lesson }, 201);
  } catch (e) {
    return handleError(e);
  }
}
