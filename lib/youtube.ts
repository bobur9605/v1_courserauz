const YOUTUBE_ID_RE = /^[\w-]{11}$/;

/** Extract YouTube video id from a URL or raw id. Returns null if invalid. */
export function parseYoutubeVideoId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (YOUTUBE_ID_RE.test(s)) return s;

  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && YOUTUBE_ID_RE.test(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      const v = u.searchParams.get("v");
      if (v && YOUTUBE_ID_RE.test(v)) return v;

      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1] && YOUTUBE_ID_RE.test(parts[1])) {
        return parts[1];
      }
      if (parts[0] === "shorts" && parts[1] && YOUTUBE_ID_RE.test(parts[1])) {
        return parts[1];
      }
      if (parts[0] === "live" && parts[1] && YOUTUBE_ID_RE.test(parts[1])) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
