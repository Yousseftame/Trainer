import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"

const STORAGE_KEY = "public-announcement-dismissed-v1"

type AnnouncementBarProps = {
  href?: string
}

export function AnnouncementBar({ href = APP_ROUTES.public.contact }: AnnouncementBarProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "1")
    } catch {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore storage failures
    }
    setVisible(false)
  }

  if (!visible) return null

  const isExternal = href.startsWith("http")

  return (
    <div
      className="relative w-full border-y border-black/10"
      style={{
        background:
          "linear-gradient(90deg, #052a2a 0%, #063434 35%, #0a4540 50%, #063434 65%, #052a2a 100%)",
      }}
    >
      <div className="mx-auto flex min-h-11 w-full max-w-[1300px] items-center justify-center px-10 py-2.5 text-center sm:px-12">
        <p className="text-[13px] leading-snug text-white/95 sm:text-[14px]">
          <span>{t("announcement.message")} </span>
          {isExternal ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--gym-lime)] underline decoration-[var(--gym-lime)]/70 underline-offset-2 transition-opacity hover:opacity-80"
            >
              {t("announcement.cta")}
            </a>
          ) : (
            <Link
              to={href}
              className="font-medium text-[var(--gym-lime)] underline decoration-[var(--gym-lime)]/70 underline-offset-2 transition-opacity hover:opacity-80"
            >
              {t("announcement.cta")}
            </Link>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="absolute end-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:end-3"
        aria-label={t("announcement.dismiss")}
      >
        <X className="size-4" strokeWidth={2.25} />
      </button>
    </div>
  )
}
