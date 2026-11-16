import { doc, getDoc, setDoc } from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  buildCoachingAppImagePath,
  COACHING_APP_UPLOAD_LIMITS,
  formatBytesLabel,
  isCoachingAppStoragePath,
  isRenderableImageSrc,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type { CoachingAppBanner } from "@/types/website"

export const COACHING_APP_COLLECTION = "website_coaching_app"
export const COACHING_APP_DOC_ID = "config"

export const DEFAULT_COACHING_APP_COPY = {
  title: {
    en: "Your coaching app, all in one place",
    ar: "تطبيقك للتدريب، كل شيء في مكان واحد",
  },
  description: {
    en: "Shave hours off program admin work and upgrade your coaching experience with our personal trainer app",
    ar: "وفّر ساعات من أعمال إدارة البرامج وارتقِ بتجربة التدريب مع تطبيق المدرب الشخصي",
  },
  imageAlt: {
    en: "Personal trainer app shown on laptop and phone",
    ar: "تطبيق المدرب الشخصي يظهر على لابتوب وهاتف",
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

export function normalizeCoachingAppBanner(
  raw: Record<string, unknown> | null | undefined,
): CoachingAppBanner {
  return {
    id: COACHING_APP_DOC_ID,
    title: normalizeBilingual(raw?.title, DEFAULT_COACHING_APP_COPY.title),
    description: normalizeBilingual(
      raw?.description,
      DEFAULT_COACHING_APP_COPY.description,
    ),
    imageAlt: normalizeBilingual(
      raw?.imageAlt,
      DEFAULT_COACHING_APP_COPY.imageAlt,
    ),
    imageUrl: asString(raw?.imageUrl),
    storagePath: asString(raw?.storagePath),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export async function fetchCoachingAppBanner(): Promise<CoachingAppBanner | null> {
  const snap = await getDoc(
    doc(getDb(), COACHING_APP_COLLECTION, COACHING_APP_DOC_ID),
  )
  if (!snap.exists()) return null
  return normalizeCoachingAppBanner(snap.data() as Record<string, unknown>)
}

async function uploadCoachingAppImage(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path)
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "image/png",
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
  if (!path || isRenderableImageSrc(path) || !isCoachingAppStoragePath(path)) {
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

export type SaveCoachingAppBannerInput = {
  title: BilingualText
  description: BilingualText
  imageAlt: BilingualText
  file?: File | null
  removeImage?: boolean
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveCoachingAppBanner(
  input: SaveCoachingAppBannerInput,
): Promise<CoachingAppBanner> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = await getDoc(
    doc(db, COACHING_APP_COLLECTION, COACHING_APP_DOC_ID),
  )
  const existing = existingSnap.exists()
    ? normalizeCoachingAppBanner(
        existingSnap.data() as Record<string, unknown>,
      )
    : null

  const file = input.file ?? null
  if (file && file.size > COACHING_APP_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(COACHING_APP_UPLOAD_LIMITS.imageBytes)} limit`,
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
    const nextPath = buildCoachingAppImagePath({
      mimeType: file.type,
      fileName: `devices.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"}`,
    })
    if (
      existing?.storagePath &&
      isCoachingAppStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadCoachingAppImage(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  }

  const record: CoachingAppBanner = {
    id: COACHING_APP_DOC_ID,
    title: requireBilingual(input.title.en, input.title.ar, "Title"),
    description: requireBilingual(
      input.description.en,
      input.description.ar,
      "Description",
    ),
    imageAlt: requireBilingual(
      input.imageAlt.en,
      input.imageAlt.ar,
      "Image alt",
    ),
    imageUrl,
    storagePath,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, COACHING_APP_COLLECTION, COACHING_APP_DOC_ID),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

export async function clearCoachingAppImage(
  updatedBy?: string,
): Promise<CoachingAppBanner> {
  const existing = await fetchCoachingAppBanner()
  if (!existing) {
    throw new Error("Coaching app banner not found")
  }
  await deleteStoragePath(existing.storagePath)
  const now = new Date().toISOString()
  const next: CoachingAppBanner = {
    ...existing,
    imageUrl: "",
    storagePath: "",
    updatedAt: now,
    updatedBy: updatedBy || existing.updatedBy,
  }
  await setDoc(
    doc(getDb(), COACHING_APP_COLLECTION, COACHING_APP_DOC_ID),
    stripUndefined({ ...next }),
  )
  return next
}
