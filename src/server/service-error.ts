import { type AppError, createError } from "@/shared";

/** Thrown by services; route handlers convert it to the standard error envelope. */
export class ServiceError extends Error {
  constructor(public readonly appError: AppError) {
    super(appError.message);
    this.name = "ServiceError";
  }
}

export function serviceError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>,
): ServiceError {
  return new ServiceError(createError(code, message, status, details));
}
