import { useEffect, useId, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  CircleCheck,
  Eye,
  EyeOff,
  Link2,
  Mail,
  Phone,
  Share2,
} from "lucide-react"
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  DEFAULT_FOOTER_CONTACT,
  DEFAULT_FOOTER_SOCIALS,
  derivePhoneRaw,
  useFooterContentQuery,
  useSaveFooterContentMutation,
} from "@/features/website"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type {
  VideoBannerSocialLink,
  VideoBannerSocialNetwork,
} from "@/types/website"

const SOCIAL_META: Record<
  VideoBannerSocialNetwork,
  { label: string; Icon: typeof FaFacebookF; placeholder: string }
> = {
  facebook: {
    label: "Facebook",
    Icon: FaFacebookF,
    placeholder: "https://facebook.com/…",
  },
  linkedin: {
    label: "LinkedIn",
    Icon: FaLinkedinIn,
    placeholder: "https://linkedin.com/in/…",
  },
  youtube: {
    label: "YouTube",
    Icon: FaYoutube,
    placeholder: "https://youtube.com/@…",
  },
  instagram: {
    label: "Instagram",
    Icon: FaInstagram,
    placeholder: "https://instagram.com/…",
  },
  tiktok: {
    label: "TikTok",
    Icon: FaTiktok,
    placeholder: "https://tiktok.com/@…",
  },
}

export function CommonFooterPage() {
  const { t } = useTranslation()
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.commonFooter"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useFooterContentQuery({ audience: "admin" })
  const saveMutation = useSaveFooterContentMutation()

  const formId = useId()
  const [phone, setPhone] = useState<string>(DEFAULT_FOOTER_CONTACT.phone)
  const [phoneRaw, setPhoneRaw] = useState<string>(
    DEFAULT_FOOTER_CONTACT.phoneRaw,
  )
  const [email, setEmail] = useState<string>(DEFAULT_FOOTER_CONTACT.email)
  const [socials, setSocials] = useState<VideoBannerSocialLink[]>(
    DEFAULT_FOOTER_SOCIALS.map((s) => ({ ...s })),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPhone(content?.phone || DEFAULT_FOOTER_CONTACT.phone)
    setPhoneRaw(content?.phoneRaw || DEFAULT_FOOTER_CONTACT.phoneRaw)
    setEmail(content?.email || DEFAULT_FOOTER_CONTACT.email)
    setSocials(
      content?.socials?.length
        ? content.socials.map((s) => ({ ...s }))
        : DEFAULT_FOOTER_SOCIALS.map((s) => ({ ...s })),
    )
    setError(null)
  }, [content])

  const busy = saveMutation.isPending

  const stats = useMemo(() => {
    const visible = socials.filter((s) => s.enabled).length
    const withUrl = socials.filter((s) => s.enabled && s.url.trim()).length
    return {
      phone: Boolean(phone.trim()),
      email: Boolean(email.trim()),
      visible,
      withUrl,
    }
  }, [phone, email, socials])

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function updateSocial(
    network: VideoBannerSocialNetwork,
    patch: Partial<Pick<VideoBannerSocialLink, "enabled" | "url">>,
  ) {
    setSocials((prev) =>
      prev.map((item) =>
        item.network === network ? { ...item, ...patch } : item,
      ),
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canManage || busy) return
    setError(null)
    try {
      await saveMutation.mutateAsync({
        phone,
        phoneRaw: phoneRaw.trim() || derivePhoneRaw(phone),
        email,
        socials,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(t("admin.website.commonFooter.toasts.saved"))
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("admin.website.commonFooter.toasts.error")
      setError(message)
      appToast.error(message)
    }
  }

  const previewPhoneRaw = derivePhoneRaw(phone, phoneRaw)
  const previewSocials = socials.filter((s) => s.enabled)

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.website.commonFooter.stats.phone")}
          value={
            stats.phone
              ? t("admin.website.commonFooter.stats.set")
              : t("admin.website.commonFooter.stats.missing")
          }
          icon={<Phone className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.commonFooter.stats.email")}
          value={
            stats.email
              ? t("admin.website.commonFooter.stats.set")
              : t("admin.website.commonFooter.stats.missing")
          }
          icon={<Mail className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.commonFooter.stats.visible")}
          value={stats.visible}
          icon={<Share2 className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.commonFooter.stats.linked")}
          value={stats.withUrl}
          icon={<Link2 className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.commonFooter.loadError")}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white"
          >
            {t("admin.common.retry")}
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex min-h-40 items-center justify-center rounded-[24px] bg-white px-4 py-10 text-sm font-medium text-[#8c8c8c]">
          {t("admin.website.commonFooter.loading")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] lg:gap-5">
          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="mb-5">
              <h2 className="text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                {t("admin.website.commonFooter.editorTitle")}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {t("admin.website.commonFooter.editorHint")}
              </p>
            </div>

            <form id={formId} onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#374151]">
                    {t("admin.website.commonFooter.fields.phone")}
                  </span>
                  <input
                    dir="ltr"
                    value={phone}
                    disabled={!canManage || busy}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={DEFAULT_FOOTER_CONTACT.phone}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#374151]">
                    {t("admin.website.commonFooter.fields.phoneRaw")}
                  </span>
                  <input
                    dir="ltr"
                    value={phoneRaw}
                    disabled={!canManage || busy}
                    onChange={(e) => setPhoneRaw(e.target.value)}
                    placeholder={DEFAULT_FOOTER_CONTACT.phoneRaw}
                    className={inputClass}
                  />
                  <span className="text-[11px] font-medium text-[#8c8c8c]">
                    {t("admin.website.commonFooter.phoneRawHint")}
                  </span>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.commonFooter.fields.email")}
                </span>
                <input
                  dir="ltr"
                  type="email"
                  value={email}
                  disabled={!canManage || busy}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={DEFAULT_FOOTER_CONTACT.email}
                  className={inputClass}
                />
              </label>

              <div className="space-y-3">
                <div>
                  <p className="text-[12px] font-bold text-[#374151]">
                    {t("admin.website.commonFooter.fields.socials")}
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
                    {t("admin.website.commonFooter.socialsHint")}
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {socials.map((item) => {
                    const meta = SOCIAL_META[item.network]
                    const Icon = meta.Icon
                    return (
                      <li
                        key={item.network}
                        className="flex flex-col gap-2 rounded-[18px] border border-black/8 bg-[#F7F7F7] p-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-2.5 sm:w-[132px] sm:shrink-0">
                          <span className="inline-flex size-8 items-center justify-center rounded-[8px] bg-[var(--gym-lime,#fb5001)] text-white">
                            <Icon className="size-3.5" />
                          </span>
                          <span className="text-[13px] font-bold text-[#111111]">
                            {meta.label}
                          </span>
                        </div>
                        <input
                          dir="ltr"
                          type="url"
                          value={item.url}
                          disabled={!canManage || busy || !item.enabled}
                          onChange={(e) =>
                            updateSocial(item.network, { url: e.target.value })
                          }
                          placeholder={meta.placeholder}
                          className={cn(
                            inputClass,
                            "flex-1",
                            !item.enabled && "opacity-50",
                          )}
                        />
                        <button
                          type="button"
                          disabled={!canManage || busy}
                          onClick={() =>
                            updateSocial(item.network, {
                              enabled: !item.enabled,
                            })
                          }
                          className={cn(
                            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition",
                            item.enabled
                              ? "bg-[var(--gym-ink,#111111)] text-white"
                              : "bg-white text-[#6B7280] ring-1 ring-black/10",
                          )}
                        >
                          {item.enabled ? (
                            <Eye className="size-3.5" />
                          ) : (
                            <EyeOff className="size-3.5" />
                          )}
                          {item.enabled
                            ? t("admin.website.commonFooter.show")
                            : t("admin.website.commonFooter.hide")}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {canManage ? (
                <div className="space-y-3 border-t border-black/[0.07] pt-5">
                  {error ? (
                    <div
                      role="alert"
                      className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700"
                    >
                      {error}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
                  >
                    <Check className="size-4" strokeWidth={2.4} />
                    {busy
                      ? t("admin.website.commonFooter.saving")
                      : t("admin.website.commonFooter.save")}
                  </button>
                </div>
              ) : null}
            </form>
          </section>

          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="mb-4">
              <h2 className="text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                {t("admin.website.commonFooter.preview")}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {t("admin.website.commonFooter.previewHint")}
              </p>
            </div>

            <div className="overflow-hidden rounded-[20px] bg-[var(--gym-dark,#1a0508)] p-5 text-white sm:p-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-7 items-center justify-center rounded-full bg-[var(--gym-lime,#fb5001)]/20 text-[var(--gym-lime,#fb5001)]">
                  <Phone className="size-3.5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-[12px] text-white/70">
                    {t("footer.callLabel")}
                  </p>
                  <a
                    href={`tel:${previewPhoneRaw}`}
                    className="mt-0.5 inline-block font-heading text-[15px] font-bold text-white"
                  >
                    {phone.trim() || "—"}
                  </a>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-7 items-center justify-center rounded-full bg-[var(--gym-lime,#fb5001)]/20 text-[var(--gym-lime,#fb5001)]">
                  <Mail className="size-3.5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-[12px] text-white/70">
                    {t("footer.emailLabel")}
                  </p>
                  <a
                    href={`mailto:${email.trim()}`}
                    className="mt-0.5 inline-block font-heading text-[15px] font-bold text-white"
                  >
                    {email.trim() || "—"}
                  </a>
                </div>
              </div>

              <div className="mt-6">
                {previewSocials.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {previewSocials.map((item) => {
                      const meta = SOCIAL_META[item.network]
                      const Icon = meta.Icon
                      return (
                        <span
                          key={item.network}
                          className="inline-flex size-7 items-center justify-center rounded-[7px] bg-[var(--gym-lime,#fb5001)] text-white"
                          title={meta.label}
                        >
                          <Icon className="size-3.5" />
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] font-medium text-white/50">
                    {t("admin.website.commonFooter.noSocials")}
                  </p>
                )}
                <p className="mt-4 text-[13px] text-[#dcd6d8]">
                  {t("footer.creditBefore")}{" "}
                  <span className="text-[var(--gym-lime,#fb5001)]">
                    {t("footer.creditBrand")}
                  </span>
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-[14px] bg-white/5 px-3 py-2.5 text-[12px] font-medium text-white/60">
                <CircleCheck className="size-3.5 text-[var(--gym-lime,#fb5001)]" />
                {t("admin.website.commonFooter.previewLive")}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
