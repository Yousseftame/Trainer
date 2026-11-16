import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "motion/react"
import {
  ABOUT_HOW_I_COACH_CARD_IDS,
  useAboutHowICoachContentQuery,
} from "@/features/website"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"
import heroPattern from "@/assets/hero-pattern.avif"

const ease = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease },
  },
}

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
}

export function AboutHowICoachSection() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { data: content } = useAboutHowICoachContentQuery({
    audience: "public",
  })

  const title = content
    ? resolveBilingualText(
        content.title,
        locale,
        t("aboutPage.pillars.title"),
      )
    : t("aboutPage.pillars.title")
  const subtitle = content
    ? resolveBilingualText(
        content.subtitle,
        locale,
        t("aboutPage.pillars.subtitle"),
      )
    : t("aboutPage.pillars.subtitle")

  const cards = useMemo(() => {
    return ABOUT_HOW_I_COACH_CARD_IDS.map((id) => {
      const cmsCard = content?.cards.find((card) => card.id === id)
      if (cmsCard && content) {
        return {
          id,
          title: resolveBilingualText(
            cmsCard.title,
            locale,
            t(`aboutPage.pillars.items.${id}.title`),
          ),
          body: resolveBilingualText(
            cmsCard.body,
            locale,
            t(`aboutPage.pillars.items.${id}.body`),
          ),
        }
      }
      return {
        id,
        title: t(`aboutPage.pillars.items.${id}.title`),
        body: t(`aboutPage.pillars.items.${id}.body`),
      }
    })
  }, [content, locale, t])

  return (
    <section className="relative w-full overflow-hidden bg-[var(--gym-dark)] px-6 py-20 md:px-10 md:py-28 lg:px-14">
      <img
        src={heroPattern}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.18] select-none rtl:-scale-x-100"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -start-24 top-1/2 size-[28rem] -translate-y-1/2 rounded-full bg-[var(--gym-lime)]/10 blur-[100px]"
      />

      <div className="relative z-[1] mx-auto w-full max-w-[1300px]">
        <motion.div
          className="max-w-[42rem]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
        >
          <p
            className={cn(
              "font-heading text-[14px] font-extrabold uppercase text-[var(--gym-lime)] sm:text-[15px]",
              isRtl ? "tracking-normal" : "tracking-[0.12em]",
            )}
          >
            {t("aboutPage.pillars.eyebrow")}
          </p>
          <h2 className="mt-4 font-heading text-[34px] font-bold leading-[1.12] text-white sm:text-[44px] md:text-[52px]">
            {title}
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-white/70 sm:text-[17px]">
            {subtitle}
          </p>
        </motion.div>

        <motion.ol
          className="mt-14 grid gap-5 sm:mt-16 md:grid-cols-3 md:gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          {cards.map((card, index) => (
            <motion.li
              key={card.id}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-[var(--gym-lime)]/40 hover:bg-white/[0.07] sm:p-8"
            >
              <span className="font-heading text-[56px] font-extrabold leading-none text-[var(--gym-lime)]/25 transition-colors duration-300 group-hover:text-[var(--gym-lime)]/45 sm:text-[64px]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-heading text-[22px] font-bold text-white sm:text-[24px]">
                {card.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.75] text-white/65 sm:text-[15px]">
                {card.body}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
