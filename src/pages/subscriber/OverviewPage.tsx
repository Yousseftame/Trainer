import { Link } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  HeartPulse,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react"
import { SubscriberPackageBanner } from "@/components/subscriber/SubscriberPackageBanner"
import { SubscriberBannerCarousel } from "@/components/subscriber/SubscriberBannerCarousel"
import { SubscriberProgressHeroBanner } from "@/components/subscriber/SubscriberProgressHeroBanner"
import { SubscriberFilesSection } from "@/components/subscriber/SubscriberFilesSection"
import { SubscriberAssignedPrograms } from "@/components/subscriber/SubscriberAssignedPrograms"
import { SubscriberActivityProgressChart } from "@/components/subscriber/SubscriberActivityProgressChart"
import { APP_ROUTES } from "@/config/constants"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

export function OverviewPage() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"

  useDocumentTitle(isAr ? "الرئيسية • لوحة المشترك" : "Overview • DerpyFit")

  const Chevron = isRtl ? ChevronLeft : ChevronRight

  const quickActions = [
    {
      id: "workout",
      title: isAr ? "برنامج التمارين" : "Workout Plan",
      to: APP_ROUTES.subscriber.workout,
      icon: Dumbbell,
    },
    {
      id: "nutrition",
      title: isAr ? "الخطة الغذائية" : "Nutrition Plan",
      to: APP_ROUTES.subscriber.nutrition,
      icon: UtensilsCrossed,
    },
    {
      id: "community",
      title: isAr ? "مجتمع المشتركين" : "Community Hub",
      to: APP_ROUTES.subscriber.community,
      icon: Users,
    },
    {
      id: "progress",
      title: isAr ? "سجل القياسات" : "Body Metrics",
      to: APP_ROUTES.subscriber.progress,
      icon: TrendingUp,
    },
    {
      id: "physicalTherapy",
      title: isAr ? "العلاج الطبيعي" : "Physical Therapy",
      to: APP_ROUTES.subscriber.physicalTherapy,
      icon: HeartPulse,
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Flagship Subscriber Package Banner */}
      <SubscriberPackageBanner />

      {/* Featured Banners Gallery (Swipable, Drag, Auto-swap with Meta/App Transitions) */}
      <SubscriberBannerCarousel />

      {/* Hero Track Your Progress Banner (Matching Hero Section Design) */}
      <SubscriberProgressHeroBanner />

      {/* Resource Files & Guides Section (Links to Library) */}
      <SubscriberFilesSection />

      {/* Current Assigned Workout & Nutrition Programs */}
      <SubscriberAssignedPrograms />

      {/* Recent Progress & Activity Visual Chart Analytics */}
      <SubscriberActivityProgressChart />

      {/* Quick Links Row: Sleek, Horizontal, One-Click Access */}
      <div className="space-y-3 select-none">
        <div className="px-1">
          <h2
            className={cn(
              "text-[18px] sm:text-[20px] font-extrabold text-[var(--gym-ink,#111111)] tracking-tight",
              isAr ? "font-arabic" : "font-heading",
            )}
          >
            {isAr ? "روابط سريعة" : "Quick Links"}
          </h2>
          <p className="text-[12px] sm:text-[13px] font-medium text-[#8c8c8c]">
            {isAr
              ? "انتقال فوري للأقسام والمهام الأساسية"
              : "Instant access to key sections and daily tasks"}
          </p>
        </div>

        {/* 1 Col on Mobile (prevents truncation), 2 Cols on Tablet, 4 Cols on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {quickActions.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                to={item.to}
                className="group relative flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 sm:px-4.5 sm:py-3.5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[var(--gym-lime,#fb5001)]/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-9.5 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-[var(--gym-ink,#111111)] group-hover:bg-[var(--gym-lime,#fb5001)] group-hover:text-white transition-colors duration-200">
                    <Icon className="size-4.5" strokeWidth={2.2} />
                  </span>
                  <span
                    className={cn(
                      "text-[13.5px] sm:text-[14px] font-extrabold text-[var(--gym-ink,#111111)] group-hover:text-[var(--gym-lime,#fb5001)] transition-colors whitespace-nowrap",
                      isAr ? "font-arabic" : "font-heading",
                    )}
                  >
                    {item.title}
                  </span>
                </div>

                <Chevron className="size-4 shrink-0 text-[#999] group-hover:text-[var(--gym-lime,#fb5001)] transition-transform group-hover:translate-x-[-2px] rtl:group-hover:translate-x-[2px]" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
