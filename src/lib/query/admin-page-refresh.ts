import type { QueryClient } from "@tanstack/react-query"
import { APP_ROUTES } from "@/config/constants"

/**
 * Query-key roots used by each admin route.
 * Refresh only refetches active observers for these prefixes — not the whole app cache.
 */
export function resolveAdminPageQueryKeys(
  pathname: string,
): readonly (readonly unknown[])[] {
  const path = pathname.replace(/\/+$/, "") || "/"

  const subscriberDetailMatch = path.match(
    /^\/admin\/subscribers\/([^/]+)$/,
  )
  if (subscriberDetailMatch) {
    const id = decodeURIComponent(subscriberDetailMatch[1])
    return [
      ["subscribers", "detail", id],
      ["packages"],
      ["subscriptions"],
      ["progress", "measurements", id],
      ["progress", "photos", id],
      ["progress", "performance", id],
      ["physical_therapy", "list", id],
      ["workouts"],
      ["nutrition"],
    ]
  }

  if (path === APP_ROUTES.admin.subscribers) {
    return [["subscribers"], ["subscriptions"], ["packages"]]
  }

  if (path === APP_ROUTES.admin.registrationRequests) {
    return [["registrationRequests"], ["packages"]]
  }

  if (path === APP_ROUTES.admin.packages) {
    return [["packages"], ["subscriptions"]]
  }

  if (path === APP_ROUTES.admin.subscriptions) {
    return [
      ["subscriptions"],
      ["packages"],
      ["subscribers"],
      ["subscription_change_requests"],
    ]
  }

  if (path === APP_ROUTES.admin.workouts) {
    return [["workouts"], ["subscribers"], ["content_assets"]]
  }

  if (path === APP_ROUTES.admin.nutrition) {
    return [["nutrition"], ["subscribers"]]
  }

  if (path === APP_ROUTES.admin.content) {
    return [
      ["content_assets"],
      ["packages"],
      ["subscribers"],
      ["subscriptions"],
      ["workouts"],
      ["nutrition"],
    ]
  }

  if (path === APP_ROUTES.admin.progress) {
    return [
      ["subscribers"],
      ["progress"],
      ["workouts"],
      ["nutrition"],
      ["subscriptions"],
      ["packages"],
    ]
  }

  if (path === APP_ROUTES.admin.physicalTherapy) {
    return [["physical_therapy"], ["subscribers"], ["content_assets"]]
  }

  if (path === APP_ROUTES.admin.staff) {
    return [["staff_members"]]
  }

  if (path === APP_ROUTES.admin.reports) {
    return [["reports"]]
  }

  // Overview / admin root / unknown admin paths
  if (path === APP_ROUTES.admin.overview || path === APP_ROUTES.admin.root) {
    return [["admin", "overview"]]
  }

  if (path.startsWith("/admin")) {
    return [["admin", "overview"]]
  }

  return []
}

/** Refetch only the active queries that power the current admin page. */
export async function refreshAdminPageData(
  queryClient: QueryClient,
  pathname: string,
): Promise<number> {
  const keys = resolveAdminPageQueryKeys(pathname)
  if (!keys.length) return 0

  const results = await Promise.all(
    keys.map((queryKey) =>
      queryClient.refetchQueries({
        queryKey: [...queryKey],
        type: "active",
      }),
    ),
  )

  return results.reduce((sum, n) => sum + n, 0)
}
