import { useQuery } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import { fetchOverviewDesk } from "@/features/overview/service"

export const OVERVIEW_QUERY_KEY = ["admin", "overview"] as const

export function useOverviewDeskQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: OVERVIEW_QUERY_KEY,
    queryFn: fetchOverviewDesk,
    staleTime: QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled ?? true,
  })
}
