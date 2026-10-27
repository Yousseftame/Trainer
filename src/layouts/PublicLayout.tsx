import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AnnouncementBar } from "@/components/public/AnnouncementBar"
import { PublicFooter } from "@/components/public/PublicFooter"
import { PublicNavbar } from "@/components/public/PublicNavbar"

export function PublicLayout() {
  const location = useLocation()

  useEffect(() => {
    const id = location.hash.replace(/^#/, "")
    if (!id) return

    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [location.pathname, location.hash])

  return (
    <div className="public-site flex min-h-dvh flex-col overflow-x-hidden bg-white text-[var(--gym-ink)]">
      <AnnouncementBar />
      <PublicNavbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

