import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import bannerTest from "@/assets/banner-test.svg"
import feature1 from "@/assets/1.png"
import feature2 from "@/assets/2.png"
import feature3 from "@/assets/3.png"
import feature4 from "@/assets/4.png"

const TABS = [
  { id: "logging", image: feature1 },
  { id: "videos", image: feature2 },
  { id: "messaging", image: feature3 },
  { id: "metrics", image: feature4 },
] as const

type TabId = (typeof TABS)[number]["id"]

const softEase = [0.16, 1, 0.3, 1] as const

const textTransition = {
  duration: 0.48,
  ease: softEase,
}

const imageTransition = {
  duration: 0.55,
  ease: softEase,
}

export function GoalsBannerSection() {
  const { t } = useTranslation()
  const { isRtl } = useLocale()
  const [active, setActive] = useState<TabId>("logging")
  const current = TABS.find((tab) => tab.id === active) ?? TABS[0]

  useEffect(() => {
    for (const tab of TABS) {
      const img = new Image()
      img.src = tab.image
    }
  }, [])

  return (
    <section className="relative w-full overflow-hidden px-6 py-14 md:px-10 md:py-20 lg:px-14 lg:py-24">
      <img
        src={bannerTest}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full object-cover object-center select-none"
        draggable={false}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,20,20,0.45)_0%,rgba(6,30,30,0.58)_100%)]"
      />

      <div className="relative z-[1] mx-auto w-full max-w-[1300px]">
        <h2 className="mx-auto max-w-[22ch] text-center font-heading text-[32px] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[38px] md:max-w-[28ch] md:text-[44px] lg:text-[48px]">
          {t("goalsBanner.title")}
        </h2>

        {/* Tabs — 2×2 on mobile so all are visible; wrap/center on larger screens */}
        <div
          role="tablist"
          aria-label={t("goalsBanner.tabsLabel")}
          className="mx-auto mt-8 grid w-full max-w-md grid-cols-2 gap-2 sm:mt-10 sm:flex sm:max-w-none sm:flex-wrap sm:items-center sm:justify-center sm:gap-3"
        >
          {TABS.map((tab) => {
            const selected = tab.id === active
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`goals-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls="goals-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.id)}
                className={cn(
                  "relative w-full rounded-full px-2.5 py-2.5 text-center font-heading text-[12px] font-semibold leading-tight transition-colors duration-300",
                  "sm:w-auto sm:shrink-0 sm:px-5 sm:py-3 sm:text-[15px] sm:leading-normal md:text-[16px]",
                  selected
                    ? "text-[var(--gym-lime)]"
                    : "text-white/70 hover:text-white"
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId="goals-tab-pill"
                    className="absolute inset-0 rounded-full border border-[var(--gym-lime)]/80 bg-white/[0.06] shadow-[0_0_0_1px_rgba(184,254,34,0.12)]"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                ) : null}
                <span className="relative z-10">{t(`goalsBanner.tabs.${tab.id}`)}</span>
              </button>
            )
          })}
        </div>

        {/* Stable shell — layout never remounts */}
        <div
          id="goals-panel"
          role="tabpanel"
          aria-labelledby={`goals-tab-${current.id}`}
          className="mt-8 grid grid-cols-1 items-start gap-8 sm:mt-10 md:mt-12 lg:grid-cols-2 lg:gap-10 xl:gap-14"
        >
          <div className="order-2 flex flex-col gap-6 sm:gap-7 lg:order-1 lg:gap-8 lg:pe-2 xl:pe-6">
            <div className="relative min-h-[11rem] sm:min-h-[12rem] md:min-h-[13rem]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={textTransition}
                  className="absolute inset-x-0 top-0 flex flex-col gap-6 sm:gap-7 lg:gap-8"
                >
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...textTransition, delay: 0.04 }}
                    className="w-full font-heading text-[30px] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[34px] md:text-[38px] lg:text-[42px]"
                  >
                    {t(`goalsBanner.items.${current.id}.title`)}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...textTransition, delay: 0.1 }}
                    className="w-full max-w-[36em] text-[16px] leading-relaxed text-white/72 sm:text-[17px] md:text-[18px] lg:text-[19px]"
                  >
                    {t(`goalsBanner.items.${current.id}.desc`)}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </div>

            <Link
              to={APP_ROUTES.public.register}
              className="group mt-1 inline-flex h-[48px] w-fit items-center gap-3 rounded-full bg-[var(--gym-lime)] pe-1.5 ps-6 text-[#111111] sm:mt-2 sm:h-[52px] sm:gap-3.5 sm:pe-2 sm:ps-7"
            >
              <span className="font-heading text-[13px] font-extrabold uppercase tracking-[0.04em] sm:text-[14px]">
                {t("goalsBanner.cta")}
              </span>
              <span className="inline-flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#111111] text-white sm:size-[40px]">
                <ArrowRight
                  className={cn(
                    "size-[17px] transition-transform duration-300 ease-out sm:size-[18px]",
                    isRtl
                      ? "-rotate-[135deg] group-hover:-rotate-180"
                      : "-rotate-45 group-hover:rotate-0"
                  )}
                  strokeWidth={2}
                />
              </span>
            </Link>
          </div>

          <div className="relative order-1 lg:order-2">
            {/* Size lock so the frame never jumps */}
            <img
              src={TABS[0].image}
              alt=""
              aria-hidden
              className="block h-auto w-full opacity-0"
              draggable={false}
            />

            {TABS.map((tab) => {
              const isActive = tab.id === active
              return (
                <motion.img
                  key={tab.id}
                  src={tab.image}
                  alt={t(`goalsBanner.items.${tab.id}.imageAlt`)}
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? 1 : 1.04,
                  }}
                  transition={imageTransition}
                  className={cn(
                    "absolute inset-0 size-full origin-center object-contain object-center will-change-transform",
                    isActive ? "z-[1]" : "z-0 pointer-events-none"
                  )}
                  loading="eager"
                  decoding="async"
                  draggable={false}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
