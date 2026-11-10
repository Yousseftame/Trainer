import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Clapperboard,
  FileText,
} from "lucide-react"
import authImage from "@/assets/auth.avif"
import heroPattern from "@/assets/hero-pattern.avif"
import { BRAND_LOGO_ON_DARK } from "@/components/shared/BrandLogo"
import { APP_ROUTES } from "@/config/constants"
import { useContentAssetsQuery } from "@/features/content/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

export function SubscriberFilesSection() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { subscriberId } = usePanelSubscriber()
  const { data: assets = [], isLoading } = useContentAssetsQuery({
    audience: "subscriber",
    enabled: Boolean(subscriberId),
  })

  const stats = useMemo(() => {
    const catalog = assets.filter((a) => a.category !== "reference")
    const unlocked = catalog.filter((a) => a.accessAllowed !== false)
    const videos = unlocked.filter((a) => a.kind === "video" || a.category === "exerciseVideo")
    const docs = unlocked.filter((a) => a.kind !== "video" && a.category !== "exerciseVideo")
    return {
      unlocked: unlocked.length,
      total: catalog.length,
      videos: videos.length,
      docs: docs.length,
    }
  }, [assets])

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <section dir={isRtl ? "rtl" : "ltr"} className="space-y-3.5 select-none">
      <div className="px-1">
        <h2
          className={cn(
            "text-[20px] sm:text-[22px] font-black text-[var(--gym-ink,#111111)] tracking-tight",
            isAr ? "font-arabic" : "font-heading",
          )}
        >
          {isAr ? "ملفات" : "Files & Playbooks"}
        </h2>
        <p
          className={cn(
            "text-[12.5px] sm:text-[13.5px] font-semibold text-[#8c8c8c] mt-0.5",
            isAr ? "font-arabic" : "font-sans",
          )}
        >
          {isLoading
            ? isAr
              ? "جاري مزامنة الملفات المصرّح بها..."
              : "Syncing your authorized files..."
            : isAr
              ? `${stats.unlocked} ملف متاح من ${stats.total} · ${stats.videos} فيديو · ${stats.docs} مستند`
              : `${stats.unlocked} unlocked of ${stats.total} · ${stats.videos} videos · ${stats.docs} docs`}
        </p>
      </div>

      <Link
        to={APP_ROUTES.subscriber.library}
        aria-label={isAr ? "فتح مكتبة الملفات" : "Open resource library"}
        className="group relative block w-full overflow-hidden rounded-[22px] sm:rounded-[26px] bg-gradient-to-r from-[#1a040b] via-[#24030c] to-[#120206] shadow-[0_12px_36px_rgba(26,4,11,0.22)] border border-white/10 hover:border-white/20 hover:shadow-[0_16px_44px_rgba(26,4,11,0.32)] transition-all duration-300"
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 end-0 z-[1] h-full select-none overflow-hidden",
            "w-[65%] sm:w-[55%] lg:w-[48%]",
          )}
          style={{
            maskImage: isRtl
              ? "linear-gradient(to right, black 0%, black 25%, rgba(0,0,0,0.7) 55%, transparent 98%)"
              : "linear-gradient(to left, black 0%, black 25%, rgba(0,0,0,0.7) 55%, transparent 98%)",
            WebkitMaskImage: isRtl
              ? "linear-gradient(to right, black 0%, black 25%, rgba(0,0,0,0.7) 55%, transparent 98%)"
              : "linear-gradient(to left, black 0%, black 25%, rgba(0,0,0,0.7) 55%, transparent 98%)",
          }}
        >
          <img
            src={authImage}
            alt=""
            draggable={false}
            className="size-full object-cover object-[center_20%] opacity-60 sm:opacity-85 transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: isRtl
              ? "linear-gradient(270deg, #1a040b 0%, #1a040b 42%, rgba(26,4,11,0.88) 60%, rgba(26,4,11,0.25) 82%, rgba(26,4,11,0) 100%)"
              : "linear-gradient(90deg, #1a040b 0%, #1a040b 42%, rgba(26,4,11,0.88) 60%, rgba(26,4,11,0.25) 82%, rgba(26,4,11,0) 100%)",
          }}
        />

        <img
          src={heroPattern}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 z-[3] size-full object-cover opacity-20 mix-blend-screen select-none rtl:-scale-x-100"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute -start-10 -top-10 size-36 rounded-full bg-[var(--gym-lime,#fb5001)]/20 blur-2xl"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        <div className="relative z-10 flex min-h-[190px] sm:min-h-[210px] flex-col justify-between p-5 sm:p-7 lg:p-8 max-w-full sm:max-w-[70%] lg:max-w-[62%]">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="flex items-center rounded-full bg-black/60 px-3 py-1 backdrop-blur-md border border-white/15 shadow-sm">
              <img
                src={BRAND_LOGO_ON_DARK}
                alt="DerpyFit"
                className="h-4.5 w-auto object-contain"
              />
            </div>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-[var(--gym-lime,#fb5001)]/15 px-3 py-1 text-[11px] sm:text-[11.5px] font-bold text-[var(--gym-lime,#fb5001)] border border-[var(--gym-lime,#fb5001)]/30 backdrop-blur-sm",
                isAr ? "font-arabic" : "font-sans",
              )}
            >
              <BookMarked className="size-3.5" strokeWidth={2.2} />
              <span>
                {isAr ? "أدلة وكتيبات المشترك" : "Subscriber Playbooks"}
              </span>
            </span>

            {!isLoading ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white/85 border border-white/10">
                  <Clapperboard className="size-3" />
                  {stats.videos}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white/85 border border-white/10">
                  <FileText className="size-3" />
                  {stats.docs}
                </span>
              </>
            ) : null}
          </div>

          <div className="my-2 sm:my-3">
            <h3
              className={cn(
                "text-[20px] sm:text-[24px] lg:text-[26px] font-black text-white tracking-tight leading-snug group-hover:text-[var(--gym-lime,#fb5001)] transition-colors",
                isAr ? "font-arabic" : "font-heading",
              )}
            >
              {isAr
                ? "مكتبة ملفات التمارين والأنظمة الغذائية"
                : "Workout & Nutrition Playbooks Library"}
            </h3>

            <p
              className={cn(
                "mt-1 sm:mt-1.5 text-[12.5px] sm:text-[14px] font-medium leading-relaxed text-white/80 line-clamp-2",
                isAr ? "font-arabic" : "font-sans",
              )}
            >
              {stats.unlocked > 0
                ? isAr
                  ? "فيديوهات التكنيك وملفات PDF المرتبطة بباقتك وبرامجك المعيّنة — محمية بصلاحيات الاشتراك."
                  : "Technique videos and PDFs linked to your package and assigned programs — entitlement protected."
                : isAr
                  ? "سيظهر هنا المحتوى الذي يربطه المدرب بباقتك أو برامجك. لا يمكن فتح الملفات الخاصة عبر الروابط فقط."
                  : "Content your coach links to your package or programs appears here. Private files stay locked without entitlement."}
            </p>
          </div>

          <div className="pt-1">
            <span
              className={cn(
                "group/btn inline-flex items-center gap-2 rounded-full bg-[var(--gym-lime,#fb5001)] group-hover:bg-[#e04500] text-white px-5 py-2.5 sm:px-6 sm:py-3 text-[13px] sm:text-[14px] font-extrabold shadow-[0_8px_24px_rgba(251,80,1,0.45)] border border-white/20 transition-all duration-300 group-hover:scale-105 active:scale-95",
                isAr ? "font-arabic" : "font-heading",
              )}
            >
              <span>
                {isAr ? "تصفح المكتبة والملفات" : "Browse All Playbooks"}
              </span>
              <ArrowIcon
                className="size-4 rtl:rotate-180 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1"
                strokeWidth={2.5}
              />
            </span>
          </div>
        </div>
      </Link>
    </section>
  )
}
