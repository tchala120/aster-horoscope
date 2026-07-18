import { getAsset } from "@/server/services/asset-service";

export const dynamic = "force-dynamic";

/** GET /api/v1/school/assets/:id — serve an uploaded image inline (public). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const asset = await getAsset(id);
    if (!asset) return new Response("Not found", { status: 404 });

    const body = new Uint8Array(asset.data);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Error serving asset", { status: 500 });
  }
}
