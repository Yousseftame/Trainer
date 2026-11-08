import { useState } from "react"
import { useAuth } from "@/features/auth/auth-context"
import { useMySubscriberQuery } from "@/features/subscribers/hooks"
import type { Subscriber } from "@/features/subscribers/types"

/**
 * Resolves the signed-in subscriber for /app pages.
 * Always a single-doc read (Auth UID). Admin accounts cannot reach /app.
 */
export function usePanelSubscriber(_options?: { allowStaffPicker?: boolean }) {
  void _options
  const { user, isAdmin } = useAuth()
  const selfId = user?.uid
  const myQuery = useMySubscriberQuery(selfId)

  // Kept for page API compatibility; always false (panel isolation)
  const [selectedSubscriberId, setSelectedSubscriberId] = useState("")
  const directory: Subscriber[] = []

  return {
    user,
    isAdmin: Boolean(isAdmin),
    staffCanPick: false as const,
    subscriber: myQuery.data ?? null,
    subscriberId: myQuery.data?.id ?? selfId ?? "",
    directory,
    selectedSubscriberId,
    setSelectedSubscriberId,
    isLoading: myQuery.isLoading,
  }
}
