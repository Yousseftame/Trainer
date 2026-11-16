import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { FaqAccordionItem } from "@/components/public/FaqAccordion"
import {
  DEFAULT_FAQ_ITEMS,
  pickFeaturedFaqItems,
  useFaqItemsQuery,
} from "@/features/website"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"

export function FaqSection() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { data: cmsItems } = useFaqItemsQuery({ audience: "public" })

  const items = useMemo(() => {
    if (cmsItems && cmsItems.length > 0) {
      return pickFeaturedFaqItems(cmsItems).map((item) => ({
        id: item.id,
        question: resolveBilingualText(item.question, locale),
        answer: resolveBilingualText(item.answer, locale),
      }))
    }
    return DEFAULT_FAQ_ITEMS.filter((item) => item.featured).map((item) => ({
      id: item.id,
      question: resolveBilingualText(item.question, locale),
      answer: resolveBilingualText(item.answer, locale),
    }))
  }, [cmsItems, locale])

  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)

  // Keep openId valid when CMS list changes.
  const activeOpenId =
    openId && items.some((item) => item.id === openId)
      ? openId
      : (items[0]?.id ?? null)

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
          {items.map((item) => (
            <FaqAccordionItem
              key={item.id}
              question={item.question}
              answer={item.answer}
              open={activeOpenId === item.id}
              onToggle={() =>
                setOpenId((prev) => (prev === item.id ? null : item.id))
              }
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:mt-10">
          <Link
            to={APP_ROUTES.public.faq}
            className="font-heading text-[15px] font-semibold text-[var(--gym-ink)] underline decoration-[var(--gym-ink)]/35 underline-offset-[5px] transition-colors hover:text-[var(--gym-lime)] hover:decoration-[var(--gym-lime)] sm:text-[16px]"
          >
            {t("faq.seeAll")}
          </Link>
        </div>
      </div>
    </section>
  )
}
