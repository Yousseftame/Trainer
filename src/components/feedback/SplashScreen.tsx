import { useEffect, useRef } from "react"

export function SplashScreen() {
  const closingStartedRef = useRef(false)

  useEffect(() => {
    const splashEl = document.getElementById("initial-splash")
    const logoEl = document.getElementById("initial-splash-logo")

    if (!splashEl || closingStartedRef.current) return

    const startExit = () => {
      if (closingStartedRef.current) return
      closingStartedRef.current = true
      splashEl.style.pointerEvents = "none"

      if (logoEl && typeof logoEl.animate === "function") {
        logoEl.style.animation = "none"
        logoEl.animate(
          [
            {
              opacity: 1,
              transform: "translateY(0px) scale(1)",
              filter: "blur(0px)",
              offset: 0,
            },
            {
              opacity: 1,
              transform: "translateY(-2px) scale(1.03)",
              filter: "blur(0px)",
              offset: 0.28,
            },
            {
              opacity: 0,
              transform: "translateY(-10px) scale(0.96)",
              filter: "blur(3px)",
              offset: 1,
            },
          ],
          {
            duration: 380,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards",
          },
        )
      }

      if (typeof splashEl.animate === "function") {
        const backdropAnim = splashEl.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          {
            duration: 400,
            delay: 70,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards",
          },
        )

        const fallbackRemove = window.setTimeout(() => {
          splashEl.remove()
        }, 520)

        backdropAnim.finished
          .catch(() => undefined)
          .finally(() => {
            window.clearTimeout(fallbackRemove)
            splashEl.remove()
          })
      } else {
        splashEl.remove()
      }
    }

    const timer = window.setTimeout(startExit, 80)
    return () => window.clearTimeout(timer)
  }, [])

  return null
}
