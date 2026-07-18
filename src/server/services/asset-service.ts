import { assetRepo } from "../repositories";
import { serviceError } from "../service-error";
import { ErrorCodes } from "@/shared";

// Vercel serverless functions cap request bodies at ~4.5 MB, so uploads through
// the API route must stay under that (matches the PDF upload limit).
export const IMAGE_MAX_MB = 4;
export const IMAGE_MAX_BYTES = IMAGE_MAX_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export async function uploadAsset(
  userId: string,
  data: Uint8Array,
  mimeType: string,
): Promise<{ id: string; url: string }> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw serviceError(ErrorCodes.VALIDATION, "Only PNG, JPEG, GIF, or WEBP images are allowed.", 400);
  }
  if (data.byteLength === 0) {
    throw serviceError(ErrorCodes.VALIDATION, "The image is empty.", 400);
  }
  if (data.byteLength > IMAGE_MAX_BYTES) {
    throw serviceError(ErrorCodes.VALIDATION, `Images must be ${IMAGE_MAX_MB} MB or smaller.`, 400);
  }
  const { id } = await assetRepo.create(userId, data, mimeType);
  return { id, url: `/api/v1/school/assets/${id}` };
}

export function getAsset(id: string): Promise<{ data: Uint8Array; mimeType: string } | null> {
  return assetRepo.get(id);
}
