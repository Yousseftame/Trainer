import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "motion/react"
import { Check } from "lucide-react"
import {
  ABOUT_WHO_I_HELP_POINT_IDS,
  DEFAULT_ABOUT_CERTIFICATIONS_COPY,
  useAboutCertificationsContentQuery,
  useAboutWhoIHelpContentQuery,
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

export function AboutWhoIHelpCertsSection() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { data: whoIHelp } = useAboutWhoIHelpContentQuery({
    audience: "public",
  })
  const { data: certifications } = useAboutCertificationsContentQuery({
    audience: "public",
  })

  const whoTitle = whoIHelp
    ? resolveBilingualText(
        whoIHelp.title,
        locale,
        t("aboutPage.focus.title"),
      )
    : t("aboutPage.focus.title")

  const whoPoints = useMemo(() => {
    return ABOUT_WHO_I_HELP_POINT_IDS.map((id) => {
      const cms = whoIHelp?.points.find((point) => point.id === id)
      if (cms && whoIHelp) {
        return {
          id,
          text: resolveBilingualText(
            cms.text,
            locale,
            t(`aboutPage.focus.items.${id}`),
          ),
        }
      }
      return {
        id,
        text: t(`aboutPage.focus.items.${id}`),
      }
    })
  }, [locale, t, whoIHelp])

  const certsTitle = certifications
    ? resolveBilingualText(
        certifications.title,
        locale,
        t("aboutPage.certs.title"),
      )
    : t("aboutPage.certs.title")

  const certPoints = useMemo(() => {
    if (certifications?.points?.length) {
      return certifications.points.map((point) => ({
        id: point.id,
        text: resolveBilingualText(point.text, locale),
      }))
    }
    return DEFAULT_ABOUT_CERTIFICATIONS_COPY.points.map((point) => ({
      id: point.id,
      text: resolveBilingualText(
        point.text,
        locale,
        t(`whoIAm.certs.${point.id}`),
      ),
    }))
  }, [certifications, locale, t])

  return (
    <section className="w-full px-6 py-20 md:px-10 md:py-28 lg:px-14">
      <div className="mx-auto grid w-full max-w-[1300px] gap-16 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <p
              className={cn(
                "font-heading text-[14px] font-extrabold uppercase text-[var(--gym-lime)] sm:text-[15px]",
                isRtl ? "tracking-normal" : "tracking-[0.12em]",
              )}
            >
              {t("aboutPage.focus.eyebrow")}
            </p>
            <h2 className="mt-4 font-heading text-[34px] font-bold leading-[1.12] text-[var(--gym-ink)] sm:text-[42px]">
              {whoTitle}
            </h2>
          </motion.div>

          <ul className="mt-9 space-y-3">
            {whoPoints.map((point, index) => (
              <motion.li key={point.id} variants={fadeUp}>
                <div className="group flex items-center gap-4 rounded-[18px] border border-[var(--gym-ink)]/8 bg-[#fafafa] px-4 py-4 transition-all duration-300 hover:border-[var(--gym-lime)]/35 hover:bg-white hover:shadow-[0_16px_40px_rgba(17,17,17,0.06)] sm:gap-5 sm:px-5 sm:py-5">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--gym-dark)] font-heading text-[13px] font-extrabold text-[var(--gym-lime)] transition-transform duration-300 group-hover:scale-105 sm:size-12 sm:text-[14px]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] font-semibold text-[var(--gym-ink)] sm:text-[17px]">
                    {point.text}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="relative overflow-hidden rounded-[24px] bg-[var(--gym-dark)] px-6 py-8 sm:rounded-[28px] sm:px-8 sm:py-10"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={stagger}
        >
          <img
            src={heroPattern}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full object-cover opacity-20 select-none rtl:-scale-x-100"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -end-16 -top-16 size-48 rounded-full bg-[var(--gym-lime)]/15 blur-[60px]"
          />

          <motion.div className="relative z-[1]" variants={fadeUp}>
            <p
              className={cn(
                "font-heading text-[14px] font-extrabold uppercase text-[var(--gym-lime)] sm:text-[15px]",
                isRtl ? "tracking-normal" : "tracking-[0.12em]",
              )}
            >
              {t("whoIAm.certsTitle")}
            </p>
            <h2 className="mt-3 font-heading text-[28px] font-bold leading-[1.15] text-white sm:text-[34px]">
              {certsTitle}
            </h2>
          </motion.div>

          <ul className="relative z-[1] mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {certPoints.map((point) => (
              <motion.li
                key={point.id}
                variants={fadeUp}
                className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.05] px-4 py-4 transition-colors duration-300 hover:border-[var(--gym-lime)]/40 hover:bg-white/[0.08]"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--gym-lime)] text-white">
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-[14px] font-semibold leading-snug text-white sm:text-[15px]">
                  {point.text}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
