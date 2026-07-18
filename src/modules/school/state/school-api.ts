import type {
  AssetResponse,
  AuthResponse,
  CommentInput,
  CommentsResponse,
  LessonDetailResponse,
  LessonInput,
  LessonResponse,
  LessonType,
  LessonsResponse,
  ReactionType,
  ReactionsResponse,
  ToggleReactionRequest,
} from "@/shared";
import { type AppError, ErrorCodes, createError } from "@/shared";
import { API_BASE, apiFetch } from "@/foundation/api/client";
import { type Result, err, ok } from "@/foundation/ui/result";

export interface ListParams {
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
  types?: LessonType[];
}

function qs(params: ListParams): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.q) sp.set("q", params.q);
  if (params.tag) sp.set("tag", params.tag);
  if (params.types?.length) sp.set("type", params.types.join(","));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** POST multipart form-data to `path` (apiFetch always sends JSON, so this bypasses it). */
async function multipartUpload<T>(path: string, form: FormData): Promise<Result<T, AppError>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const asError = body as AppError | null;
      return err(
        asError && typeof asError.code === "string"
          ? asError
          : createError(ErrorCodes.INTERNAL, "Upload failed", res.status),
      );
    }
    return ok(body as T);
  } catch {
    return err(createError(ErrorCodes.INTERNAL, "Network error", 0));
  }
}

/** Typed client for the Aster School API. */
export const schoolApi = {
  /** Current signed-in identity (401 error when anonymous). */
  session: () => apiFetch<AuthResponse>("/auth/session"),

  list: (params: ListParams = {}) => apiFetch<LessonsResponse>(`/school/lessons${qs(params)}`),
  get: (id: string) => apiFetch<LessonDetailResponse>(`/school/lessons/${id}`),
  createArticle: (input: LessonInput) =>
    apiFetch<LessonResponse>("/school/lessons", { method: "POST", body: JSON.stringify(input) }),
  createVideo: (input: LessonInput) =>
    apiFetch<LessonResponse>("/school/lessons", {
      method: "POST",
      body: JSON.stringify({ ...input, type: "video" }),
    }),
  createPdf: (form: FormData) => multipartUpload<LessonResponse>("/school/lessons", form),
  update: (id: string, input: LessonInput) =>
    apiFetch<LessonResponse>(`/school/lessons/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id: string) => apiFetch<{ ok: boolean }>(`/school/lessons/${id}`, { method: "DELETE" }),

  uploadImage: (form: FormData) => multipartUpload<AssetResponse>("/school/assets", form),

  comments: (id: string) => apiFetch<CommentsResponse>(`/school/lessons/${id}/comments`),
  addComment: (id: string, body: string) =>
    apiFetch<CommentsResponse>(`/school/lessons/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body } satisfies CommentInput),
    }),
  deleteComment: (commentId: string) =>
    apiFetch<{ ok: boolean }>(`/school/comments/${commentId}`, { method: "DELETE" }),

  reactions: (id: string) => apiFetch<ReactionsResponse>(`/school/lessons/${id}/reactions`),
  toggleReaction: (id: string, type: ReactionType) =>
    apiFetch<ReactionsResponse>(`/school/lessons/${id}/reactions`, {
      method: "POST",
      body: JSON.stringify({ type } satisfies ToggleReactionRequest),
    }),
};
