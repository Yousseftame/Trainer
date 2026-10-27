import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"

const FAQ_IDS = ["plan", "missed", "switch", "support", "commit"] as const

const iconSpring = { type: "spring" as const, stiffness: 320, damping: 26, mass: 0.7 }

/** Plus rotates as one piece into an X — smoother than morphing bars. */
function FaqToggleIcon({ open }: { open: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="relative inline-flex size-5 shrink-0 items-center justify-center"
      animate={{ rotate: open ? 45 : 0 }}
      transition={iconSpring}
    >
      <span className="absolute h-[2px] w-[15px] rounded-full bg-[var(--gym-ink)]" />
      <span className="absolute h-[15px] w-[2px] rounded-full bg-[var(--gym-ink)]" />
    </motion.span>
  )
}

function FaqItem({
  id,
  open,
  onToggle,
}: {
  id: (typeof FAQ_IDS)[number]
  open: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const panelId = useId()
  const buttonId = useId()

  return (
    <div className="overflow-hidden rounded-[10px] bg-[#f5f5f5]">
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-start justify-between gap-3 p-[15px] text-start outline-none transition-colors hover:bg-[#f0f0f0] focus-visible:bg-[#f0f0f0] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gym-ink)]/20 sm:gap-3 sm:p-5"
      >
        <span className="font-heading text-[17px] font-bold leading-[1.3] text-[#1e2222] sm:text-[19px]">
          {t(`faq.items.${id}.q`)}
        </span>
        <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center">
          <FaqToggleIcon open={open} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-[15px] pb-[15px] text-[15px] leading-relaxed text-[var(--gym-muted)] sm:px-5 sm:pb-5 sm:text-[16px] md:text-[17px]">
              {t(`faq.items.${id}.a`)}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function FaqSection() {
  const { t } = useTranslation()
  const [openId, setOpenId] = useState<(typeof FAQ_IDS)[number] | null>("plan")

  return (
    <section
      id="faq"
      className="w-full scroll-mt-24 bg-white px-6 pb-14 pt-10 sm:pb-16 sm:pt-12 md:px-10 md:pb-20 md:pt-14 lg:px-14 lg:pb-[72px] lg:pt-16"
    >
      <div className="mx-auto w-full max-w-[740px]">
        <h2 className="text-center font-heading text-[32px] font-semibold leading-[1.2] text-[var(--gym-ink)] sm:text-[40px] md:text-[46px]">
          {t("faq.title")}
        </h2>

        <div className="mt-8 flex flex-col gap-5 sm:mt-10 sm:gap-[30px] md:mt-12">
          {FAQ_IDS.map((id) => (
            <FaqItem
              key={id}
              id={id}
              open={openId === id}
              onToggle={() => setOpenId((prev) => (prev === id ? null : id))}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
