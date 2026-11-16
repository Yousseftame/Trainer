import { useTranslation } from "react-i18next"
import { Globe2 } from "lucide-react"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

type WebsiteSectionStubPageProps = {
  /** i18n key for the page title (also used as document title) */
  titleKey: string
  /** Optional short context line under the title */
  descriptionKey?: string
}

/**
 * Temporary placeholder for public-website content editors.
 * Real section UIs will replace these one by one.
 */
export function WebsiteSectionStubPage({
  titleKey,
  descriptionKey = "admin.website.stubDescription",
}: WebsiteSectionStubPageProps) {
  const { t } = useTranslation()
  const { isRtl } = useLocale()
  const title = t(titleKey)
  useDocumentTitle(title)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-[22px] border border-black/[0.06] bg-white px-6 py-10 sm:rounded-[28px] sm:px-8 sm:py-12">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-white">
          <Globe2 className="size-5" strokeWidth={1.8} aria-hidden />
        </div>
        <p
          className={cn(
            "mt-5 text-[11px] font-bold uppercase text-[var(--gym-lime,#fb5001)] sm:text-[12px]",
            isRtl ? "tracking-normal" : "tracking-[0.16em]",
          )}
        >
          {t("admin.website.stubBadge")}
        </p>
        <h1 className="mt-2 font-heading text-[24px] font-extrabold tracking-tight text-[var(--gym-ink,#111111)] sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#6B7280] sm:text-[15px]">
          {t(descriptionKey)}
        </p>
      </div>
    </div>
  )
}
