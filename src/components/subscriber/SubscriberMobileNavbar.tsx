import { useLocation, useNavigate } from "react-router-dom"
import {
  Dumbbell,
  Home,
  LayoutGrid,
  Users,
  UtensilsCrossed,
} from "lucide-react"
import GlassSurface from "@/components/GlassSurface"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

type SubscriberMobileNavbarProps = {
  isMenuOpen: boolean
  onToggleMenu: () => void
}

export function SubscriberMobileNavbar({
  isMenuOpen,
  onToggleMenu,
}: SubscriberMobileNavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const pathname = location.pathname

  const isHomeActive = pathname === APP_ROUTES.subscriber.root
  const isWorkoutActive =
    pathname === APP_ROUTES.subscriber.workout ||
    pathname === APP_ROUTES.subscriber.workoutLog
  const isCommunityActive = pathname === APP_ROUTES.subscriber.community
  const isNutritionActive =
    pathname === APP_ROUTES.subscriber.nutrition ||
    pathname === APP_ROUTES.subscriber.nutritionLog

  // Any other secondary subscriber page (profile, subscription, progress, physical therapy, etc.)
  const isOtherActive =
    !isHomeActive &&
    !isWorkoutActive &&
    !isCommunityActive &&
    !isNutritionActive

  const navItems = [
    {
      id: "home",
      label: isAr ? "الرئيسية" : "Home",
      icon: Home,
      isActive: isHomeActive && !isMenuOpen,
      onClick: () => {
        if (isMenuOpen) onToggleMenu()
        navigate(APP_ROUTES.subscriber.root)
      },
    },
    {
      id: "workout",
      label: isAr ? "التمارين" : "Workout",
      icon: Dumbbell,
      isActive: isWorkoutActive && !isMenuOpen,
      onClick: () => {
        if (isMenuOpen) onToggleMenu()
        navigate(APP_ROUTES.subscriber.workout)
      },
    },
    {
      id: "community",
      label: isAr ? "المجتمع" : "Community",
      icon: Users,
      isActive: isCommunityActive && !isMenuOpen,
      onClick: () => {
        if (isMenuOpen) onToggleMenu()
        navigate(APP_ROUTES.subscriber.community)
      },
    },
    {
      id: "nutrition",
      label: isAr ? "التغذية" : "Nutrition",
      icon: UtensilsCrossed,
      isActive: isNutritionActive && !isMenuOpen,
      onClick: () => {
        if (isMenuOpen) onToggleMenu()
        navigate(APP_ROUTES.subscriber.nutrition)
      },
    },
    {
      id: "menu",
      label: isAr ? "المزيد" : "Menu",
      icon: LayoutGrid,
      isActive: isMenuOpen || isOtherActive,
      onClick: onToggleMenu,
    },
  ]

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-4 inset-x-0 mx-auto z-40 flex items-center justify-center px-3.5 pointer-events-none lg:hidden"
    >
      <div className="w-full max-w-[390px] pointer-events-auto filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
        <GlassSurface
          width="100%"
          height={70}
          borderRadius={9999}
          brightness={0}
          opacity={0.96}
          blur={24}
          displace={0}
          backgroundOpacity={0}
          distortionScale={0}
          refraction={false}
          className="glass-surface--dark relative w-full rounded-full transition-all"
        >
          <div className="flex w-full items-center justify-between px-2 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  aria-label={item.label}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 select-none group active:scale-95",
                  )}
                >
                  {/* Icon with glowing active pill */}
                  <span
                    className={cn(
                      "relative flex size-10 items-center justify-center rounded-full transition-all duration-300",
                      item.isActive
                        ? "bg-[var(--gym-lime,#fb5001)] text-white shadow-[0_0_22px_rgba(251,80,1,0.7),inset_0_1px_1px_rgba(255,255,255,0.45)] scale-105"
                        : "text-zinc-200 group-hover:text-white group-hover:bg-white/10",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5 transition-transform duration-200",
                        item.isActive ? "scale-110" : "scale-100",
                      )}
                      strokeWidth={item.isActive ? 2.3 : 1.9}
                    />
                  </span>

                  {/* High contrast label */}
                  <span
                    className={cn(
                      "mt-0.5 text-[10px] font-bold tracking-tight transition-colors duration-200",
                      item.isActive
                        ? "text-[var(--gym-lime,#fb5001)] font-extrabold"
                        : "text-zinc-300 group-hover:text-white",
                    )}
                  >
                    {item.label}
                  </span>

                  {/* Active indicator dot */}
                  {item.isActive ? (
                    <span className="absolute -bottom-1 size-1 rounded-full bg-[var(--gym-lime,#fb5001)] shadow-[0_0_8px_rgba(251,80,1,0.9)] animate-pulse" />
                  ) : null}
                </button>
              )
            })}
          </div>
        </GlassSurface>
      </div>
    </nav>
  )
}
