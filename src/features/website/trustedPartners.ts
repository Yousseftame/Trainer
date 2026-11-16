import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  buildTrustedPartnerLogoPath,
  formatBytesLabel,
  isRenderableImageSrc,
  isTrustedPartnerStoragePath,
  TRUSTED_PARTNERS_UPLOAD_LIMITS,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { allocateFirestoreId } from "@/lib/firebase/ids"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type {
  TrustedPartnerLogo,
  TrustedPartnersSettings,
} from "@/types/website"

export const TRUSTED_PARTNERS_SETTINGS_COLLECTION =
  "website_trusted_partners_settings"
export const TRUSTED_PARTNERS_SETTINGS_ID = "config"
export const TRUSTED_PARTNER_LOGOS_COLLECTION = "website_trusted_partner_logos"

export const DEFAULT_COACHES_COUNT: BilingualText = {
  en: "380,000",
  ar: "380,000",
}

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

function asBool(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
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

export function normalizeTrustedPartnersSettings(
  raw: Record<string, unknown> | null | undefined,
): TrustedPartnersSettings {
  return {
    id: TRUSTED_PARTNERS_SETTINGS_ID,
    coachesCount: normalizeBilingual(raw?.coachesCount, DEFAULT_COACHES_COUNT),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export function normalizeTrustedPartnerLogo(
  id: string,
  raw: Record<string, unknown>,
): TrustedPartnerLogo {
  return {
    id,
    enabled: asBool(raw.enabled, true),
    order: asNumber(raw.order, 0),
    name: normalizeBilingual(raw.name),
    imageUrl: asString(raw.imageUrl),
    storagePath: asString(raw.storagePath),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    updatedBy: asString(raw.updatedBy) || undefined,
  }
}

function sortLogos(logos: TrustedPartnerLogo[]): TrustedPartnerLogo[] {
  return [...logos].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export async function fetchTrustedPartnersSettings(): Promise<TrustedPartnersSettings> {
  const db = getDb()
  const snap = await getDoc(
    doc(
      db,
      TRUSTED_PARTNERS_SETTINGS_COLLECTION,
      TRUSTED_PARTNERS_SETTINGS_ID,
    ),
  )
  if (!snap.exists()) return normalizeTrustedPartnersSettings(null)
  return normalizeTrustedPartnersSettings(
    snap.data() as Record<string, unknown>,
  )
}

export async function saveTrustedPartnersSettings(input: {
  coachesCount: BilingualText
  updatedBy?: string
}): Promise<TrustedPartnersSettings> {
  const mirrored = mirrorBilingual(
    input.coachesCount.en,
    input.coachesCount.ar,
  )
  if (!mirrored) {
    throw new Error("Coaches count is required in at least one language")
  }

  const now = new Date().toISOString()
  const record: TrustedPartnersSettings = {
    id: TRUSTED_PARTNERS_SETTINGS_ID,
    coachesCount: mirrored,
    updatedAt: now,
    updatedBy: input.updatedBy,
  }

  await setDoc(
    doc(
      getDb(),
      TRUSTED_PARTNERS_SETTINGS_COLLECTION,
      TRUSTED_PARTNERS_SETTINGS_ID,
    ),
    stripUndefined({ ...record }),
  )
  return record
}

export async function fetchTrustedPartnerLogos(options?: {
  publicOnly?: boolean
}): Promise<TrustedPartnerLogo[]> {
  const snap = await getDocs(
    collection(getDb(), TRUSTED_PARTNER_LOGOS_COLLECTION),
  )
  let logos = snap.docs.map((d) =>
    normalizeTrustedPartnerLogo(d.id, d.data() as Record<string, unknown>),
  )
  if (options?.publicOnly) {
    logos = logos.filter(
      (logo) => logo.enabled && isRenderableImageSrc(logo.imageUrl),
    )
  }
  return sortLogos(logos)
}

async function uploadLogoFile(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path)
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "image/png",
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    },
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
    !isTrustedPartnerStoragePath(path)
  ) {
    return
  }
  try {
    await deleteObject(ref(getFirebaseStorage(), path))
  } catch {
    // Object may already be gone
  }
}

export type SaveTrustedPartnerLogoInput = {
  id?: string
  enabled?: boolean
  order?: number
  name?: BilingualText
  file?: File | null
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveTrustedPartnerLogo(
  input: SaveTrustedPartnerLogoInput,
): Promise<TrustedPartnerLogo> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = input.id
    ? await getDoc(doc(db, TRUSTED_PARTNER_LOGOS_COLLECTION, input.id))
    : null
  const existing = existingSnap?.exists()
    ? normalizeTrustedPartnerLogo(
        existingSnap.id,
        existingSnap.data() as Record<string, unknown>,
      )
    : null

  const id = existing?.id ?? allocateFirestoreId(TRUSTED_PARTNER_LOGOS_COLLECTION)
  const file = input.file ?? null

  if (!existing && !file) {
    throw new Error("Please select a partner logo image")
  }

  if (file && file.size > TRUSTED_PARTNERS_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(TRUSTED_PARTNERS_UPLOAD_LIMITS.imageBytes)} limit`,
    )
  }

  if (file && !file.type.match(/^image\//)) {
    throw new Error("Only image files are allowed")
  }

  let imageUrl = existing?.imageUrl || ""
  let storagePath = existing?.storagePath || ""
  let previousPathToDelete: string | null = null

  if (file) {
    const nextPath = buildTrustedPartnerLogoPath({
      logoId: id,
      mimeType: file.type,
      fileName: `logo.${extensionFromMime(file.type)}`,
    })
    if (
      existing?.storagePath &&
      isTrustedPartnerStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadLogoFile(nextPath, file, input.onUploadProgress)
    storagePath = nextPath
  }

  if (!isRenderableImageSrc(imageUrl)) {
    throw new Error("Partner logo image is required")
  }

  let order = existing?.order ?? 0
  if (typeof input.order === "number") {
    order = input.order
  } else if (!existing) {
    const all = await fetchTrustedPartnerLogos()
    order = all.length === 0 ? 0 : Math.max(...all.map((l) => l.order)) + 1
  }

  const name =
    input.name ??
    existing?.name ??
    ({ en: "", ar: "" } satisfies BilingualText)

  const record: TrustedPartnerLogo = {
    id,
    enabled: input.enabled ?? existing?.enabled ?? true,
    order,
    name,
    imageUrl,
    storagePath,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, TRUSTED_PARTNER_LOGOS_COLLECTION, id),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

function extensionFromMime(mimeType?: string | null): string {
  const mime = (mimeType || "").toLowerCase()
  if (mime.includes("png")) return "png"
  if (mime.includes("webp")) return "webp"
  if (mime.includes("gif")) return "gif"
  if (mime.includes("svg")) return "svg"
  return "jpg"
}

export async function setTrustedPartnerLogoEnabled(
  id: string,
  enabled: boolean,
  updatedBy?: string,
): Promise<void> {
  const db = getDb()
  const snap = await getDoc(doc(db, TRUSTED_PARTNER_LOGOS_COLLECTION, id))
  if (!snap.exists()) throw new Error("Logo not found")
  const existing = normalizeTrustedPartnerLogo(
    snap.id,
    snap.data() as Record<string, unknown>,
  )
  await setDoc(
    doc(db, TRUSTED_PARTNER_LOGOS_COLLECTION, id),
    stripUndefined({
      ...existing,
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || existing.updatedBy,
    }),
  )
}

export async function reorderTrustedPartnerLogos(
  orderedIds: string[],
  updatedBy?: string,
): Promise<void> {
  if (orderedIds.length === 0) return
  const db = getDb()
  const batch = writeBatch(db)
  const now = new Date().toISOString()
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, TRUSTED_PARTNER_LOGOS_COLLECTION, id), {
      order: index,
      updatedAt: now,
      ...(updatedBy ? { updatedBy } : {}),
    })
  })
  await batch.commit()
}

export async function deleteTrustedPartnerLogo(id: string): Promise<void> {
  const db = getDb()
  const snap = await getDoc(doc(db, TRUSTED_PARTNER_LOGOS_COLLECTION, id))
  const existing = snap.exists()
    ? normalizeTrustedPartnerLogo(
        snap.id,
        snap.data() as Record<string, unknown>,
      )
    : null
  await deleteDoc(doc(db, TRUSTED_PARTNER_LOGOS_COLLECTION, id))
  if (existing) await deleteStoragePath(existing.storagePath)
}
