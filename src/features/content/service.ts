import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage"
import {
  INITIAL_DEMO_CONTENT,
  buildCanonicalStoragePath,
  buildContentSearchTokens,
  defaultEntitlementForCategory,
  defaultKindForCategory,
  formatBytesLabel,
  getContentSnapshot,
  setContentSnapshot,
  type DemoContentAsset,
} from "@/features/content/demo"
import { tryGetDb } from "@/lib/firebase/firestore"
import { tryGetFirebaseStorage } from "@/lib/firebase/storage"
import type {
  ContentCategory,
  ContentVisibility,
  StorageBackendMode,
  VideoProviderId,
} from "@/types/content"
import type { PackageEntitlementKey } from "@/types/subscription"

const CONTENT_COLLECTION = "content_assets"
const SEED_FLAG_KEY = "trainer_firestore_seeded_content_v2"

/** Session object URLs for large local files selected while on Firebase Spark (free) plan */
const sessionObjectUrls = new Map<string, string>()

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v
    }
  }
  return out as T
}

function slugifyId(prefix: string, raw: string): string {
  const base = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${prefix}-${base || "item"}-${suffix}`
}

function prefixForCategory(category: ContentCategory): string {
  switch (category) {
    case "exerciseVideo":
      return "vid"
    case "workoutPdf":
    case "nutritionPdf":
      return "pdf"
    case "education":
      return "doc"
    case "reference":
    default:
      return "ref"
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function seedContentIfEmpty(): Promise<void> {
  const db = tryGetDb()
  if (!db) return

  try {
    const snap = await getDocs(collection(db, CONTENT_COLLECTION))
    if (!snap.empty) return

    const batch = writeBatch(db)
    const initial = getContentSnapshot()
    const itemsToSeed = initial.length > 0 ? initial : INITIAL_DEMO_CONTENT

    for (const item of itemsToSeed) {
      batch.set(
        doc(db, CONTENT_COLLECTION, item.id),
        stripUndefined({
          ...item,
          searchTokens: buildContentSearchTokens(item),
        }),
      )
    }
    await batch.commit()

    if (typeof window !== "undefined") {
      window.localStorage.setItem(SEED_FLAG_KEY, "1")
    }
  } catch (err) {
    console.warn("[content/service] Firestore seed skipped:", err)
  }
}

export async function fetchContentAssets(): Promise<DemoContentAsset[]> {
  const db = tryGetDb()
  if (!db) {
    return getContentSnapshot()
  }

  try {
    await seedContentIfEmpty()
    const snap = await getDocs(collection(db, CONTENT_COLLECTION))
    if (!snap.empty) {
      const items = snap.docs
        .map((d) => {
          const data = d.data() as DemoContentAsset
          const id = data.id || d.id
          const sessionUrl = sessionObjectUrls.get(id)
          const category = data.category ?? "education"
          const normalized: DemoContentAsset = {
            ...data,
            id,
            category,
            kind: data.kind ?? defaultKindForCategory(category),
            title: data.title ?? { en: id, ar: id },
            description: data.description ?? { en: "", ar: "" },
            tags: Array.isArray(data.tags) ? data.tags : [],
            visibility: data.visibility ?? "library",
            requiredEntitlement:
              data.requiredEntitlement ?? defaultEntitlementForCategory(category),
            packageIds: Array.isArray(data.packageIds) ? data.packageIds : [],
            subscriberIds: Array.isArray(data.subscriberIds)
              ? data.subscriberIds
              : [],
            programIds: Array.isArray(data.programIds) ? data.programIds : [],
            exerciseNames: Array.isArray(data.exerciseNames)
              ? data.exerciseNames
              : [],
            storagePath:
              data.storagePath ||
              buildCanonicalStoragePath({
                id,
                category,
                fileName: data.fileName,
                videoProvider: data.videoProvider,
                videoAssetId: data.videoAssetId,
                createdAt: data.createdAt,
              }),
            fileUrl: sessionUrl || data.fileUrl,
            streamUrl: sessionUrl || data.streamUrl,
          }
          normalized.searchTokens =
            data.searchTokens ?? buildContentSearchTokens(normalized)
          return normalized
        })
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )

      setContentSnapshot(items)
      return items
    }
  } catch (err) {
    console.warn(
      "[content/service] Falling back to local content snapshot:",
      err,
    )
  }

  return getContentSnapshot()
}

export type SaveContentAssetInput = {
  id?: string
  category: ContentCategory
  title: { en: string; ar: string }
  description: { en: string; ar: string }
  fileName?: string
  mimeType?: string
  sizeBytes?: number
  sizeLabel?: string
  pageCount?: number | null
  durationSeconds?: number | null
  storagePath?: string
  fileUrl?: string
  videoProvider?: VideoProviderId
  videoAssetId?: string
  streamUrl?: string
  thumbnailUrl?: string
  tags: string[]
  visibility: ContentVisibility
  requiredEntitlement?: PackageEntitlementKey
  packageIds: string[]
  subscriberIds: string[]
  programIds: string[]
  exerciseNames?: string[]
  uploadedBy?: string
  /** Optional local File chosen in the modal */
  file?: File | null
}

/**
 * Handles saving a content asset to Firestore and smartly handling its binary/URL:
 * - On Firebase Spark (free) plan where Firebase Storage is not enabled, it stores:
 *   1. External CDN / streaming URLs directly (`external_cdn`)
 *   2. Small PDFs/docs (< 650 KB) as inline data URLs in Firestore (`inline_spark`) so they work across reloads
 *   3. Larger local files via session Object URL + canonical `storagePath` metadata (`metadata_only`)
 * - If `VITE_FIREBASE_STORAGE_ENABLED=true` is set on a Blaze plan, it uploads to Firebase Storage at `storagePath`.
 */
export async function saveContentAsset(
  input: SaveContentAssetInput,
): Promise<DemoContentAsset> {
  const current = getContentSnapshot()
  const now = new Date().toISOString()
  const existing = input.id
    ? current.find((item) => item.id === input.id)
    : undefined

  const prefix = prefixForCategory(input.category)
  const id =
    existing?.id ??
    input.id ??
    slugifyId(prefix, input.title.en || input.title.ar || input.fileName || "asset")

  const kind = defaultKindForCategory(input.category)
  const effectiveFileName =
    input.file?.name ||
    input.fileName?.trim() ||
    existing?.fileName ||
    (kind === "video" ? `${id}.mp4` : `${id}.pdf`)

  const canonicalPath =
    input.storagePath?.trim() ||
    buildCanonicalStoragePath({
      id,
      category: input.category,
      fileName: effectiveFileName,
      videoProvider: input.videoProvider,
      videoAssetId: input.videoAssetId,
      createdAt: existing?.createdAt ?? now,
    })

  let resolvedFileUrl = input.fileUrl?.trim() || existing?.fileUrl
  let resolvedStreamUrl = input.streamUrl?.trim() || existing?.streamUrl
  let storageMode: StorageBackendMode =
    existing?.storageMode ??
    (resolvedFileUrl || resolvedStreamUrl || input.videoAssetId
      ? "external_cdn"
      : "metadata_only")

  const file = input.file
  const storageEnabled =
    import.meta.env.VITE_FIREBASE_STORAGE_ENABLED === "true"

  if (file) {
    // Always register an instant session Object URL so preview works immediately
    const objectUrl = URL.createObjectURL(file)
    sessionObjectUrls.set(id, objectUrl)

    if (storageEnabled) {
      const storage = tryGetFirebaseStorage()
      if (storage) {
        try {
          const storageRef = ref(storage, canonicalPath)
          await uploadBytes(storageRef, file, {
            contentType: file.type || undefined,
          })
          const downloadUrl = await getDownloadURL(storageRef)
          resolvedFileUrl = downloadUrl
          if (kind === "video") resolvedStreamUrl = downloadUrl
          storageMode = "firebase_storage"
        } catch (err) {
          console.warn(
            "[content/service] Firebase Storage upload failed, using Spark fallback:",
            err,
          )
        }
      }
    }

    // Spark Free Plan smart inline persistence for small PDFs/docs (< 650 KB)
    if (storageMode !== "firebase_storage") {
      if (kind !== "video" && file.size <= 650 * 1024) {
        try {
          resolvedFileUrl = await fileToDataUrl(file)
          storageMode = "inline_spark"
        } catch {
          resolvedFileUrl = objectUrl
          storageMode = "metadata_only"
        }
      } else {
        if (!resolvedFileUrl) resolvedFileUrl = objectUrl
        if (kind === "video" && !resolvedStreamUrl) resolvedStreamUrl = objectUrl
        storageMode = "metadata_only"
      }
    }
  } else if (resolvedFileUrl || resolvedStreamUrl) {
    if (resolvedFileUrl?.startsWith("data:")) {
      storageMode = "inline_spark"
    } else if (storageMode !== "firebase_storage") {
      storageMode = "external_cdn"
    }
  }

  const sizeBytes = file?.size ?? input.sizeBytes ?? existing?.sizeBytes
  const sizeLabel =
    input.sizeLabel?.trim() ||
    (file ? formatBytesLabel(file.size) : existing?.sizeLabel) ||
    (kind === "video" ? "120 MB" : "1.2 MB")

  const cleanTitleEn = input.title.en.trim() || input.title.ar.trim()
  const cleanTitleAr = input.title.ar.trim() || input.title.en.trim()
  const cleanDescEn = input.description.en.trim() || input.description.ar.trim()
  const cleanDescAr = input.description.ar.trim() || input.description.en.trim()

  const nextAsset: DemoContentAsset = {
    id,
    category: input.category,
    kind,
    title: {
      en: cleanTitleEn,
      ar: cleanTitleAr,
    },
    description: {
      en: cleanDescEn,
      ar: cleanDescAr,
    },
    fileName: effectiveFileName,
    mimeType:
      file?.type ||
      input.mimeType ||
      existing?.mimeType ||
      (kind === "video" ? "video/mp4" : "application/pdf"),
    sizeBytes,
    sizeLabel,
    pageCount:
      kind === "video"
        ? undefined
        : (input.pageCount ?? existing?.pageCount ?? undefined),
    durationSeconds:
      kind === "video"
        ? (input.durationSeconds ?? existing?.durationSeconds ?? 45)
        : undefined,
    storagePath: canonicalPath,
    fileUrl: resolvedFileUrl,
    storageMode,
    videoProvider:
      kind === "video"
        ? (input.videoProvider ?? existing?.videoProvider ?? "bunny")
        : undefined,
    videoAssetId:
      kind === "video"
        ? (input.videoAssetId?.trim() || existing?.videoAssetId || id)
        : undefined,
    streamUrl: kind === "video" ? resolvedStreamUrl : undefined,
    thumbnailUrl: input.thumbnailUrl?.trim() || existing?.thumbnailUrl,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    visibility: input.visibility,
    requiredEntitlement:
      input.requiredEntitlement ??
      existing?.requiredEntitlement ??
      defaultEntitlementForCategory(input.category),
    packageIds: Array.from(new Set(input.packageIds)),
    subscriberIds: Array.from(new Set(input.subscriberIds)),
    programIds: Array.from(new Set(input.programIds)),
    exerciseNames:
      kind === "video"
        ? Array.from(
            new Set(
              (input.exerciseNames ?? existing?.exerciseNames ?? [])
                .map((s) => s.trim())
                .filter(Boolean),
            ),
          )
        : [],
    uploadedBy: input.uploadedBy ?? existing?.uploadedBy ?? "Head Coach",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  nextAsset.searchTokens = buildContentSearchTokens(nextAsset)

  const updatedList = existing
    ? current.map((item) => (item.id === id ? nextAsset : item))
    : [nextAsset, ...current]

  setContentSnapshot(updatedList)

  const db = tryGetDb()
  if (db) {
    try {
      // Do not persist transient blob: URLs to Firestore; persist data: or https: URLs
      const firestorePayload: DemoContentAsset = {
        ...nextAsset,
        fileUrl: nextAsset.fileUrl?.startsWith("blob:")
          ? undefined
          : nextAsset.fileUrl,
        streamUrl: nextAsset.streamUrl?.startsWith("blob:")
          ? undefined
          : nextAsset.streamUrl,
      }
      await setDoc(
        doc(db, CONTENT_COLLECTION, id),
        stripUndefined(firestorePayload),
        { merge: true },
      )
    } catch (err) {
      console.warn("[content/service] Firestore saveContentAsset error:", err)
    }
  }

  return nextAsset
}

export type UpdateContentAssociationsInput = {
  assetId: string
  visibility: ContentVisibility
  requiredEntitlement: PackageEntitlementKey
  packageIds: string[]
  subscriberIds: string[]
  programIds: string[]
  exerciseNames?: string[]
}

export async function updateContentAssociations(
  input: UpdateContentAssociationsInput,
): Promise<DemoContentAsset> {
  const current = getContentSnapshot()
  const existing = current.find((item) => item.id === input.assetId)
  if (!existing) {
    throw new Error(`Content asset ${input.assetId} not found`)
  }

  const now = new Date().toISOString()
  const updated: DemoContentAsset = {
    ...existing,
    visibility: input.visibility,
    requiredEntitlement: input.requiredEntitlement,
    packageIds: Array.from(new Set(input.packageIds)),
    subscriberIds: Array.from(new Set(input.subscriberIds)),
    programIds: Array.from(new Set(input.programIds)),
    exerciseNames:
      existing.kind === "video"
        ? Array.from(
            new Set(
              (input.exerciseNames ?? existing.exerciseNames ?? [])
                .map((s) => s.trim())
                .filter(Boolean),
            ),
          )
        : existing.exerciseNames,
    updatedAt: now,
  }
  updated.searchTokens = buildContentSearchTokens(updated)

  const nextList = current.map((item) =>
    item.id === updated.id ? updated : item,
  )
  setContentSnapshot(nextList)

  const db = tryGetDb()
  if (db) {
    try {
      await setDoc(
        doc(db, CONTENT_COLLECTION, updated.id),
        stripUndefined({
          visibility: updated.visibility,
          requiredEntitlement: updated.requiredEntitlement,
          packageIds: updated.packageIds,
          subscriberIds: updated.subscriberIds,
          programIds: updated.programIds,
          exerciseNames: updated.exerciseNames,
          searchTokens: updated.searchTokens,
          updatedAt: updated.updatedAt,
        }),
        { merge: true },
      )
    } catch (err) {
      console.warn(
        "[content/service] Firestore updateContentAssociations error:",
        err,
      )
    }
  }

  return updated
}

export async function deleteContentAsset(assetId: string): Promise<void> {
  const current = getContentSnapshot()
  const target = current.find((item) => item.id === assetId)
  const nextList = current.filter((item) => item.id !== assetId)
  setContentSnapshot(nextList)

  const blobUrl = sessionObjectUrls.get(assetId)
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl)
    sessionObjectUrls.delete(assetId)
  }

  // If uploaded to Firebase Storage on Blaze plan, delete the storage object too
  const storageEnabled =
    import.meta.env.VITE_FIREBASE_STORAGE_ENABLED === "true"
  if (
    storageEnabled &&
    target?.storageMode === "firebase_storage" &&
    target.storagePath
  ) {
    const storage = tryGetFirebaseStorage()
    if (storage) {
      try {
        await deleteObject(ref(storage, target.storagePath))
      } catch {
        // Ignore storage object not found
      }
    }
  }

  const db = tryGetDb()
  if (db) {
    try {
      await deleteDoc(doc(db, CONTENT_COLLECTION, assetId))
    } catch (err) {
      console.warn("[content/service] Firestore deleteContentAsset error:", err)
    }
  }
}

