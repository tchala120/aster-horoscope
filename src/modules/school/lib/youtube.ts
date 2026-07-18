// Matches the 11-char video id out of watch?v=, youtu.be/, shorts/, and embed/ links.
const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/** The video's thumbnail image URL, or null if `url` isn't a recognizable YouTube link. */
export function youtubeThumbnail(url: string): string | null {
  const match = YOUTUBE_RE.exec(url);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null;
}
