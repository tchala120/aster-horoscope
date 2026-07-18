import type { AssetResponse } from "@/shared";
import { ErrorCodes } from "@/shared";
import { uploadAsset } from "@/server/services/asset-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

export const dynamic = "force-dynamic";

/** POST /api/v1/school/assets — upload an image for the rich text editor (multipart). */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw serviceError(ErrorCodes.VALIDATION, "An image file is required.", 400);
    }
    const data = new Uint8Array(await file.arrayBuffer());
    const asset = await uploadAsset(userId, data, file.type);
    return jsonOk<AssetResponse>({ url: asset.url }, 201);
  } catch (e) {
    return handleError(e);
  }
}
