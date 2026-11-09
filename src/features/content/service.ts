import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  buildCanonicalStoragePath,
  buildContentSearchTokens,
  CONTENT_UPLOAD_LIMITS,
  defaultEntitlementForCategory,
  defaultKindForCategory,
  formatBytesLabel,
  isHttpUrl,
} from "@/features/content/paths"
import { callListSubscriberContentLibrary } from "@/lib/firebase/callables"
import { getDb } from "@/lib/firebase/firestore"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type {
  ContentAsset,
  ContentCategory,
  ContentVisibility,
  StorageBackendMode,
  VideoProviderId,
} from "@/types/content"
import type { PackageEntitlementKey } from "@/types/subscription"

const CONTENT_COLLECTION = "content_assets"
const LEGACY_CONTENT_CACHE_KEY = "trainer_admin_content_v2"

try {
  window.localStorage.removeItem(LEGACY_CONTENT_CACHE_KEY)
} catch {
  // ignore
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function normalizeContentAsset(
  id: string,
  raw: Record<string, unknown>,
): ContentAsset {
  const category = (raw.category as ContentCategory) || "education"
  const kind = (raw.kind as ContentAsset["kind"]) || defaultKindForCategory(category)
  const titleRaw = (raw.title ?? {}) as Record<string, string>
  const descRaw = (raw.description ?? {}) as Record<string, string>

  const asset: ContentAsset = {
    id,
    category,
    kind,
    title: {
      en: String(titleRaw.en ?? id),
      ar: String(titleRaw.ar ?? titleRaw.en ?? id),
    },
    description: {
      en: String(descRaw.en ?? ""),
      ar: String(descRaw.ar ?? descRaw.en ?? ""),
    },
    fileName: typeof raw.fileName === "string" ? raw.fileName : undefined,
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : undefined,
    sizeBytes: typeof raw.sizeBytes === "number" ? raw.sizeBytes : undefined,
    sizeLabel:
      typeof raw.sizeLabel === "string"
        ? raw.sizeLabel
        : formatBytesLabel(
            typeof raw.sizeBytes === "number" ? raw.sizeBytes : undefined,
          ),
    pageCount: typeof raw.pageCount === "number" ? raw.pageCount : undefined,
    durationSeconds:
      typeof raw.durationSeconds === "number" ? raw.durationSeconds : undefined,
    storagePath:
      typeof raw.storagePath === "string" && raw.storagePath
        ? raw.storagePath
        : buildCanonicalStoragePath({
            id,
            category,
            fileName: typeof raw.fileName === "string" ? raw.fileName : undefined,
            videoProvider: raw.videoProvider as VideoProviderId | undefined,
            videoAssetId:
              typeof raw.videoAssetId === "string" ? raw.videoAssetId : undefined,
            createdAt:
              typeof raw.createdAt === "string" ? raw.createdAt : undefined,
          }),
    fileUrl: typeof raw.fileUrl === "string" ? raw.fileUrl : undefined,
    storageMode: raw.storageMode as StorageBackendMode | undefined,
    videoProvider:
      kind === "video"
        ? ((raw.videoProvider as VideoProviderId) ?? "bunny")
        : undefined,
    videoAssetId:
      typeof raw.videoAssetId === "string" ? raw.videoAssetId : undefined,
    streamUrl: typeof raw.streamUrl === "string" ? raw.streamUrl : undefined,
    thumbnailUrl:
      typeof raw.thumbnailUrl === "string" ? raw.thumbnailUrl : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    visibility: (raw.visibility as ContentVisibility) || "package",
    requiredEntitlement:
      (raw.requiredEntitlement as PackageEntitlementKey) ||
      defaultEntitlementForCategory(category),
    packageIds: Array.isArray(raw.packageIds)
      ? raw.packageIds.map(String)
      : [],
    subscriberIds: Array.isArray(raw.subscriberIds)
      ? raw.subscriberIds.map(String)
      : [],
    programIds: Array.isArray(raw.programIds)
      ? raw.programIds.map(String)
      : [],
    exerciseNames: Array.isArray(raw.exerciseNames)
      ? raw.exerciseNames.map(String)
      : [],
    uploadedBy: typeof raw.uploadedBy === "string" ? raw.uploadedBy : undefined,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
    accessAllowed:
      typeof raw.accessAllowed === "boolean" ? raw.accessAllowed : undefined,
  }
  asset.searchTokens =
    Array.isArray(raw.searchTokens) && raw.searchTokens.length
      ? raw.searchTokens.map(String)
      : buildContentSearchTokens(asset)
  return asset
}

/** Staff SDK list — requires content:manage or subscribers:read in rules. */
export async function fetchContentAssets(): Promise<ContentAsset[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, CONTENT_COLLECTION))
    return snap.docs
      .map((d) =>
        normalizeContentAsset(d.id, d.data() as Record<string, unknown>),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  } catch (err) {
    console.warn("[content] Failed to load content_assets:", err)
    throw err instanceof Error ? err : new Error("Failed to load content library")
  }
}

/**
 * Subscriber library — entitlement-gated via Cloud Function.
 * Locked items come back without fileUrl / streamUrl / storagePath.
 */
export async function fetchSubscriberContentLibrary(): Promise<ContentAsset[]> {
  try {
    const result = await callListSubscriberContentLibrary()
    return result.assets
      .map((raw) =>
        normalizeContentAsset(raw.id, raw as Record<string, unknown>),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  } catch (err) {
    console.warn("[content] Failed to load subscriber content library:", err)
    throw err instanceof Error
      ? err
      : new Error("Failed to load content library")
  }
}

export async function fetchContentAssetById(
  assetId: string,
): Promise<ContentAsset | null> {
  if (!assetId) return null
  try {
    const db = getDb()
    const snap = await getDoc(doc(db, CONTENT_COLLECTION, assetId))
    if (!snap.exists()) return null
    return normalizeContentAsset(
      snap.id,
      snap.data() as Record<string, unknown>,
    )
  } catch (err) {
    console.warn("[content] Failed to read content asset:", err)
    return null
  }
}

export type SaveContentAssetInput = {
  id?: string
  category: ContentCategory
  title: { en: string; ar: string }
  description: { en: string; ar: string }
  fileName?: string
  mimeType?: string
  sizeBytes?: number
  pageCount?: number | null
  durationSeconds?: number | null
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
  file?: File | null
  onUploadProgress?: (percent: number) => void
}

async function uploadToFirebaseStorage(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const storage = getFirebaseStorage()
  const storageRef = ref(storage, path)
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || undefined,
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
  if (!path || path.startsWith("http") || path.startsWith("data:")) return
  try {
    await deleteObject(ref(getFirebaseStorage(), path))
  } catch {
    // Object may already be gone
  }
}

/**
 * Save content metadata to Firestore and binaries to the right backend:
 * - PDF/docs → Firebase Storage (private, cost-efficient object storage)
 * - Videos → external streaming CDN by default (Bunny/CF/Mux/YouTube/Vimeo)
 *   optional small local upload to Storage with a hard size cap
 */
export async function saveContentAsset(
  input: SaveContentAssetInput,
): Promise<ContentAsset> {
  const now = new Date().toISOString()
  const db = getDb()
  const existing = input.id
    ? await fetchContentAssetById(input.id)
    : null

  const id = existing?.id ?? doc(collection(db, CONTENT_COLLECTION)).id
  const kind = defaultKindForCategory(input.category)
  const file = input.file ?? null

  if (file) {
    if (kind === "video" && file.size > CONTENT_UPLOAD_LIMITS.videoBytes) {
      throw new Error(
        `Video file exceeds ${formatBytesLabel(CONTENT_UPLOAD_LIMITS.videoBytes)}. Upload to Bunny/Cloudflare/Mux and paste the stream URL instead.`,
      )
    }
    if (kind !== "video" && file.size > CONTENT_UPLOAD_LIMITS.pdfBytes) {
      throw new Error(
        `Document exceeds ${formatBytesLabel(CONTENT_UPLOAD_LIMITS.pdfBytes)} upload limit.`,
      )
    }
  }

  const effectiveFileName =
    file?.name ||
    input.fileName?.trim() ||
    existing?.fileName ||
    (kind === "video" ? `${id}.mp4` : `${id}.pdf`)

  const videoProvider: VideoProviderId | undefined =
    kind === "video"
      ? input.videoProvider || existing?.videoProvider || "bunny"
      : undefined

  const canonicalPath = buildCanonicalStoragePath({
    id,
    category: input.category,
    fileName: effectiveFileName,
    videoProvider,
    videoAssetId: input.videoAssetId?.trim() || existing?.videoAssetId,
    createdAt: existing?.createdAt ?? now,
  })

  let resolvedFileUrl = input.fileUrl?.trim() || existing?.fileUrl
  let resolvedStreamUrl = input.streamUrl?.trim() || existing?.streamUrl
  let storageMode: StorageBackendMode =
    existing?.storageMode ??
    (resolvedStreamUrl || resolvedFileUrl ? "external_cdn" : "metadata_only")
  let storagePath = existing?.storagePath || canonicalPath
  let previousStoragePathToDelete: string | null = null

  // Validate delivery source for create
  if (!existing) {
    if (kind === "video") {
      const hasExternal = isHttpUrl(resolvedStreamUrl) || isHttpUrl(resolvedFileUrl)
      if (!file && !hasExternal) {
        throw new Error(
          "Videos require a streaming URL (recommended) or a local file under the upload limit.",
        )
      }
    } else if (!file && !isHttpUrl(resolvedFileUrl)) {
      throw new Error("Please upload a PDF/document or provide a valid https URL.")
    }
  }

  if (file) {
    // Replace previous Storage object when path changes or file replaced
    if (
      existing?.storageMode === "firebase_storage" &&
      existing.storagePath &&
      existing.storagePath !== canonicalPath
    ) {
      previousStoragePathToDelete = existing.storagePath
    }

    const downloadUrl = await uploadToFirebaseStorage(
      canonicalPath,
      file,
      input.onUploadProgress,
    )
    resolvedFileUrl = downloadUrl
    if (kind === "video") resolvedStreamUrl = downloadUrl
    storageMode = "firebase_storage"
    storagePath = canonicalPath
  } else if (kind === "video" && isHttpUrl(resolvedStreamUrl || resolvedFileUrl)) {
    storageMode = "external_cdn"
    // Keep a stable canonical path for organization/search even when CDN hosts bytes
    storagePath = canonicalPath
  } else if (kind !== "video" && isHttpUrl(resolvedFileUrl) && !file) {
    storageMode = "external_cdn"
    storagePath = canonicalPath
  }

  const sizeBytes = file?.size ?? input.sizeBytes ?? existing?.sizeBytes
  const cleanTitleEn = input.title.en.trim() || input.title.ar.trim()
  const cleanTitleAr = input.title.ar.trim() || input.title.en.trim()
  if (!cleanTitleEn && !cleanTitleAr) {
    throw new Error("Content title is required")
  }

  const nextAsset: ContentAsset = {
    id,
    category: input.category,
    kind,
    title: { en: cleanTitleEn, ar: cleanTitleAr },
    description: {
      en: input.description.en.trim() || input.description.ar.trim(),
      ar: input.description.ar.trim() || input.description.en.trim(),
    },
    fileName: effectiveFileName,
    mimeType:
      file?.type ||
      input.mimeType ||
      existing?.mimeType ||
      (kind === "video" ? "video/mp4" : "application/pdf"),
    sizeBytes,
    sizeLabel: formatBytesLabel(sizeBytes),
    pageCount:
      kind === "video"
        ? undefined
        : (input.pageCount ?? existing?.pageCount ?? undefined) || undefined,
    durationSeconds:
      kind === "video"
        ? (input.durationSeconds ?? existing?.durationSeconds ?? undefined) ||
          undefined
        : undefined,
    storagePath,
    fileUrl: resolvedFileUrl,
    storageMode,
    videoProvider,
    videoAssetId:
      kind === "video"
        ? input.videoAssetId?.trim() || existing?.videoAssetId || undefined
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

  await setDoc(
    doc(db, CONTENT_COLLECTION, id),
    stripUndefined({ ...nextAsset }),
  )

  if (previousStoragePathToDelete) {
    await deleteStoragePath(previousStoragePathToDelete)
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
): Promise<ContentAsset> {
  const existing = await fetchContentAssetById(input.assetId)
  if (!existing) throw new Error("Content asset not found")

  const updated: ContentAsset = {
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
    updatedAt: new Date().toISOString(),
  }
  updated.searchTokens = buildContentSearchTokens(updated)

  const db = getDb()
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

  return updated
}

export async function deleteContentAsset(assetId: string): Promise<void> {
  const existing = await fetchContentAssetById(assetId)
  const db = getDb()
  await deleteDoc(doc(db, CONTENT_COLLECTION, assetId))

  const path = existing?.storagePath
  const shouldDeleteObject =
    existing?.storageMode === "firebase_storage" ||
    (Boolean(path) &&
      path!.startsWith("content/") &&
      !path!.startsWith("http") &&
      existing?.storageMode !== "external_cdn" &&
      existing?.storageMode !== "metadata_only")

  if (shouldDeleteObject) {
    await deleteStoragePath(path)
  }
}
