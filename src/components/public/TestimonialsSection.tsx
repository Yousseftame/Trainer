import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"
import feedbackPattern from "@/assets/feedback.avif"
import starsSrc from "@/assets/feedback-stars.svg"
import avatar01 from "@/assets/testimonials/01.avif"
import avatar02 from "@/assets/testimonials/02.avif"
import avatar03 from "@/assets/testimonials/03.avif"
import avatar04 from "@/assets/testimonials/04.avif"
import avatar05 from "@/assets/testimonials/05.avif"
import avatar06 from "@/assets/testimonials/06.avif"

const CLIENTS = [
  { id: "sarah", image: avatar01, size: "one" },
  { id: "emily", image: avatar02, size: "two" },
  { id: "samantha", image: avatar03, size: "three" },
  { id: "john", image: avatar06, size: "four" },
  { id: "lisa", image: avatar05, size: "five" },
  { id: "jessica", image: avatar04, size: "six" },
] as const

type ClientId = (typeof CLIENTS)[number]["id"]

/** Matches GymTrainer `.testimonial-image.{one…six}` sizes */
const AVATAR_SIZE: Record<(typeof CLIENTS)[number]["size"], string> = {
  one: "size-[70px] md:size-[100px] lg:size-[130px]",
  two: "size-[70px] md:size-[100px] lg:size-[70px]",
  three: "size-[70px] md:size-[100px] lg:size-[150px]",
  four: "size-[70px] md:size-[100px] lg:size-[100px]",
  five: "size-[70px] md:size-[100px] lg:size-[120px]",
  six: "size-[70px] md:size-[100px] lg:size-[90px]",
}

/** Organic offsets from GymTrainer `.tab-link` margins */
const AVATAR_OFFSET: Record<(typeof CLIENTS)[number]["size"], string> = {
  one: "",
  two: "",
  three: "",
  four: "lg:-ms-[100px]",
  five: "lg:-mb-20 lg:-ms-[30px]",
  six: "",
}

export function TestimonialsSection() {
  const { t } = useTranslation()
  const [active, setActive] = useState<ClientId>("sarah")

  const quote = {
    title: t(`testimonials.items.${active}.title`),
    body: t(`testimonials.items.${active}.body`),
    author: t(`testimonials.items.${active}.author`),
  }

  return (
    <section
      id="testimonials"
      className="w-full scroll-mt-24 bg-white px-6 pb-14 pt-10 md:px-10 md:pb-16 md:pt-12 lg:px-14 lg:pb-[72px] lg:pt-12 xl:pb-[96px] xl:pt-14"
    >
      <div className="mx-auto w-full max-w-[1300px]">
        {/* Title sits above; desktop tabs pull up under it (GymTrainer -140/-180) */}
        <div className="relative z-10 mb-8 md:mb-10 lg:mb-11">
          <h2 className="font-heading text-[36px] font-bold leading-[1.3] text-[var(--gym-ink)] sm:text-[42px] md:text-[46px] lg:text-[52px]">
            {t("testimonials.title")}
          </h2>
        </div>

        <div
          className={cn(
            "grid grid-cols-1 items-start gap-10",
            "md:grid-cols-[1.2fr_0.75fr] md:gap-8",
            "lg:mt-[-140px] lg:grid-cols-2 lg:items-end lg:gap-[30px]",
            "xl:mt-[-180px] xl:gap-[120px]"
          )}
        >
          {/* Left — stars + quote animate as one block; height locked so nothing jumps */}
          <div className="relative z-10 flex min-h-[280px] flex-col items-start lg:min-h-[320px] lg:pt-[140px] xl:min-h-[340px] xl:pt-[180px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex w-full flex-col items-start"
              >
                <img
                  src={starsSrc}
                  alt=""
                  aria-hidden
                  className="h-[19px] w-[140px] shrink-0"
                  width={140}
                  height={19}
                  draggable={false}
                />

                <p className="mt-2.5 font-heading text-[16px] font-bold text-[var(--gym-ink)] lg:mt-[25px] lg:text-[18px]">
                  {quote.title}
                </p>

                <p className="mt-2.5 max-w-[36em] font-heading text-[18px] font-medium leading-[1.4] text-[#1e2222] lg:mt-5 lg:text-[22px]">
                  {quote.body}
                </p>

                <p className="mt-5 text-[16px] text-[var(--gym-muted)] lg:text-[18px]">
                  {quote.author}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right — pattern + avatar cloud */}
          <div
            role="tablist"
            aria-label={t("testimonials.avatarsLabel")}
            className={cn(
              "relative flex flex-wrap content-end items-end justify-start gap-2.5 bg-cover bg-center bg-no-repeat py-6",
              "md:gap-5 md:justify-start md:py-8",
              "lg:justify-center lg:gap-[50px] lg:py-[100px]",
              "xl:gap-[70px]",
              "2xl:gap-[100px]"
            )}
            style={{
              backgroundImage: `url(${feedbackPattern})`,
            }}
          >
            {CLIENTS.map((client) => {
              const isActive = client.id === active
              return (
                <button
                  key={client.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={t(`testimonials.items.${client.id}.author`)}
                  onClick={() => setActive(client.id)}
                  className={cn(
                    "group relative shrink-0 overflow-hidden rounded-full border-4 bg-transparent p-0 transition-[filter,border-color,transform] duration-300 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime)] focus-visible:ring-offset-2",
                    AVATAR_OFFSET[client.size],
                    isActive
                      ? "z-[2] border-[var(--gym-lime)]"
                      : "border-white grayscale hover:scale-105 hover:grayscale-[0.35]",
                    // Mobile/tablet: thinner border like GymTrainer ≤479
                    "max-sm:border-2"
                  )}
                >
                  <img
                    src={client.image}
                    alt=""
                    className={cn(
                      "block object-cover",
                      AVATAR_SIZE[client.size]
                    )}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
