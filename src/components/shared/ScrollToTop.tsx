import { useEffect, useLayoutEffect } from "react"
import { useLocation } from "react-router-dom"

/**
 * Universal ScrollToTop handler for Single Page Application navigation.
 * Handles:
 * 1. Window viewport scrolling (document.documentElement, document.body)
 * 2. Inner scrollable containers (<main> elements in Admin & Subscriber dashboards)
 * 3. Hash anchor links (e.g., #contact, #packages) with smooth scrolling
 * 4. Dual-phase execution (immediate layout effect + requestAnimationFrame) to prevent scroll retention across pages.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  const resetScroll = () => {
    // If a hash is present, attempt to scroll to the target element
    if (hash) {
      const targetId = hash.replace(/^#/, "")
      const element = document.getElementById(targetId) || document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
        return
      }
    }

    // 1. Reset standard window/viewport scroll
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0

    // 2. Reset all scrollable containers in the DOM (e.g., dashboard/subscriber main panels)
    const scrollableSelectors = [
      "main",
      "[data-scroll-container]",
      ".dashboard-shell main",
      ".subscriber-layout main",
    ]
    const scrollables = document.querySelectorAll<HTMLElement>(scrollableSelectors.join(","))
    scrollables.forEach((container) => {
      container.scrollTo({ top: 0, left: 0, behavior: "instant" })
      container.scrollTop = 0
    })
  }

  // Phase 1: Execute synchronously before paint
  useLayoutEffect(() => {
    resetScroll()
  }, [pathname, search, hash])

  // Phase 2: Execute in next tick/frame to catch lazy chunk loads & dynamic layout shifts
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      resetScroll()
    })
    const timer = setTimeout(() => {
      resetScroll()
    }, 60)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timer)
    }
  }, [pathname, search, hash])

  return null
}

