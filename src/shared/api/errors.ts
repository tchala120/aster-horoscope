/** Standard error envelope returned by all /api/v1 route handlers. */
export interface AppError {
  code: string;
  message: string;
  status: number;
  requestId?: string;
  details?: Record<string, unknown>;
}

/** Shared error codes. Domain-specific codes follow the `[DOMAIN]_[NUMBER]` pattern. */
export const ErrorCodes = {
  VALIDATION: "VALIDATION_001",
  AUTH_UNAUTHENTICATED: "AUTH_001",
  AUTH_FORBIDDEN: "AUTH_002",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL: "INTERNAL",
} as const;

export function createError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>,
): AppError {
  return { code, message, status, ...(details ? { details } : {}) };
}
