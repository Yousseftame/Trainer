import { APP_ROUTES } from "@/config/constants"
import type { RegistrationRequest, Subscriber } from "@/features/subscribers/types"
import type { CatalogPackage } from "@/features/subscriptions/types"
import type { NutritionProgram, WorkoutProgram } from "@/types/program"
import type { SubscriberSubscription } from "@/types/subscription"
import type { PriorityItem, PriorityKind } from "@/features/overview/demo"

export type OverviewLiveInput = {
  subscribers: Subscriber[]
  subscriptions: SubscriberSubscription[]
  packages: CatalogPackage[]
  registrationRequests: RegistrationRequest[]
  workoutPrograms?: WorkoutProgram[]
  nutritionPrograms?: NutritionProgram[]
}

function daysFromToday(value: string | null | undefined) {
  if (!value) return null
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000)
}

function packageById(packages: CatalogPackage[], id: string | null | undefined) {
  if (!id) return undefined
  return packages.find((p) => p.id === id)
}

function latestSubscriptionFor(
  subscriptions: SubscriberSubscription[],
  subscriberId: string,
) {
  return [...subscriptions]
    .filter((item) => item.subscriberId === subscriberId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
}

function seatMix(
  subscribers: Subscriber[],
  subscriptions: SubscriberSubscription[],
) {
  const counts = { active: 0, expired: 0, pending: 0, suspended: 0 }
  for (const person of subscribers) {
    if (person.status === "rejected") continue
    const seat = latestSubscriptionFor(subscriptions, person.id)
    if (!seat) continue
    if (seat.status === "active") counts.active += 1
    else if (seat.status === "expired") counts.expired += 1
    else if (seat.status === "pending") counts.pending += 1
    else if (seat.status === "suspended") counts.suspended += 1
  }
  return counts
}

function packageRows(
  packages: CatalogPackage[],
  subscriptions: SubscriberSubscription[],
) {
  const live = packages.filter((item) => item.isActive)
  const activeTotal =
    subscriptions.filter((item) => item.status === "active").length || 1
  const expiringIds = new Set(
    subscriptions
      .filter((item) => {
        if (item.status !== "active") return false
        const days = daysFromToday(item.endsAt)
        return days != null && days >= 0 && days <= 14
      })
      .map((item) => item.id),
  )

  return live
    .map((pkg) => {
      const seats = subscriptions.filter((item) => item.packageId === pkg.id)
      const active = seats.filter((item) => item.status === "active").length
      return {
        pkg,
        active,
        pending: seats.filter((item) => item.status === "pending").length,
        expiring: seats.filter((item) => expiringIds.has(item.id)).length,
        share: Math.round((active / activeTotal) * 100),
      }
    })
    .sort((a, b) => b.active - a.active)
}

/**
 * Live admin overview snapshot — subscribers / packages / subscriptions /
 * registration / workout programs come from Firestore (fetch-on-need).
 * Nutrition adherence stays neutral until that module is fully live.
 */
export function buildOverviewSnapshot(input: OverviewLiveInput) {
  const {
    subscribers,
    subscriptions,
    packages,
    registrationRequests,
    workoutPrograms = [],
    nutritionPrograms = [],
  } = input
  const mix = seatMix(subscribers, subscriptions)

  const pendingRequests = registrationRequests
    .filter((item) => item.status === "pending")
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  const requests = pendingRequests.map((item) => ({
    id: item.id,
    name: item.displayName,
    createdAt: item.createdAt,
    packageName: packageById(packages, item.packageId)?.name,
  }))

  const expiring = subscriptions
    .filter((item) => {
      if (item.status !== "active") return false
      const days = daysFromToday(item.endsAt)
      return days != null && days >= 0 && days <= 14
    })
    .sort(
      (a, b) =>
        new Date(a.endsAt ?? 0).getTime() - new Date(b.endsAt ?? 0).getTime(),
    )
    .map((item) => {
      const person = subscribers.find((s) => s.id === item.subscriberId)
      return {
        id: item.id,
        subscriberId: item.subscriberId,
        name: person?.displayName ?? item.subscriberId,
        packageName: packageById(packages, item.packageId)?.name,
        endsAt: item.endsAt,
        daysLeft: daysFromToday(item.endsAt) ?? 0,
      }
    })

  const expiredSeats = subscribers
    .filter((person) => person.status !== "rejected")
    .map((person) => ({
      person,
      seat: latestSubscriptionFor(subscriptions, person.id),
    }))
    .filter((item) => item.seat?.status === "expired")
    .map((item) => ({
      id: item.seat!.id,
      subscriberId: item.person.id,
      name: item.person.displayName,
      packageName: packageById(packages, item.seat!.packageId)?.name,
      days: Math.abs(daysFromToday(item.seat!.endsAt) ?? 0),
    }))

  const priority: PriorityItem[] = [
    ...requests.map((item) => ({
      id: `req-${item.id}`,
      kind: "request" as PriorityKind,
      name: item.name,
      href: APP_ROUTES.admin.registrationRequests,
      packageName: item.packageName,
      createdAt: item.createdAt,
    })),
    ...expiring.map((item) => ({
      id: `exp-${item.id}`,
      kind: "expiring" as PriorityKind,
      name: item.name,
      href: APP_ROUTES.admin.subscriberDetail(item.subscriberId),
      packageName: item.packageName,
      daysLeft: item.daysLeft,
    })),
    ...expiredSeats.map((item) => ({
      id: `end-${item.id}`,
      kind: "expired" as PriorityKind,
      name: item.name,
      href: APP_ROUTES.admin.subscriberDetail(item.subscriberId),
      packageName: item.packageName,
      days: item.days,
    })),
  ].slice(0, 6)

  return {
    today: new Date().toISOString(),
    subscribers: {
      total: subscribers.filter((item) => item.status !== "rejected").length,
      active: subscribers.filter((item) => item.status === "active").length,
    },
    subscriptions: {
      ...mix,
      expiring: expiring.length,
    },
    adherence: {
      workout: null as number | null,
      nutrition: null as number | null,
      overall: null as number | null,
      previous: null as number | null,
      trend: [] as Array<{
        week: string
        workout: number | null
        nutrition: number | null
        overall: number | null
      }>,
    },
    checkIns: {
      now: 0,
      previous: 0,
      trend: [] as Array<{ week: string; count: number }>,
    },
    progress: { onTrack: 0, attention: 0, quiet: 0 },
    packages: packageRows(packages, subscriptions),
    programs: {
      workouts: workoutPrograms.filter((item) => item.status === "active").length,
      nutrition: nutritionPrograms.filter((item) => item.status === "active")
        .length,
    },
    queue: priority.length,
    requests: requests.length,
    priority,
  }
}

export type LiveOverviewSnapshot = ReturnType<typeof buildOverviewSnapshot>
