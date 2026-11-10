import { useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Globe,
  HeartPulse,
  History,
  Home,
  LogOut,
  NotebookPen,
  TrendingUp,
  User,
  X,
} from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { pickCurrentSubscription } from "@/features/subscriptions/entitlements"
import {
  usePackageByIdQuery,
  useSubscriberSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { useLocale } from "@/hooks/useLocale"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

type SubscriberMobileMenuDrawerProps = {
  open: boolean
  onClose: () => void
  onRequestSignOut: () => void
}

export function SubscriberMobileMenuDrawer({
  open,
  onClose,
  onRequestSignOut,
}: SubscriberMobileMenuDrawerProps) {
  const { t } = useTranslation()
  const { locale, isRtl, setLocale } = useLocale()
  const isAr = locale === "ar"
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: subscriptions = [] } = useSubscriberSubscriptionsQuery(user?.uid)
  const sub = useMemo(
    () => pickCurrentSubscription(subscriptions),
    [subscriptions],
  )
  const { data: pkg } = usePackageByIdQuery(sub?.packageId)

  // Close only on genuine route change
  const lastPathRef = useRef(location.pathname)
  useEffect(() => {
    if (lastPathRef.current !== location.pathname) {
      lastPathRef.current = location.pathname
      onClose()
    }
  }, [location.pathname, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose])

  if (!open || typeof document === "undefined") return null

  const menuSections = [
    {
      title: isAr ? "الصحة والتقدم" : "Health & Progress",
      items: [
        {
          label: isAr ? "العلاج الطبيعي والتأهيل" : "Physical Therapy & Rehab",
          desc: isAr ? "تمارين الاستشفاء والتعافي من الإصابات" : "Injury rehab & recovery exercises",
          to: APP_ROUTES.subscriber.physicalTherapy,
          icon: HeartPulse,
        },
        {
          label: isAr ? "تتبع التقدم والقياسات" : "Progress & Body Metrics",
          desc: isAr ? "سجل الوزن، القياسات، وصور التحول" : "Weight, body measurements & photos",
          to: APP_ROUTES.subscriber.progress,
          icon: TrendingUp,
        },
      ],
    },
    {
      title: isAr ? "سجلات اليوميات" : "Daily Logs",
      items: [
        {
          label: isAr ? "سجل التمارين اليومية" : "Workout Daily Log",
          desc: isAr ? "تسجيل أوزان وجولات التمرين" : "Log sets, reps & weights",
          to: APP_ROUTES.subscriber.workoutLog,
          icon: ClipboardList,
        },
        {
          label: isAr ? "سجل ومفكرة الوجبات" : "Nutrition Daily Log",
          desc: isAr ? "متابعة السعرات والماكروز اليومية" : "Track calories & daily macros",
          to: APP_ROUTES.subscriber.nutritionLog,
          icon: NotebookPen,
        },
      ],
    },
    {
      title: isAr ? "الحساب والمحتوى" : "Account & Resources",
      items: [
        {
          label: isAr ? "باقتي واشتراكي" : "My Subscription & Plan",
          desc: isAr ? "تفاصيل الباقة، المزايا، وتاريخ التجديد" : "Plan details, benefits & renewal date",
          to: APP_ROUTES.subscriber.subscription,
          icon: CreditCard,
        },
        {
          label: isAr ? "مكتبة المحتوى والملفات" : "PDFs & Video Library",
          desc: isAr ? "أدلة التدريب وملفات التغذية" : "Training guides & nutrition PDFs",
          to: APP_ROUTES.subscriber.library,
          icon: BookOpen,
        },
        {
          label: isAr ? "الأرشيف والبرامج السابقة" : "History & Past Programs",
          desc: isAr ? "سجل الخطط والبرامج المكتملة" : "Past cycles & completed programs",
          to: APP_ROUTES.subscriber.history,
          icon: History,
        },
        {
          label: isAr ? "الملف الشخصي والحساب" : "Profile & Account Settings",
          desc: isAr ? "البيانات الشخصية، الهاتف، والأمان" : "Personal info, phone & security",
          to: APP_ROUTES.subscriber.profile,
          icon: User,
        },
      ],
    },
  ]

  const Chevron = isRtl ? ChevronLeft : ChevronRight

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        dir={isRtl ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-[86dvh] w-full flex-col overflow-hidden rounded-t-[32px] bg-white shadow-2xl transition-transform animate-in slide-in-from-bottom duration-300",
          isAr && "font-arabic",
        )}
      >
        {/* Pull bar indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1.5 w-12 rounded-full bg-black/15" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-black/6 px-5 py-3 sm:px-6">
          <div>
            <h2 className={cn("text-[17px] font-extrabold text-[var(--gym-ink,#111111)]", isAr ? "font-arabic" : "font-heading")}>
              {isAr ? "لوحة تحكم المشترك" : "Subscriber Menu"}
            </h2>
            <p className="text-[12px] font-medium text-[#8c8c8c]">
              {isAr ? "جميع الأقسام والخدمات الإضافية" : "All services and additional features"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#F4F4F4] text-[#6B7280] transition hover:bg-black/10"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-5 pb-[max(7rem,calc(6rem+env(safe-area-inset-bottom,0px)))]">
          {/* Subscriber Profile Snippet */}
          <div className="flex items-center gap-3.5 rounded-2xl bg-[var(--gym-ink,#111111)] p-4 text-white shadow-md">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-lime,#fb5001)] font-heading text-[15px] font-bold text-white shadow-inner">
              {initials(user?.displayName || "Subscriber")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={cn("truncate text-[15px] font-extrabold text-white", isAr ? "font-arabic" : "font-heading")}>
                  {user?.displayName || "Subscriber"}
                </p>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">
                  {isAr ? "نشط" : "Active"}
                </span>
              </div>
              <p className="truncate text-[12px] font-medium text-white/70">
                {user?.email}
              </p>
              {pkg ? (
                <span className="mt-1 inline-block text-[11px] font-semibold text-[var(--gym-lime,#fb5001)]">
                  {pkg.name[locale]} • {pkg.durationDays} {isAr ? "يوم" : "days"}
                </span>
              ) : null}
            </div>
          </div>

          {/* Sectioned Menu Links with Unified High-End Icons */}
          {menuSections.map((sec, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="px-1 text-[11px] font-bold uppercase tracking-wider text-[#8c8c8c]">
                {sec.title}
              </h3>
              <div className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/6 bg-[#FAFAFA]">
                {sec.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.to
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate(item.to)
                      }}
                      className={cn(
                        "group flex w-full items-center justify-between p-3.5 text-start transition-colors",
                        isActive
                          ? "bg-[var(--gym-lime,#fb5001)]/10"
                          : "hover:bg-black/[0.03] active:bg-black/[0.05]",
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Unified Luxury Icon Container */}
                        <span
                          className={cn(
                            "inline-flex size-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200",
                            isActive
                              ? "bg-[var(--gym-lime,#fb5001)] text-white shadow-sm"
                              : "bg-[var(--gym-ink,#111111)] text-white group-hover:bg-[var(--gym-lime,#fb5001)]",
                          )}
                        >
                          <Icon className="size-[18px]" strokeWidth={1.9} />
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate text-[13.5px] font-bold transition-colors",
                              isActive
                                ? "text-[var(--gym-lime,#fb5001)]"
                                : "text-[var(--gym-ink,#111111)] group-hover:text-[var(--gym-ink,#111111)]",
                            )}
                          >
                            {item.label}
                          </p>
                          <p className="truncate text-[11px] font-medium text-[#8c8c8c]">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <Chevron className="size-4 shrink-0 text-[#8c8c8c] transition-transform group-hover:translate-x-[-2px] rtl:group-hover:translate-x-[2px]" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Utilities Row: Language & Website */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setLocale(isAr ? "en" : "ar")
              }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-black/8 bg-[#F4F4F4] py-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10 active:scale-[0.98]"
            >
              <Globe className="size-4 text-[#8c8c8c]" />
              <span>{isAr ? "English" : "العربية"}</span>
            </button>

            <Link
              to={APP_ROUTES.public.home}
              className="flex items-center justify-center gap-2 rounded-2xl border border-black/8 bg-[#F4F4F4] py-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10 active:scale-[0.98]"
            >
              <Home className="size-4 text-[#8c8c8c]" />
              <span>{isAr ? "الموقع الرئيسي" : "Main Website"}</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose()
              onRequestSignOut()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFE8E4] py-3 text-[13px] font-bold text-[#C44536] transition hover:bg-[#FFD5CF] active:scale-[0.98]"
          >
            <LogOut className="size-4" />
            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
