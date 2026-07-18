// Matches the 11-char video id out of watch?v=, youtu.be/, shorts/, and embed/ links.
const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractYoutubeId(url: string): string | null {
  return YOUTUBE_RE.exec(url)?.[1] ?? null;
}

interface OEmbed {
  author_name?: string;
}

/**
 * The channel name for a video, via YouTube's keyless oEmbed endpoint.
 * Best-effort: returns null on any network/parse failure so callers never block on it.
 */
export async function fetchYoutubeAuthor(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://youtu.be/${videoId}`)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as OEmbed;
    return data.author_name?.trim() || null;
  } catch {
    return null;
  }
}

interface VideosListResponse {
  items?: { id: string; statistics?: { viewCount?: string } }[];
}

/**
 * Live view counts for up to 50 videos via the YouTube Data API v3 (`videos.list`).
 * Requires YOUTUBE_API_KEY; returns an empty map when it's unset or the request fails,
 * so view counts simply stay absent rather than breaking the feed.
 */
export async function fetchYoutubeViewCounts(videoIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || videoIds.length === 0) return map;

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "statistics");
    url.searchParams.set("id", videoIds.slice(0, 50).join(","));
    url.searchParams.set("key", apiKey);
    const res = await fetch(url);
    if (!res.ok) return map;
    const data = (await res.json()) as VideosListResponse;
    for (const item of data.items ?? []) {
      const count = Number(item.statistics?.viewCount);
      if (Number.isFinite(count)) map.set(item.id, count);
    }
  } catch {
    // Leave the map as-is (partial results are fine, total failure just yields no views).
  }
  return map;
}
