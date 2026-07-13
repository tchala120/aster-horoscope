import { type AppError, ErrorCodes, createError } from "@/shared";
import { err, ok, type Result } from "@/foundation/ui/result";

export const API_BASE = "/api/v1";

/**
 * Auth-aware fetch wrapper. Sends the session cookie, parses the standard error
 * envelope, and returns a typed Result. No endpoint-specific logic lives here.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<Result<T, AppError>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });

    const body: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      const asError = body as AppError | null;
      return err(
        asError && typeof asError.code === "string"
          ? asError
          : createError(ErrorCodes.INTERNAL, "Request failed", res.status),
      );
    }

    return ok(body as T);
  } catch {
    return err(createError(ErrorCodes.INTERNAL, "Network error", 0));
  }
}
