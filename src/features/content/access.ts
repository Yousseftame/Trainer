import { defaultEntitlementForCategory } from "@/features/content/paths"
import {
  normalizeEntitlements,
  resolveEffectiveSubscriptionStatus,
} from "@/features/subscriptions/entitlements"
import type { CatalogPackage } from "@/features/subscriptions/types"
import type { Subscriber } from "@/features/subscribers/types"
import type { ContentAsset, ContentVisibility } from "@/types/content"
import type { NutritionProgram, WorkoutProgram } from "@/types/program"
import type { SubscriberSubscription } from "@/types/subscription"

export type LinkedProgram = {
  id: string
  title: { en: string; ar: string }
  domain: "workout" | "nutrition"
  status: "template" | "active" | "archived"
  subscriberId?: string
}

export type ContentLinks = {
  programs: LinkedProgram[]
  exercises: string[]
  subscribers: Subscriber[]
  packages: CatalogPackage[]
}

export type ContentAccessCheckResult = {
  allowed: boolean
  reason: { en: string; ar: string }
}

export function contentStats(assets: ContentAsset[]) {
  return {
    videos: assets.filter((item) => item.category === "exerciseVideo").length,
    workoutPdfs: assets.filter((item) => item.category === "workoutPdf").length,
    nutritionPdfs: assets.filter((item) => item.category === "nutritionPdf")
      .length,
    resources: assets.filter(
      (item) =>
        item.category === "education" || item.category === "reference",
    ).length,
  }
}

export function isContentLinked(asset: ContentAsset): boolean {
  return (
    (asset.packageIds?.length ?? 0) > 0 ||
    (asset.subscriberIds?.length ?? 0) > 0 ||
    (asset.programIds?.length ?? 0) > 0 ||
    (asset.exerciseNames?.length ?? 0) > 0
  )
}

export function getContentLinks(
  asset: ContentAsset,
  allSubscribers: Subscriber[],
  allPackages: CatalogPackage[],
  workoutPrograms: WorkoutProgram[] = [],
  nutritionPrograms: NutritionProgram[] = [],
): ContentLinks {
  const programs: LinkedProgram[] = []
  const exercises: string[] = [...(asset.exerciseNames ?? [])]
  const seenPrograms = new Set<string>()
  const subscriberIds = new Set(asset.subscriberIds ?? [])
  const explicitProgramIds = new Set(asset.programIds ?? [])

  for (const program of workoutPrograms) {
    const matchedExercises = program.days
      .flatMap((day) => day.exercises)
      .filter((ex) => ex.videoContentId === asset.id)

    for (const ex of matchedExercises) {
      const exName =
        typeof ex.name === "string" ? ex.name : ex.name.en || ex.name.ar
      if (!exercises.includes(exName)) exercises.push(exName)
    }

    const matchesVideo = matchedExercises.length > 0
    const matchesExplicit =
      explicitProgramIds.has(program.id) ||
      Boolean(program.templateId && explicitProgramIds.has(program.templateId))
    if ((matchesVideo || matchesExplicit) && !seenPrograms.has(program.id)) {
      seenPrograms.add(program.id)
      programs.push({
        id: program.id,
        title: program.title,
        domain: "workout",
        status: program.status,
        subscriberId: program.subscriberId,
      })
      if (program.subscriberId) subscriberIds.add(program.subscriberId)
    }
  }

  for (const program of nutritionPrograms) {
    const matchesExplicit =
      explicitProgramIds.has(program.id) ||
      Boolean(program.templateId && explicitProgramIds.has(program.templateId))
    const matchesPdf = Boolean(
      asset.id && program.pdfContentId === asset.id,
    )
    if ((matchesPdf || matchesExplicit) && !seenPrograms.has(program.id)) {
      seenPrograms.add(program.id)
      programs.push({
        id: program.id,
        title: program.title,
        domain: "nutrition",
        status: program.status,
        subscriberId: program.subscriberId,
      })
      if (program.subscriberId) subscriberIds.add(program.subscriberId)
    }
  }

  const subMap = new Map(allSubscribers.map((s) => [s.id, s]))
  const subscribers = [...subscriberIds]
    .map((id) => subMap.get(id))
    .filter((item): item is Subscriber => Boolean(item))

  const pkgMap = new Map(allPackages.map((p) => [p.id, p]))
  const packages = (asset.packageIds ?? [])
    .map((id) => pkgMap.get(id))
    .filter((item): item is CatalogPackage => Boolean(item))

  return { programs, exercises, subscribers, packages }
}

/**
 * Docs: access by package entitlement + assignment/visibility.
 * Pass live subscriber + subscription + package (no demo lookups).
 * Optional program link inputs mirror the Cloud Function gate.
 */
export function evaluateSubscriberContentAccess(input: {
  asset: ContentAsset
  subscriber: Subscriber | null | undefined
  subscription: SubscriberSubscription | null | undefined
  pkg: CatalogPackage | null | undefined
  /** Assigned program document ids for this subscriber */
  assignedProgramIds?: Iterable<string>
  /** templateId values from those assigned copies */
  assignedTemplateIds?: Iterable<string>
  /** Asset ids embedded on the subscriber's programs (video/pdf links) */
  linkedAssetIds?: Iterable<string>
}): ContentAccessCheckResult {
  const { asset, subscriber, subscription, pkg } = input

  // Server already decided (subscriber callable) — trust accessAllowed when present.
  if (asset.accessAllowed === true) {
    return {
      allowed: true,
      reason: {
        en: "Unlocked by subscription entitlement",
        ar: "متاح ضمن صلاحيات الاشتراك",
      },
    }
  }
  if (asset.accessAllowed === false) {
    return {
      allowed: false,
      reason: {
        en: "Locked for this subscription",
        ar: "غير متاح في الاشتراك الحالي",
      },
    }
  }

  if (!subscriber) {
    return {
      allowed: false,
      reason: { en: "Subscriber not found", ar: "المشترك غير موجود" },
    }
  }

  if (subscriber.status !== "active") {
    return {
      allowed: false,
      reason: {
        en: `Account is ${subscriber.status}`,
        ar: `حالة الحساب غير نشطة (${subscriber.status})`,
      },
    }
  }

  if (
    !subscription ||
    resolveEffectiveSubscriptionStatus(subscription) !== "active"
  ) {
    return {
      allowed: false,
      reason: {
        en: "No active subscription",
        ar: "لا يوجد اشتراك نشط",
      },
    }
  }

  const entitlements = normalizeEntitlements(
    pkg?.entitlements ?? subscription.entitlementsSnapshot,
  )
  const reqKey =
    asset.requiredEntitlement ?? defaultEntitlementForCategory(asset.category)

  if (!entitlements[reqKey]) {
    return {
      allowed: false,
      reason: {
        en: `Package lacks '${reqKey}' entitlement`,
        ar: `الباقة الحالية لا تتضمن صلاحية (${reqKey})`,
      },
    }
  }

  const directlyAssigned = (asset.subscriberIds ?? []).includes(subscriber.id)
  const inPackage = (asset.packageIds ?? []).includes(subscription.packageId)
  const assignedProgramIds = toIdSet(input.assignedProgramIds)
  const assignedTemplateIds = toIdSet(input.assignedTemplateIds)
  const linkedAssetIds = toIdSet(input.linkedAssetIds)
  const linkedFromProgram =
    linkedAssetIds.has(asset.id) ||
    (asset.programIds ?? []).some(
      (id) => assignedProgramIds.has(id) || assignedTemplateIds.has(id),
    )

  if (directlyAssigned) {
    return {
      allowed: true,
      reason: {
        en: "Assigned directly to subscriber",
        ar: "معيّن مباشرة للمشترك",
      },
    }
  }

  if (linkedFromProgram) {
    return {
      allowed: true,
      reason: {
        en: "Unlocked via linked workout / nutrition program",
        ar: "متاح عبر برنامج تمارين / تغذية مرتبط",
      },
    }
  }

  if (asset.visibility === "assigned") {
    return {
      allowed: false,
      reason: {
        en: "Assigned content only — not linked to this subscriber",
        ar: "محتوى مخصص — غير مرتبط بهذا المشترك",
      },
    }
  }

  if (inPackage) {
    return {
      allowed: true,
      reason: {
        en: `Unlocked via ${pkg?.name.en ?? "package"}`,
        ar: `متاح ضمن باقة ${pkg?.name.ar ?? "المشترك"}`,
      },
    }
  }

  if (asset.visibility === "library") {
    return {
      allowed: true,
      reason: {
        en: "General library resource with valid entitlement",
        ar: "متاح في المكتبة العامة مع توفر صلاحية الباقة",
      },
    }
  }

  return {
    allowed: false,
    reason: {
      en: "Not assigned to subscriber's package/program",
      ar: "غير مخصص لباقة/برنامج هذا المشترك",
    },
  }
}

function toIdSet(value?: Iterable<string>): Set<string> {
  if (!value) return new Set()
  return new Set([...value].map(String).filter(Boolean))
}

/**
 * Shared create/update validation for content access fields.
 * Mirrors server unlock order: direct assign / program link / package / library.
 */
export function validateContentAssociationRules(
  input: {
    visibility: ContentVisibility
    packageIds: string[]
    subscriberIds: string[]
    programIds: string[]
  },
  locale: "en" | "ar",
): string | null {
  const isAr = locale === "ar"
  const packages = input.packageIds.length
  const subscribers = input.subscriberIds.length
  const programs = input.programIds.length

  if (input.visibility === "library") return null

  if (input.visibility === "assigned") {
    if (subscribers === 0 && programs === 0) {
      return isAr
        ? "المحتوى المخصص يحتاج مشتركاً أو برنامجاً مرتبطاً."
        : "Assigned content needs at least one subscriber or program link."
    }
    return null
  }

  // package-gated: need a package and/or an explicit unlock path
  if (packages === 0 && subscribers === 0 && programs === 0) {
    return isAr
      ? "حدّد باقة أو برنامجاً أو مشتركاً واحداً على الأقل لصلاحية الوصول."
      : "Select at least one package, program, or subscriber for access."
  }

  return null
}
