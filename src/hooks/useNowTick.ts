import { useEffect, useState } from "react"

/**
 * Live clock for subscription countdowns.
 * Ticks on an interval and again at local midnight so "days remaining"
 * rolls without requiring a full page reload.
 */
export function useNowTick(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const intervalId = window.setInterval(tick, Math.max(5_000, intervalMs))

    const scheduleMidnight = () => {
      const current = new Date()
      const next = new Date(current)
      next.setHours(24, 0, 5, 0) // slightly after midnight
      return window.setTimeout(() => {
        tick()
        midnightId = scheduleMidnight()
      }, Math.max(1_000, next.getTime() - current.getTime()))
    }
    let midnightId = scheduleMidnight()

    const onVisible = () => {
      if (document.visibilityState === "visible") tick()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(midnightId)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [intervalMs])

  return now
}
