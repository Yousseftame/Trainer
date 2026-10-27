import { Outlet } from "react-router-dom"
import { AnnouncementBar } from "@/components/public/AnnouncementBar"
import { PublicFooter } from "@/components/public/PublicFooter"
import { PublicNavbar } from "@/components/public/PublicNavbar"

export function PublicLayout() {
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
