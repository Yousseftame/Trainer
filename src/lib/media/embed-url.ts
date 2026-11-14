export type EmbedPlayback = {
  type: "iframe" | "video"
  url: string
}

/**
 * Normalize a raw video URL into either an embed iframe src or a direct video src.
 * Shared by ContentPreviewDialog and the live workout session player.
 */
export function toEmbedUrl(rawUrl: string): EmbedPlayback {
  const trimmed = rawUrl.trim()
  if (
    trimmed.includes("youtube.com/watch?v=") ||
    trimmed.includes("youtu.be/") ||
    trimmed.includes("youtube.com/embed/")
  ) {
    const match =
      trimmed.match(/[?&]v=([^&]+)/)?.[1] ||
      trimmed.match(/youtu\.be\/([^?&]+)/)?.[1] ||
      trimmed.match(/youtube\.com\/embed\/([^?&]+)/)?.[1]
    if (match) {
      return {
        type: "iframe",
        url: `https://www.youtube.com/embed/${match}`,
      }
    }
  }
  if (trimmed.includes("vimeo.com/") && !trimmed.includes("player.vimeo.com")) {
    const id = trimmed.split("vimeo.com/")[1]?.split(/[?&/]/)[0]
    if (id && /^\d+$/.test(id)) {
      return {
        type: "iframe",
        url: `https://player.vimeo.com/video/${id}`,
      }
    }
  }
  if (
    trimmed.includes("iframe.mediadelivery.net") ||
    trimmed.includes("customer-") ||
    trimmed.includes("/embed/")
  ) {
    return { type: "iframe", url: trimmed }
  }
  return { type: "video", url: trimmed }
}

function setOrReplaceQuery(url: string, key: string, value: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set(key, value)
    return parsed.toString()
  } catch {
    const re = new RegExp(`([?&])${key}=[^&]*`)
    if (re.test(url)) {
      return url.replace(re, `$1${key}=${value}`)
    }
    return `${url}${url.includes("?") ? "&" : "?"}${key}=${value}`
  }
}

/** Apply autoplay / mute / loop query flags for embed iframes (YouTube, Vimeo, etc.). */
export function withEmbedPlaybackParams(
  url: string,
  options: { muted: boolean; autoplay?: boolean; loop?: boolean },
): string {
  let next = url
  if (options.autoplay !== false) {
    next = setOrReplaceQuery(next, "autoplay", "1")
  }
  next = setOrReplaceQuery(next, "mute", options.muted ? "1" : "0")
  // YouTube also accepts `muted`
  if (next.includes("youtube.com") || next.includes("youtu.be")) {
    next = setOrReplaceQuery(next, "muted", options.muted ? "1" : "0")
  }
  if (options.loop !== false) {
    next = setOrReplaceQuery(next, "loop", "1")
    // YouTube loop requires playlist=videoId
    const ytId = next.match(/youtube\.com\/embed\/([^?&]+)/)?.[1]
    if (ytId) {
      next = setOrReplaceQuery(next, "playlist", ytId)
    }
  }
  return next
}
