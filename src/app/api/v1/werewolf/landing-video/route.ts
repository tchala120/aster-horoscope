import { NextResponse } from "next/server";
import { B2Error, getSignedB2Url } from "@/server/backblaze";

const FILE_NAME = "werewolf-landing-video.mp4";

/** Redirects to a freshly-signed Backblaze B2 URL for the landing video, keeping the
 *  B2 key server-side only. The <video> tag just points at this route. */
export async function GET() {
  try {
    const url = await getSignedB2Url(FILE_NAME);
    return NextResponse.redirect(url, { status: 302 });
  } catch (e) {
    const message = e instanceof B2Error ? e.message : "Could not load the landing video.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
