import { getLessonFile } from "@/server/services/school-service";

export const dynamic = "force-dynamic";

/** GET /api/v1/school/lessons/:id/file — serve the lesson's PDF inline (public). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const file = await getLessonFile(id);
    if (!file) return new Response("Not found", { status: 404 });

    const body = new Uint8Array(file.data);
    const safeName = file.fileName.replace(/["\\\r\n]/g, "");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new Response("Error serving file", { status: 500 });
  }
}
