/** Soft caps — keep Storage egress predictable for public hero assets. */
export const HOME_HERO_UPLOAD_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
} as const

export const HOME_HERO_STORAGE_PREFIX = "website/home/hero/" as const

/** Partner logos are small — tighter cap than hero backgrounds. */
export const TRUSTED_PARTNERS_UPLOAD_LIMITS = {
  imageBytes: 2 * 1024 * 1024,
} as const

export const TRUSTED_PARTNERS_STORAGE_PREFIX =
  "website/home/trusted-partners/" as const

export const WHO_I_AM_UPLOAD_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
} as const

export const WHO_I_AM_STORAGE_PREFIX = "website/home/who-i-am/" as const

/** Fitness dream gallery cards — similar weight to hero photos. */
export const FITNESS_DREAM_UPLOAD_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
} as const

export const FITNESS_DREAM_STORAGE_PREFIX =
  "website/home/fitness-dream/" as const

export function sanitizeWebsiteSegment(raw: string): string {
  return (
    raw
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, "")
      .slice(0, 80) || "asset"
  )
}

export function extensionForMime(mimeType?: string | null): string {
  const mime = (mimeType || "").toLowerCase()
  if (mime.includes("png")) return "png"
  if (mime.includes("webp")) return "webp"
  if (mime.includes("gif")) return "gif"
  if (mime.includes("svg")) return "svg"
  return "jpg"
}

/**
 * Public hero image path:
 * website/home/hero/{slideId}/{file}.{ext}
 */
export function buildHomeHeroImagePath(params: {
  slideId: string
  mimeType?: string | null
  fileName?: string | null
}): string {
  const slideId = sanitizeWebsiteSegment(params.slideId)
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `bg.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${HOME_HERO_STORAGE_PREFIX}${slideId}/${withExt}`
}

export function isHomeHeroStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(HOME_HERO_STORAGE_PREFIX))
}

/**
 * Public partner logo path:
 * website/home/trusted-partners/{logoId}/{file}.{ext}
 */
export function buildTrustedPartnerLogoPath(params: {
  logoId: string
  mimeType?: string | null
  fileName?: string | null
}): string {
  const logoId = sanitizeWebsiteSegment(params.logoId)
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `logo.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${TRUSTED_PARTNERS_STORAGE_PREFIX}${logoId}/${withExt}`
}

export function isTrustedPartnerStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(TRUSTED_PARTNERS_STORAGE_PREFIX))
}

/**
 * Who I Am section photo:
 * website/home/who-i-am/{file}.{ext}
 */
export function buildWhoIAmImagePath(params: {
  mimeType?: string | null
  fileName?: string | null
}): string {
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `photo.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${WHO_I_AM_STORAGE_PREFIX}${withExt}`
}

export function isWhoIAmStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(WHO_I_AM_STORAGE_PREFIX))
}

/**
 * Fitness dream card image:
 * website/home/fitness-dream/{cardId}/{file}.{ext}
 */
export function buildFitnessDreamImagePath(params: {
  cardId: string
  mimeType?: string | null
  fileName?: string | null
}): string {
  const cardId = sanitizeWebsiteSegment(params.cardId)
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `card.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${FITNESS_DREAM_STORAGE_PREFIX}${cardId}/${withExt}`
}

export function isFitnessDreamStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(FITNESS_DREAM_STORAGE_PREFIX))
}

/** Coaching app banner mockup — can be a wide PNG/WebP. */
export const COACHING_APP_UPLOAD_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
} as const

export const COACHING_APP_STORAGE_PREFIX =
  "website/home/coaching-app/" as const

/**
 * Coaching app banner image:
 * website/home/coaching-app/{file}.{ext}
 */
export function buildCoachingAppImagePath(params: {
  mimeType?: string | null
  fileName?: string | null
}): string {
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `devices.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${COACHING_APP_STORAGE_PREFIX}${withExt}`
}

export function isCoachingAppStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(COACHING_APP_STORAGE_PREFIX))
}

/** Homepage mission video — soft cap aligned with content library videos. */
export const VIDEO_BANNER_UPLOAD_LIMITS = {
  videoBytes: 80 * 1024 * 1024,
} as const

export const VIDEO_BANNER_STORAGE_PREFIX =
  "website/home/video-banner/" as const

export function extensionForVideoMime(mimeType?: string | null): string {
  const mime = (mimeType || "").toLowerCase()
  if (mime.includes("webm")) return "webm"
  if (mime.includes("ogg")) return "ogg"
  if (mime.includes("quicktime") || mime.includes("mov")) return "mov"
  return "mp4"
}

/**
 * Mission / video banner file:
 * website/home/video-banner/{file}.{ext}
 */
export function buildVideoBannerPath(params: {
  mimeType?: string | null
  fileName?: string | null
}): string {
  const ext = extensionForVideoMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `mission.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${VIDEO_BANNER_STORAGE_PREFIX}${withExt}`
}

export function isVideoBannerStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(VIDEO_BANNER_STORAGE_PREFIX))
}

export function isRenderableVideoSrc(value?: string | null): boolean {
  if (!value) return false
  // Public/downloadable sources only — never treat Storage object paths as playable.
  if (value.startsWith("website/")) return false
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("/") ||
    value.startsWith("data:video/")
  )
}

/** Testimonial avatars — small circular portraits. */
export const TESTIMONIALS_UPLOAD_LIMITS = {
  imageBytes: 4 * 1024 * 1024,
} as const

export const TESTIMONIALS_STORAGE_PREFIX =
  "website/home/testimonials/" as const

/**
 * Testimonial avatar:
 * website/home/testimonials/{slotId}/{file}.{ext}
 */
export function buildTestimonialImagePath(params: {
  slotId: string
  mimeType?: string | null
  fileName?: string | null
}): string {
  const slotId = sanitizeWebsiteSegment(params.slotId)
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `avatar.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${TESTIMONIALS_STORAGE_PREFIX}${slotId}/${withExt}`
}

export function isTestimonialStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(TESTIMONIALS_STORAGE_PREFIX))
}

/** Goals banner feature mockups — similar weight to coaching-app images. */
export const GOALS_BANNER_UPLOAD_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
} as const

export const GOALS_BANNER_STORAGE_PREFIX =
  "website/home/goals-banner/" as const

/**
 * Goals banner tab mockup:
 * website/home/goals-banner/{tabId}/{file}.{ext}
 */
export function buildGoalsBannerImagePath(params: {
  tabId: string
  mimeType?: string | null
  fileName?: string | null
}): string {
  const tabId = sanitizeWebsiteSegment(params.tabId)
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `feature.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${GOALS_BANNER_STORAGE_PREFIX}${tabId}/${withExt}`
}

export function isGoalsBannerStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(GOALS_BANNER_STORAGE_PREFIX))
}

/** About page hero background — same weight as Who I Am photos. */
export const ABOUT_HERO_UPLOAD_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
} as const

export const ABOUT_HERO_STORAGE_PREFIX = "website/about/hero/" as const

/**
 * About hero background:
 * website/about/hero/{file}.{ext}
 */
export function buildAboutHeroImagePath(params: {
  mimeType?: string | null
  fileName?: string | null
}): string {
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `hero.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${ABOUT_HERO_STORAGE_PREFIX}${withExt}`
}

export function isAboutHeroStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(ABOUT_HERO_STORAGE_PREFIX))
}

/** About My Story section photo. */
export const ABOUT_MY_STORY_UPLOAD_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
} as const

export const ABOUT_MY_STORY_STORAGE_PREFIX =
  "website/about/my-story/" as const

/**
 * About My Story photo:
 * website/about/my-story/{file}.{ext}
 */
export function buildAboutMyStoryImagePath(params: {
  mimeType?: string | null
  fileName?: string | null
}): string {
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `story.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${ABOUT_MY_STORY_STORAGE_PREFIX}${withExt}`
}

export function isAboutMyStoryStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(ABOUT_MY_STORY_STORAGE_PREFIX))
}

/** About closing CTA banner background. */
export const ABOUT_CLOSING_BANNER_UPLOAD_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
} as const

export const ABOUT_CLOSING_BANNER_STORAGE_PREFIX =
  "website/about/closing-banner/" as const

/**
 * About closing CTA background:
 * website/about/closing-banner/{file}.{ext}
 */
export function buildAboutClosingBannerImagePath(params: {
  mimeType?: string | null
  fileName?: string | null
}): string {
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `closing.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${ABOUT_CLOSING_BANNER_STORAGE_PREFIX}${withExt}`
}

export function isAboutClosingBannerStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(ABOUT_CLOSING_BANNER_STORAGE_PREFIX))
}

/** Transformations gallery composites. */
export const TRANSFORMATIONS_UPLOAD_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
} as const

export const TRANSFORMATIONS_STORAGE_PREFIX =
  "website/common/transformations/" as const

/**
 * Transformation gallery image:
 * website/common/transformations/{itemId}/{file}.{ext}
 */
export function buildTransformationImagePath(params: {
  itemId: string
  mimeType?: string | null
  fileName?: string | null
}): string {
  const itemId = sanitizeWebsiteSegment(params.itemId)
  const ext = extensionForMime(params.mimeType)
  const leaf = sanitizeWebsiteSegment(
    params.fileName?.trim() || `transform.${ext}`,
  )
  const withExt = leaf.includes(".") ? leaf : `${leaf}.${ext}`
  return `${TRANSFORMATIONS_STORAGE_PREFIX}${itemId}/${withExt}`
}

export function isTransformationStoragePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(TRANSFORMATIONS_STORAGE_PREFIX))
}

export function formatBytesLabel(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function isRenderableImageSrc(value?: string | null): boolean {
  if (!value) return false
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  )
}
