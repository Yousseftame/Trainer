import { doc, getDoc, setDoc } from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  ABOUT_HERO_UPLOAD_LIMITS,
  buildAboutHeroImagePath,
  formatBytesLabel,
  isAboutHeroStoragePath,
  isRenderableImageSrc,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type { AboutHeroContent } from "@/types/website"

export const ABOUT_HERO_COLLECTION = "website_about_hero"
export const ABOUT_HERO_DOC_ID = "config"

export const DEFAULT_ABOUT_HERO_COPY = {
  name: { en: "Mike Vasquez", ar: "مايك فاسكيز" },
  headline: {
    en: "Strength, discipline, and habits that last beyond the gym.",
    ar: "قوة، انضباط، وعادات تدوم أبعد من صالة الجيم.",
  },
  lead: {
    en: "I help people build strength, confidence, and lasting habits with clear programming, honest coaching, and plans that fit real life—not temporary motivation.",
    ar: "أساعد الناس على بناء القوة والثقة وعادات تدوم عبر برامج واضحة، وتدريب صادق، وخطط تناسب الحياة الحقيقية—لا حماسة مؤقتة.",
  },
  leadSecondary: {
    en: "Whether you are starting fresh, returning after a break, or leveling up as an athlete, I build a path you can actually follow week after week.",
    ar: "سواء كنت تبدأ من جديد، أو تعود بعد انقطاع، أو ترتقي كرياضي، أبني لك مساراً يمكنك الالتزام به أسبوعاً بعد أسبوع.",
  },
  yearsValue: { en: "14+", ar: "+14" },
  yearsLabel: { en: "Years of Experience", ar: "سنوات من الخبرة" },
  metaTitle: {
    en: "Science-backed coaching",
    ar: "تدريب مدعوم علمياً",
  },
  metaBody: {
    en: "Programming, nutrition guidance, and accountability in one clear system.",
    ar: "برمجة، إرشاد تغذية، ومتابعة في نظام واحد واضح.",
  },
  imageAlt: {
    en: "Coach training a client with a dumbbell in the gym",
    ar: "مدرب يدرب عميلاً باستخدام دمبل في صالة الجيم",
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

export function normalizeAboutHeroContent(
  raw: Record<string, unknown> | null | undefined,
): AboutHeroContent {
  return {
    id: ABOUT_HERO_DOC_ID,
    name: normalizeBilingual(raw?.name, DEFAULT_ABOUT_HERO_COPY.name),
    headline: normalizeBilingual(
      raw?.headline,
      DEFAULT_ABOUT_HERO_COPY.headline,
    ),
    lead: normalizeBilingual(raw?.lead, DEFAULT_ABOUT_HERO_COPY.lead),
    leadSecondary: normalizeBilingual(
      raw?.leadSecondary,
      DEFAULT_ABOUT_HERO_COPY.leadSecondary,
    ),
    yearsValue: normalizeBilingual(
      raw?.yearsValue,
      DEFAULT_ABOUT_HERO_COPY.yearsValue,
    ),
    yearsLabel: normalizeBilingual(
      raw?.yearsLabel,
      DEFAULT_ABOUT_HERO_COPY.yearsLabel,
    ),
    metaTitle: normalizeBilingual(
      raw?.metaTitle,
      DEFAULT_ABOUT_HERO_COPY.metaTitle,
    ),
    metaBody: normalizeBilingual(
      raw?.metaBody,
      DEFAULT_ABOUT_HERO_COPY.metaBody,
    ),
    imageUrl: asString(raw?.imageUrl),
    storagePath: asString(raw?.storagePath),
    imageAlt: normalizeBilingual(
      raw?.imageAlt,
      DEFAULT_ABOUT_HERO_COPY.imageAlt,
    ),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export async function fetchAboutHeroContent(): Promise<AboutHeroContent | null> {
  const snap = await getDoc(
    doc(getDb(), ABOUT_HERO_COLLECTION, ABOUT_HERO_DOC_ID),
  )
  if (!snap.exists()) return null
  return normalizeAboutHeroContent(snap.data() as Record<string, unknown>)
}

async function uploadAboutHeroImage(
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
  if (!path || isRenderableImageSrc(path) || !isAboutHeroStoragePath(path)) {
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

export type SaveAboutHeroContentInput = {
  name: BilingualText
  headline: BilingualText
  lead: BilingualText
  leadSecondary: BilingualText
  yearsValue: BilingualText
  yearsLabel: BilingualText
  metaTitle: BilingualText
  metaBody: BilingualText
  imageAlt?: BilingualText
  file?: File | null
  removeImage?: boolean
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveAboutHeroContent(
  input: SaveAboutHeroContentInput,
): Promise<AboutHeroContent> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = await getDoc(
    doc(db, ABOUT_HERO_COLLECTION, ABOUT_HERO_DOC_ID),
  )
  const existing = existingSnap.exists()
    ? normalizeAboutHeroContent(existingSnap.data() as Record<string, unknown>)
    : null

  const file = input.file ?? null
  if (file && file.size > ABOUT_HERO_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(ABOUT_HERO_UPLOAD_LIMITS.imageBytes)} limit`,
    )
  }
  if (file && !file.type.match(/^image\//)) {
    throw new Error("Only image files are allowed")
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
    const nextPath = buildAboutHeroImagePath({
      mimeType: file.type,
      fileName: `hero.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"}`,
    })
    if (
      existing?.storagePath &&
      isAboutHeroStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadAboutHeroImage(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  }

  const record: AboutHeroContent = {
    id: ABOUT_HERO_DOC_ID,
    name: requireBilingual(input.name.en, input.name.ar, "Name"),
    headline: requireBilingual(input.headline.en, input.headline.ar, "Headline"),
    lead: requireBilingual(input.lead.en, input.lead.ar, "Description"),
    leadSecondary: requireBilingual(
      input.leadSecondary.en,
      input.leadSecondary.ar,
      "Second description",
    ),
    yearsValue: requireBilingual(
      input.yearsValue.en,
      input.yearsValue.ar,
      "Stat number",
    ),
    yearsLabel: requireBilingual(
      input.yearsLabel.en,
      input.yearsLabel.ar,
      "Stat label",
    ),
    metaTitle: requireBilingual(
      input.metaTitle.en,
      input.metaTitle.ar,
      "Meta title",
    ),
    metaBody: requireBilingual(
      input.metaBody.en,
      input.metaBody.ar,
      "Meta description",
    ),
    imageAlt: input.imageAlt
      ? requireBilingual(input.imageAlt.en, input.imageAlt.ar, "Image alt")
      : existing?.imageAlt || { ...DEFAULT_ABOUT_HERO_COPY.imageAlt },
    imageUrl,
    storagePath,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, ABOUT_HERO_COLLECTION, ABOUT_HERO_DOC_ID),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

export async function clearAboutHeroImage(
  updatedBy?: string,
): Promise<AboutHeroContent> {
  const existing = await fetchAboutHeroContent()
  const source = existing ?? normalizeAboutHeroContent(null)
  return saveAboutHeroContent({
    name: source.name,
    headline: source.headline,
    lead: source.lead,
    leadSecondary: source.leadSecondary,
    yearsValue: source.yearsValue,
    yearsLabel: source.yearsLabel,
    metaTitle: source.metaTitle,
    metaBody: source.metaBody,
    imageAlt: source.imageAlt,
    removeImage: true,
    updatedBy,
  })
}
