// Matches the 11-char video id out of watch?v=, youtu.be/, shorts/, and embed/ links.
const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function youtubeId(url: string): string | null {
  return YOUTUBE_RE.exec(url)?.[1] ?? null;
}

/** The video's thumbnail image URL, or null if `url` isn't a recognizable YouTube link. */
export function youtubeThumbnail(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** The video's embeddable player URL, or null if `url` isn't a recognizable YouTube link. */
export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
