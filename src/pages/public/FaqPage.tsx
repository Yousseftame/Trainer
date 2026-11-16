import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaqAccordionItem } from "@/components/public/FaqAccordion"
import {
  DEFAULT_FAQ_ITEMS,
  isFaqItemComplete,
  useFaqItemsQuery,
} from "@/features/website"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"

export function FaqPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  useDocumentTitle(t("pages.faq"))

  const { data: cmsItems } = useFaqItemsQuery({ audience: "public" })

  const items = useMemo(() => {
    const source =
      cmsItems && cmsItems.length > 0
        ? cmsItems.filter(isFaqItemComplete)
        : DEFAULT_FAQ_ITEMS
    return [...source]
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
      .map((item) => ({
        id: item.id,
        question: resolveBilingualText(item.question, locale),
        answer: resolveBilingualText(item.answer, locale),
      }))
  }, [cmsItems, locale])

  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)
  const activeOpenId =
    openId && items.some((item) => item.id === openId)
      ? openId
      : (items[0]?.id ?? null)

  // Two independent columns so opening one card never stretches its neighbor.
  const leftColumn = useMemo(
    () => items.filter((_, index) => index % 2 === 0),
    [items],
  )
  const rightColumn = useMemo(
    () => items.filter((_, index) => index % 2 === 1),
    [items],
  )

  function renderColumn(
    columnItems: Array<{ id: string; question: string; answer: string }>,
  ) {
    return (
      <div className="flex flex-col gap-5 sm:gap-[24px] md:gap-[30px]">
        {columnItems.map((item) => (
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
    )
  }

  return (
    <section className="w-full bg-white px-6 pb-16 pt-10 sm:pb-20 sm:pt-12 md:px-10 md:pb-24 md:pt-14 lg:px-14 lg:pb-28 lg:pt-16">
      <div className="mx-auto w-full max-w-[1100px]">
        <h1 className="text-center font-heading text-[32px] font-semibold leading-[1.2] text-[var(--gym-ink)] sm:text-[40px] md:text-[46px]">
          {t("faq.title")}
        </h1>
        <p className="mx-auto mt-3 max-w-[36rem] text-center text-[15px] leading-relaxed text-[var(--gym-muted)] sm:text-[16px]">
          {t("faq.pageSubtitle")}
        </p>

        {/* Mobile: single stack keeps original order */}
        <div className="mt-8 flex flex-col gap-5 sm:mt-10 sm:gap-[24px] md:hidden">
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

        <div className="mt-12 hidden grid-cols-2 items-start gap-x-6 md:grid">
          {renderColumn(leftColumn)}
          {renderColumn(rightColumn)}
        </div>
      </div>
    </section>
  )
}
