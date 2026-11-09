export type PackageEntitlementKey =
  | "workoutProgram"
  | "nutritionProgram"
  | "exerciseVideos"
  | "pdfDocuments"
  | "progressTracking";

export type PackageEntitlements = Record<PackageEntitlementKey, boolean>;

export type ContentVisibility = "library" | "assigned" | "package";

export type ContentCategory =
  | "workoutPdf"
  | "nutritionPdf"
  | "exerciseVideo"
  | "education"
  | "reference";

const DEFAULT_ENTITLEMENTS: PackageEntitlements = {
  workoutProgram: true,
  nutritionProgram: true,
  exerciseVideos: true,
  pdfDocuments: true,
  progressTracking: true,
};

export function normalizeEntitlements(
  input?: Partial<PackageEntitlements> | null,
): PackageEntitlements {
  return {
    workoutProgram: input?.workoutProgram ?? DEFAULT_ENTITLEMENTS.workoutProgram,
    nutritionProgram:
      input?.nutritionProgram ?? DEFAULT_ENTITLEMENTS.nutritionProgram,
    exerciseVideos: input?.exerciseVideos ?? DEFAULT_ENTITLEMENTS.exerciseVideos,
    pdfDocuments: input?.pdfDocuments ?? DEFAULT_ENTITLEMENTS.pdfDocuments,
    progressTracking:
      input?.progressTracking ?? DEFAULT_ENTITLEMENTS.progressTracking,
  };
}

export function defaultEntitlementForCategory(
  category: ContentCategory | string,
): PackageEntitlementKey {
  switch (category) {
    case "exerciseVideo":
      return "exerciseVideos";
    case "workoutPdf":
      return "workoutProgram";
    case "nutritionPdf":
      return "nutritionProgram";
    case "education":
    case "reference":
    default:
      return "pdfDocuments";
  }
}

export type ContentAccessInput = {
  category: string;
  visibility?: string;
  requiredEntitlement?: string;
  packageIds?: string[];
  subscriberIds?: string[];
};

export type ContentAccessResult = {
  allowed: boolean;
  reason: string;
};

/**
 * Server-side mirror of src/features/content/access.ts evaluateSubscriberContentAccess.
 * Reference assets never leave the staff surface.
 */
export function evaluateSubscriberContentAccess(input: {
  asset: ContentAccessInput;
  subscriberId: string;
  subscriberStatus: string;
  subscriptionStatus: string | null;
  packageId: string | null;
  entitlements: PackageEntitlements;
}): ContentAccessResult {
  const {asset, subscriberId, subscriberStatus, subscriptionStatus, packageId} =
    input;

  if (asset.category === "reference") {
    return {allowed: false, reason: "reference_staff_only"};
  }

  if (subscriberStatus !== "active") {
    return {allowed: false, reason: "subscriber_inactive"};
  }

  if (subscriptionStatus !== "active") {
    return {allowed: false, reason: "subscription_inactive"};
  }

  const reqKey =
    (asset.requiredEntitlement as PackageEntitlementKey | undefined) ||
    defaultEntitlementForCategory(asset.category);

  if (!input.entitlements[reqKey]) {
    return {allowed: false, reason: `missing_entitlement:${reqKey}`};
  }

  const subscriberIds = Array.isArray(asset.subscriberIds)
    ? asset.subscriberIds
    : [];
  const packageIds = Array.isArray(asset.packageIds) ? asset.packageIds : [];
  const directlyAssigned = subscriberIds.includes(subscriberId);
  const inPackage = Boolean(packageId && packageIds.includes(packageId));
  const visibility = (asset.visibility || "package") as ContentVisibility;

  if (directlyAssigned) {
    return {allowed: true, reason: "direct_assignment"};
  }

  if (visibility === "assigned") {
    return {allowed: false, reason: "assigned_only"};
  }

  if (inPackage) {
    return {allowed: true, reason: "package"};
  }

  if (visibility === "library") {
    return {allowed: true, reason: "library"};
  }

  return {allowed: false, reason: "not_linked"};
}

export function resolveEffectiveSubscriptionStatus(
  status: string | undefined,
  endsAt: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!status) return null;
  if (status === "active" && endsAt) {
    const endMs = new Date(endsAt).getTime();
    if (!Number.isNaN(endMs) && endMs < now.getTime()) {
      return "expired";
    }
  }
  return status;
}
