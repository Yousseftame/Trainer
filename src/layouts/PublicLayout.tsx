import { Outlet } from "react-router-dom"
import { AnnouncementBar } from "@/components/public/AnnouncementBar"
import { PublicNavbar } from "@/components/public/PublicNavbar"

export function PublicLayout() {
  return (
    <div className="public-site flex min-h-dvh flex-col bg-white text-[var(--gym-ink)]">
      <AnnouncementBar />
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
