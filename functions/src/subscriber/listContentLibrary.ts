import {HttpsError, onCall} from "firebase-functions/v2/https";
import {COLLECTIONS} from "../config/collections.js";
import {db, storage} from "../config/firebase.js";
import {assertSubscriberCaller} from "../lib/authz.js";
import {
  evaluateSubscriberContentAccess,
  normalizeEntitlements,
  resolveEffectiveSubscriptionStatus,
  type PackageEntitlements,
} from "../shared/contentAccess.js";

const SIGNED_URL_TTL_MS = 60 * 60 * 1000; // 1 hour

type RawAsset = Record<string, unknown>;

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

async function signedReadUrl(storagePath: string): Promise<string | undefined> {
  if (!storagePath || storagePath.startsWith("http") || storagePath.startsWith("data:")) {
    return undefined;
  }
  try {
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
    });
    return url;
  } catch {
    return undefined;
  }
}

function redactLockedAsset(id: string, raw: RawAsset): Record<string, unknown> {
  return {
    id,
    category: raw.category,
    kind: raw.kind,
    title: raw.title,
    description: raw.description,
    fileName: raw.fileName,
    mimeType: raw.mimeType,
    sizeBytes: raw.sizeBytes,
    sizeLabel: raw.sizeLabel,
    pageCount: raw.pageCount,
    durationSeconds: raw.durationSeconds,
    tags: asStringArray(raw.tags),
    visibility: raw.visibility ?? "package",
    requiredEntitlement: raw.requiredEntitlement,
    packageIds: asStringArray(raw.packageIds),
    subscriberIds: asStringArray(raw.subscriberIds),
    programIds: asStringArray(raw.programIds),
    exerciseNames: asStringArray(raw.exerciseNames),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    accessAllowed: false,
    // Sensitive delivery fields intentionally omitted
    storagePath: undefined,
    fileUrl: undefined,
    streamUrl: undefined,
    thumbnailUrl: raw.thumbnailUrl,
    videoProvider: raw.videoProvider,
    videoAssetId: undefined,
    storageMode: raw.storageMode,
  };
}

async function enrichAllowedAsset(
  id: string,
  raw: RawAsset,
): Promise<Record<string, unknown>> {
  const storageMode = String(raw.storageMode ?? "");
  const storagePath =
    typeof raw.storagePath === "string" ? raw.storagePath : undefined;

  let fileUrl = typeof raw.fileUrl === "string" ? raw.fileUrl : undefined;
  let streamUrl =
    typeof raw.streamUrl === "string" ? raw.streamUrl : undefined;

  if (storageMode === "firebase_storage" && storagePath) {
    const signed = await signedReadUrl(storagePath);
    if (signed) {
      fileUrl = signed;
      if (String(raw.kind) === "video") streamUrl = signed;
    }
  }

  return {
    ...raw,
    id,
    packageIds: asStringArray(raw.packageIds),
    subscriberIds: asStringArray(raw.subscriberIds),
    programIds: asStringArray(raw.programIds),
    exerciseNames: asStringArray(raw.exerciseNames),
    tags: asStringArray(raw.tags),
    fileUrl,
    streamUrl,
    accessAllowed: true,
  };
}

/**
 * Subscriber content catalog — entitlement-gated, URL-safe.
 * Client SDK cannot list content_assets; this is the only subscriber path.
 */
export const listSubscriberContentLibrary = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);

  const subscriberSnap = await db
    .collection(COLLECTIONS.subscribers)
    .doc(uid)
    .get();
  if (!subscriberSnap.exists) {
    throw new HttpsError("not-found", "Subscriber profile not found.");
  }

  const subscriber = subscriberSnap.data() ?? {};
  const subscriberStatus = String(subscriber.status ?? "pending");

  const subsSnap = await db
    .collection(COLLECTIONS.subscriptions)
    .where("subscriberId", "==", uid)
    .get();

  let bestSubData: Record<string, unknown> | null = null;
  for (const docSnap of subsSnap.docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const status = String(data.status ?? "");
    if (status === "active" || status === "suspended") {
      bestSubData = data;
      if (status === "active") break;
    }
    if (!bestSubData) bestSubData = data;
  }

  const subData = bestSubData;
  const packageId = subData ? String(subData.packageId ?? "") : null;
  const effectiveStatus = resolveEffectiveSubscriptionStatus(
    subData ? String(subData.status ?? "") : undefined,
    subData?.endsAt ? String(subData.endsAt) : null,
  );

  let entitlements: PackageEntitlements = normalizeEntitlements(
    (subData?.entitlementsSnapshot as Partial<PackageEntitlements> | undefined) ??
      null,
  );

  if (packageId) {
    const pkgSnap = await db.collection(COLLECTIONS.packages).doc(packageId).get();
    if (pkgSnap.exists) {
      const pkg = pkgSnap.data() ?? {};
      entitlements = normalizeEntitlements(
        (pkg.entitlements as Partial<PackageEntitlements> | undefined) ??
          (subData?.entitlementsSnapshot as
            | Partial<PackageEntitlements>
            | undefined) ??
          null,
      );
    }
  }

  const assetsSnap = await db.collection(COLLECTIONS.contentAssets).get();
  const assets: Record<string, unknown>[] = [];

  for (const docSnap of assetsSnap.docs) {
    const raw = docSnap.data() as RawAsset;
    const category = String(raw.category ?? "education");
    if (category === "reference") continue;

    const access = evaluateSubscriberContentAccess({
      asset: {
        category,
        visibility: String(raw.visibility ?? "package"),
        requiredEntitlement:
          typeof raw.requiredEntitlement === "string"
            ? raw.requiredEntitlement
            : undefined,
        packageIds: asStringArray(raw.packageIds),
        subscriberIds: asStringArray(raw.subscriberIds),
      },
      subscriberId: uid,
      subscriberStatus,
      subscriptionStatus: effectiveStatus,
      packageId,
      entitlements,
    });

    if (access.allowed) {
      assets.push(await enrichAllowedAsset(docSnap.id, raw));
    } else {
      // Locked cards for library UX — no delivery URLs / storage paths
      assets.push(redactLockedAsset(docSnap.id, raw));
    }
  }

  assets.sort((a, b) => {
    const aTime = new Date(String(a.updatedAt ?? 0)).getTime();
    const bTime = new Date(String(b.updatedAt ?? 0)).getTime();
    return bTime - aTime;
  });

  return {
    assets,
    meta: {
      packageId,
      subscriptionStatus: effectiveStatus,
      entitlements,
    },
  };
});
