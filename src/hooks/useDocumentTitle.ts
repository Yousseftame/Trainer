import { useEffect } from "react"
import { env } from "@/config/env"

/**
 * Set the document title. Pass `null` to leave the current title untouched
 * (useful when a page is embedded inside another titled page).
 */
export function useDocumentTitle(title?: string | null): void {
  useEffect(() => {
    if (title === null) return
    document.title = title ? `${title} · ${env.appName}` : env.appName
  }, [title])
}
