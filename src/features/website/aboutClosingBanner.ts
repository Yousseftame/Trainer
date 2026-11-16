import { doc, getDoc, setDoc } from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  ABOUT_CLOSING_BANNER_UPLOAD_LIMITS,
  buildAboutClosingBannerImagePath,
  formatBytesLabel,
  isAboutClosingBannerStoragePath,
  isRenderableImageSrc,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type { AboutClosingBannerContent } from "@/types/website"

export const ABOUT_CLOSING_BANNER_COLLECTION = "website_about_closing_banner"
export const ABOUT_CLOSING_BANNER_DOC_ID = "config"

export const DEFAULT_ABOUT_CLOSING_BANNER_COPY = {
  title: {
    en: "Ready to start your next chapter?",
    ar: "جاهز لبدء مرحلتك التالية؟",
  },
  body: {
    en: "Tell me your goal and I’ll help you choose the right path—training, nutrition, or a full coaching package.",
    ar: "أخبرني بهدفك وسأساعدك على اختيار المسار المناسب—تدريب، تغذية، أو باقة تدريب كاملة.",
  },
  ctaLabel: {
    en: "Book a class",
    ar: "احجز حصة",
  },
  ctaHref: "/#contact",
  imageAlt: {
    en: "Athlete resting on a weight bench in the gym",
    ar: "رياضية تستريح على مقعد أوزان في صالة الجيم",
  },
} as const

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function normalizeBilingual(
  value: unknown,
  fallback: BilingualText = { en: "", ar: "" },
): BilingualText {
  if (!value || typeof value !== "object") return { ...fallback }
  const raw = value as Record<string, unknown>
  return {
    en: asString(raw.en, fallback.en),
    ar: asString(raw.ar, fallback.ar),
  }
}

function normalizeCtaHref(value: unknown): string {
  const raw = asString(value, DEFAULT_ABOUT_CLOSING_BANNER_COPY.ctaHref).trim()
  return raw || DEFAULT_ABOUT_CLOSING_BANNER_COPY.ctaHref
}

export function normalizeAboutClosingBannerContent(
  raw: Record<string, unknown> | null | undefined,
): AboutClosingBannerContent {
  return {
    id: ABOUT_CLOSING_BANNER_DOC_ID,
    title: normalizeBilingual(raw?.title, DEFAULT_ABOUT_CLOSING_BANNER_COPY.title),
    body: normalizeBilingual(raw?.body, DEFAULT_ABOUT_CLOSING_BANNER_COPY.body),
    ctaLabel: normalizeBilingual(
      raw?.ctaLabel,
      DEFAULT_ABOUT_CLOSING_BANNER_COPY.ctaLabel,
    ),
    ctaHref: normalizeCtaHref(raw?.ctaHref),
    imageUrl: asString(raw?.imageUrl),
    storagePath: asString(raw?.storagePath),
    imageAlt: normalizeBilingual(
      raw?.imageAlt,
      DEFAULT_ABOUT_CLOSING_BANNER_COPY.imageAlt,
    ),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export async function fetchAboutClosingBannerContent(): Promise<AboutClosingBannerContent | null> {
  const snap = await getDoc(
    doc(getDb(), ABOUT_CLOSING_BANNER_COLLECTION, ABOUT_CLOSING_BANNER_DOC_ID),
  )
  if (!snap.exists()) return null
  return normalizeAboutClosingBannerContent(
    snap.data() as Record<string, unknown>,
  )
}

async function uploadAboutClosingBannerImage(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path)
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "image/jpeg",
    customMetadata: { uploadedAt: new Date().toISOString() },
  })

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (!onProgress || snap.totalBytes <= 0) return
        onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
      },
      reject,
      () => resolve(),
    )
  })

  return getDownloadURL(task.snapshot.ref)
}

async function deleteStoragePath(path?: string | null): Promise<void> {
  if (
    !path ||
    isRenderableImageSrc(path) ||
    !isAboutClosingBannerStoragePath(path)
  ) {
    return
  }
  try {
    await deleteObject(ref(getFirebaseStorage(), path))
  } catch {
    // already gone
  }
}

function requireBilingual(
  en: string,
  ar: string,
  label: string,
): BilingualText {
  const mirrored = mirrorBilingual(en, ar)
  if (!mirrored) throw new Error(`${label} is required`)
  return mirrored
}

export type SaveAboutClosingBannerContentInput = {
  title: BilingualText
  body: BilingualText
  ctaLabel: BilingualText
  ctaHref: string
  imageAlt?: BilingualText
  file?: File | null
  removeImage?: boolean
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveAboutClosingBannerContent(
  input: SaveAboutClosingBannerContentInput,
): Promise<AboutClosingBannerContent> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = await getDoc(
    doc(db, ABOUT_CLOSING_BANNER_COLLECTION, ABOUT_CLOSING_BANNER_DOC_ID),
  )
  const existing = existingSnap.exists()
    ? normalizeAboutClosingBannerContent(
        existingSnap.data() as Record<string, unknown>,
      )
    : null

  const file = input.file ?? null
  if (file && file.size > ABOUT_CLOSING_BANNER_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(ABOUT_CLOSING_BANNER_UPLOAD_LIMITS.imageBytes)} limit`,
    )
  }
  if (file && !file.type.match(/^image\//)) {
    throw new Error("Only image files are allowed")
  }

  const ctaHref = input.ctaHref.trim()
  if (!ctaHref) {
    throw new Error("Button link is required")
  }

  let imageUrl = existing?.imageUrl || ""
  let storagePath = existing?.storagePath || ""
  let previousPathToDelete: string | null = null

  if (input.removeImage && !file) {
    if (existing?.storagePath) previousPathToDelete = existing.storagePath
    imageUrl = ""
    storagePath = ""
  }

  if (file) {
    const nextPath = buildAboutClosingBannerImagePath({
      mimeType: file.type,
      fileName: `closing.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"}`,
    })
    if (
      existing?.storagePath &&
      isAboutClosingBannerStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadAboutClosingBannerImage(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  }

  const record: AboutClosingBannerContent = {
    id: ABOUT_CLOSING_BANNER_DOC_ID,
    title: requireBilingual(input.title.en, input.title.ar, "Title"),
    body: requireBilingual(input.body.en, input.body.ar, "Description"),
    ctaLabel: requireBilingual(
      input.ctaLabel.en,
      input.ctaLabel.ar,
      "Button label",
    ),
    ctaHref,
    imageAlt: input.imageAlt
      ? requireBilingual(input.imageAlt.en, input.imageAlt.ar, "Image alt")
      : existing?.imageAlt || {
          ...DEFAULT_ABOUT_CLOSING_BANNER_COPY.imageAlt,
        },
    imageUrl,
    storagePath,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, ABOUT_CLOSING_BANNER_COLLECTION, ABOUT_CLOSING_BANNER_DOC_ID),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

export async function clearAboutClosingBannerImage(
  updatedBy?: string,
): Promise<AboutClosingBannerContent> {
  const existing = await fetchAboutClosingBannerContent()
  const source = existing ?? normalizeAboutClosingBannerContent(null)
  return saveAboutClosingBannerContent({
    title: source.title,
    body: source.body,
    ctaLabel: source.ctaLabel,
    ctaHref: source.ctaHref,
    imageAlt: source.imageAlt,
    removeImage: true,
    updatedBy,
  })
}
