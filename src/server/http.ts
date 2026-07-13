import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { type AppError, ErrorCodes, createError } from "@/shared";
import { ServiceError } from "./service-error";
import { SESSION_COOKIE, getUserIdForSession } from "./auth/session-store";

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonError(error: AppError): NextResponse {
  return NextResponse.json(error, { status: error.status });
}

/** Convert thrown ServiceErrors to the standard envelope; anything else -> 500. */
export function handleError(e: unknown): NextResponse {
  if (e instanceof ServiceError) return jsonError(e.appError);
  return jsonError(createError(ErrorCodes.INTERNAL, "Internal server error", 500));
}

export async function currentUserId(): Promise<string | null> {
  const store = await cookies();
  return getUserIdForSession(store.get(SESSION_COOKIE)?.value);
}

export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) {
    throw new ServiceError(
      createError(ErrorCodes.AUTH_UNAUTHENTICATED, "Not authenticated.", 401),
    );
  }
  return id;
}
