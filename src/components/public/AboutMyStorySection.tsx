import { useTranslation } from "react-i18next"
import { motion } from "motion/react"
import {
  DEFAULT_ABOUT_MY_STORY_COPY,
  isRenderableImageSrc,
  useAboutMyStoryContentQuery,
} from "@/features/website"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"
import whoIAmImage from "@/assets/whoiam.avif"

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

export function AboutMyStorySection() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { data: content } = useAboutMyStoryContentQuery({ audience: "public" })

  const hasCmsImage = Boolean(
    content?.imageUrl && isRenderableImageSrc(content.imageUrl),
  )
  const imageSrc = hasCmsImage ? content!.imageUrl : whoIAmImage
  const imageAlt = content
    ? resolveBilingualText(
        content.imageAlt,
        locale,
        DEFAULT_ABOUT_MY_STORY_COPY.imageAlt[locale],
      )
    : DEFAULT_ABOUT_MY_STORY_COPY.imageAlt[locale]

  const watermark = content
    ? resolveBilingualText(
        content.watermark,
        locale,
        t("whoIAm.yearsValue"),
      )
    : t("whoIAm.yearsValue")

  const points =
    content?.points && content.points.length > 0
      ? content.points.map((point) => ({
          id: point.id,
          text: resolveBilingualText(point.text, locale),
        }))
      : DEFAULT_ABOUT_MY_STORY_COPY.points.map((point) => ({
          id: point.id,
          text: resolveBilingualText(
            point.text,
            locale,
            t(`aboutPage.story.${point.id}`),
          ),
        }))

  return (
    <section className="relative w-full overflow-hidden px-6 py-20 md:px-10 md:py-28 lg:px-14">
      <p
        aria-hidden
        className="pointer-events-none absolute -top-6 end-0 select-none font-heading text-[clamp(8rem,28vw,22rem)] font-extrabold leading-none text-[var(--gym-ink)]/[0.04] sm:-top-10"
      >
        {watermark}
      </p>

      <div className="relative z-[1] mx-auto grid w-full max-w-[1300px] items-start gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
        <motion.div
          className="lg:col-span-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeUp}
        >
          <p
            className={cn(
              "font-heading text-[14px] font-extrabold uppercase text-[var(--gym-lime)] sm:text-[15px]",
              isRtl ? "tracking-normal" : "tracking-[0.12em]",
            )}
          >
            {t("aboutPage.story.eyebrow")}
          </p>
          <h2 className="mt-4 font-heading text-[34px] font-bold leading-[1.12] text-[var(--gym-ink)] sm:text-[44px] md:text-[52px]">
            {t("aboutPage.story.title")}
          </h2>
          <div className="mt-8 hidden overflow-hidden rounded-[22px] lg:block">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="aspect-[4/5] w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col justify-center gap-8 lg:col-span-7 lg:gap-10 lg:py-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          {points.map((point, index) => (
            <motion.div
              key={point.id}
              variants={fadeUp}
              className="relative ps-5 sm:ps-7"
            >
              <span
                aria-hidden
                className="absolute start-0 top-1.5 h-[calc(100%-0.25rem)] w-[2px] rounded-full bg-[var(--gym-lime)]/30"
              />
              <span className="mb-3 block font-heading text-[12px] font-extrabold text-[var(--gym-lime)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-[16px] leading-[1.8] text-[var(--gym-muted)] sm:text-[18px]">
                {point.text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
