import { useEffect, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  Eye,
  EyeOff,
  Film,
  Pause,
  Play,
  Trash2,
  Upload,
  Video,
} from "lucide-react"
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  DEFAULT_VIDEO_BANNER_COPY,
  DEFAULT_VIDEO_BANNER_SOCIALS,
  VIDEO_BANNER_SOCIAL_ORDER,
  type SaveVideoBannerInput,
} from "@/features/website/videoBanner"
import {
  formatBytesLabel,
  isRenderableVideoSrc,
  VIDEO_BANNER_UPLOAD_LIMITS,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import {
  useClearVideoBannerVideoMutation,
  useSaveVideoBannerMutation,
  useVideoBannerContentQuery,
} from "@/features/website/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { BilingualText } from "@/types/program"
import type {
  VideoBannerSocialLink,
  VideoBannerSocialNetwork,
} from "@/types/website"

type FieldPair = { en: string; ar: string }

const EMPTY: FieldPair = { en: "", ar: "" }

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

function toPair(
  value: BilingualText | undefined,
  fallback?: BilingualText,
): FieldPair {
  return {
    en: value?.en || fallback?.en || "",
    ar: value?.ar || fallback?.ar || "",
  }
}

export function HomeVideoBannerPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.homeVideoBanner"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useVideoBannerContentQuery({ audience: "admin" })
  const saveMutation = useSaveVideoBannerMutation()
  const clearVideoMutation = useClearVideoBannerVideoMutation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const formId = useId()

  const [headline, setHeadline] = useState<FieldPair>(EMPTY)
  const [author, setAuthor] = useState<FieldPair>(EMPTY)
  const [socials, setSocials] = useState<VideoBannerSocialLink[]>(
    DEFAULT_VIDEO_BANNER_SOCIALS,
  )
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeVideo, setRemoveVideo] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [confirmClearVideo, setConfirmClearVideo] = useState(false)
  const [previewPlaying, setPreviewPlaying] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setHeadline(toPair(content?.headline, DEFAULT_VIDEO_BANNER_COPY.headline))
    setAuthor(toPair(content?.author, DEFAULT_VIDEO_BANNER_COPY.author))
    setSocials(
      content?.socials?.length
        ? content.socials
        : DEFAULT_VIDEO_BANNER_SOCIALS.map((s) => ({ ...s })),
    )
    setFile(null)
    setRemoveVideo(false)
    setError(null)
    setPreviewUrl(
      content?.videoUrl && isRenderableVideoSrc(content.videoUrl)
        ? content.videoUrl
        : null,
    )
  }, [content])

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setRemoveVideo(false)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    const video = previewVideoRef.current
    if (!video || !previewUrl || removeVideo) return
    video.muted = true
    void video
      .play()
      .then(() => setPreviewPlaying(true))
      .catch(() => setPreviewPlaying(false))
  }, [previewUrl, removeVideo])

  const busy = saveMutation.isPending || clearVideoMutation.isPending
  const hasStoredVideo = Boolean(
    content?.videoUrl &&
      isRenderableVideoSrc(content.videoUrl) &&
      !removeVideo,
  )
  const visibleSocialCount = socials.filter((s) => s.enabled).length

  const previewHeadline =
    resolveBilingualText(
      { en: headline.en, ar: headline.ar },
      locale,
      DEFAULT_VIDEO_BANNER_COPY.headline[locale],
    ) || t("admin.website.videoBanner.untitled")
  const previewAuthor = resolveBilingualText(
    { en: author.en, ar: author.ar },
    locale,
    DEFAULT_VIDEO_BANNER_COPY.author[locale],
  )

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"
  const textareaClass =
    "min-h-[96px] w-full resize-y rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function renderBilingual(params: {
    label: string
    value: FieldPair
    onChange: (next: FieldPair) => void
    multiline?: boolean
    placeholderEn?: string
    placeholderAr?: string
  }) {
    const Field = params.multiline ? "textarea" : "input"
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {params.label} ({isAr ? "عربي" : "Arabic"})
          </span>
          <Field
            dir="rtl"
            value={params.value.ar}
            disabled={!canManage || busy}
            onChange={(e) =>
              params.onChange({ ...params.value, ar: e.target.value })
            }
            placeholder={params.placeholderAr}
            className={params.multiline ? textareaClass : inputClass}
            style={{ fontFamily: "var(--font-arabic)" }}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {params.label} ({isAr ? "إنجليزي" : "English"})
          </span>
          <Field
            dir="ltr"
            value={params.value.en}
            disabled={!canManage || busy}
            onChange={(e) =>
              params.onChange({ ...params.value, en: e.target.value })
            }
            placeholder={params.placeholderEn}
            className={params.multiline ? textareaClass : inputClass}
          />
        </label>
      </div>
    )
  }

  function updateSocial(
    network: VideoBannerSocialNetwork,
    patch: Partial<VideoBannerSocialLink>,
  ) {
    setSocials((prev) =>
      prev.map((item) =>
        item.network === network ? { ...item, ...patch } : item,
      ),
    )
  }

  function showError(message: string) {
    setError(message)
    appToast.error(message)
  }

  function togglePreviewPlayback() {
    const video = previewVideoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
      setPreviewPlaying(true)
    } else {
      video.pause()
      setPreviewPlaying(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canManage || busy) return
    setError(null)

    const mirroredHeadline = mirrorBilingual(headline.en, headline.ar)
    const mirroredAuthor = mirrorBilingual(author.en, author.ar)
    if (!mirroredHeadline || !mirroredAuthor) {
      showError(t("admin.website.videoBanner.errors.requiredFields"))
      return
    }

    if (file && file.size > VIDEO_BANNER_UPLOAD_LIMITS.videoBytes) {
      showError(
        t("admin.website.videoBanner.errors.videoTooLarge", {
          limit: formatBytesLabel(VIDEO_BANNER_UPLOAD_LIMITS.videoBytes),
        }),
      )
      return
    }

    if (file && !file.type.match(/^video\//)) {
      showError(t("admin.website.videoBanner.errors.videoType"))
      return
    }

    const payload: SaveVideoBannerInput = {
      headline: mirroredHeadline,
      author: mirroredAuthor,
      socials,
      file: file ?? null,
      removeVideo: removeVideo && !file,
      updatedBy: user?.displayName || user?.email || undefined,
      onUploadProgress: file
        ? (percent) => setUploadPercent(percent)
        : undefined,
    }

    try {
      setUploadPercent(file ? 0 : null)
      await saveMutation.mutateAsync(payload)
      appToast.success(t("admin.website.videoBanner.toasts.saved"))
      setFile(null)
      setRemoveVideo(false)
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : t("admin.website.videoBanner.errors.saveFailed"),
      )
    } finally {
      setUploadPercent(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.videoBanner.stats.video")}
          value={
            hasStoredVideo || Boolean(file)
              ? t("admin.website.videoBanner.stats.videoSet")
              : t("admin.website.videoBanner.stats.videoMissing")
          }
          icon={<Film className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.videoBanner.stats.socials")}
          value={visibleSocialCount}
          icon={<Eye className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.videoBanner.stats.networks")}
          value={VIDEO_BANNER_SOCIAL_ORDER.length}
          icon={<Video className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.videoBanner.loadError")}
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
          {t("admin.website.videoBanner.loading")}
        </div>
      ) : (
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="mb-5">
              <h2 className="text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                {t("admin.website.videoBanner.editorTitle")}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {t("admin.website.videoBanner.editorHint")}
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2.5">
                <p className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.videoBanner.fields.video")}
                </p>
                <div className="overflow-hidden rounded-[20px] border border-black/10 bg-[#111111]">
                  <div className="relative aspect-video w-full">
                    {previewUrl && !removeVideo ? (
                      <video
                        ref={previewVideoRef}
                        src={previewUrl}
                        className="absolute inset-0 size-full object-cover"
                        muted
                        loop
                        playsInline
                        autoPlay
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/55">
                        <Film className="size-8" strokeWidth={1.5} />
                        <span className="px-4 text-center text-[13px] font-medium">
                          {t("admin.website.videoBanner.videoEmpty")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={!canManage || busy}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <Upload className="size-4" strokeWidth={2} />
                    {previewUrl && !removeVideo
                      ? t("admin.website.videoBanner.replaceVideo")
                      : t("admin.website.videoBanner.chooseVideo")}
                  </button>
                  {hasStoredVideo || (previewUrl && !removeVideo) ? (
                    <button
                      type="button"
                      disabled={!canManage || busy}
                      onClick={() => {
                        if (hasStoredVideo && !file) {
                          setConfirmClearVideo(true)
                          return
                        }
                        setFile(null)
                        setRemoveVideo(true)
                        setPreviewUrl(null)
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#FFE8E4] px-4 text-[13px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1] disabled:opacity-60"
                    >
                      <Trash2 className="size-3.5" />
                      {t("admin.website.videoBanner.removeVideo")}
                    </button>
                  ) : null}
                  <p className="text-[12px] font-medium text-[#6B7280]">
                    {t("admin.website.videoBanner.videoHint", {
                      limit: formatBytesLabel(
                        VIDEO_BANNER_UPLOAD_LIMITS.videoBytes,
                      ),
                    })}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={!canManage || busy}
                    onChange={(e) => {
                      const next = e.target.files?.[0] ?? null
                      setFile(next)
                      e.target.value = ""
                    }}
                  />
                </div>
                {uploadPercent != null ? (
                  <div className="h-2 overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full bg-[var(--gym-lime,#fb5001)] transition-all"
                      style={{ width: `${uploadPercent}%` }}
                    />
                  </div>
                ) : null}
              </div>

              {renderBilingual({
                label: t("admin.website.videoBanner.fields.headline"),
                value: headline,
                onChange: setHeadline,
                multiline: true,
                placeholderEn: DEFAULT_VIDEO_BANNER_COPY.headline.en,
                placeholderAr: DEFAULT_VIDEO_BANNER_COPY.headline.ar,
              })}
              {renderBilingual({
                label: t("admin.website.videoBanner.fields.author"),
                value: author,
                onChange: setAuthor,
                placeholderEn: DEFAULT_VIDEO_BANNER_COPY.author.en,
                placeholderAr: DEFAULT_VIDEO_BANNER_COPY.author.ar,
              })}

              <div className="space-y-3">
                <div>
                  <p className="text-[12px] font-bold text-[#374151]">
                    {t("admin.website.videoBanner.fields.socials")}
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
                    {t("admin.website.videoBanner.socialsHint")}
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
                            ? t("admin.website.videoBanner.show")
                            : t("admin.website.videoBanner.hide")}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            {canManage ? (
              <div className="mt-6 space-y-3 border-t border-black/[0.07] pt-5">
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
                    ? t("admin.website.videoBanner.saving")
                    : t("admin.website.videoBanner.save")}
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="mb-4">
              <h2 className="text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                {t("admin.website.videoBanner.preview")}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {t("admin.website.videoBanner.previewHint")}
              </p>
            </div>

            <div
              dir={isRtl ? "rtl" : "ltr"}
              className="flex min-h-[320px] flex-col overflow-hidden rounded-[22px] bg-[var(--gym-dark,#24030c)] lg:min-h-[280px] lg:flex-row"
            >
              <div className="relative min-h-[180px] w-full overflow-hidden lg:w-[58%]">
                {previewUrl && !removeVideo ? (
                  <>
                    <video
                      src={previewUrl}
                      className="absolute inset-0 size-full object-cover"
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                    <button
                      type="button"
                      onClick={togglePreviewPlayback}
                      className="absolute bottom-4 end-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#111111)]"
                    >
                      {previewPlaying ? (
                        <Pause className="size-4 fill-current" strokeWidth={0} />
                      ) : (
                        <Play
                          className="size-4 fill-current ps-0.5"
                          strokeWidth={0}
                        />
                      )}
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white/50">
                    <Film className="size-8" strokeWidth={1.4} />
                  </div>
                )}
              </div>

              <div className="relative flex w-full flex-col px-5 py-6 lg:w-[42%] lg:px-6 lg:py-7">
                <h3 className="max-w-[16ch] font-heading text-[20px] font-bold leading-[1.2] text-white sm:text-[22px]">
                  {previewHeadline}
                </h3>
                <p className="mt-5 flex items-center gap-2.5 text-[13px] font-medium text-white">
                  <span className="inline-block h-px w-6 bg-white/80" />
                  <span>{previewAuthor || "—"}</span>
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <span className="text-[12px] text-white/90">
                    {t("mission.follow")}
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {socials
                      .filter((item) => item.enabled)
                      .map((item) => {
                        const meta = SOCIAL_META[item.network]
                        const Icon = meta.Icon
                        return (
                          <span
                            key={item.network}
                            className="inline-flex size-7 items-center justify-center rounded-[7px] bg-[var(--gym-lime,#fb5001)] text-white"
                          >
                            <Icon className="size-3.5" />
                          </span>
                        )
                      })}
                    {visibleSocialCount === 0 ? (
                      <span className="text-[12px] text-white/45">
                        {t("admin.website.videoBanner.noSocials")}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p
                  aria-hidden
                  className="pointer-events-none mt-8 select-none font-heading text-[28px] font-extrabold uppercase leading-none tracking-tight text-white/[0.08] sm:text-[34px]"
                >
                  {t("mission.marquee")}
                </p>
              </div>
            </div>
          </section>
        </form>
      )}

      <ConfirmActionDialog
        open={confirmClearVideo}
        title={t("admin.website.videoBanner.clearVideoTitle")}
        description={t("admin.website.videoBanner.clearVideoDescription")}
        tone="danger"
        confirmLabel={t("admin.website.videoBanner.removeVideo")}
        onCancel={() => setConfirmClearVideo(false)}
        onConfirm={async () => {
          try {
            if (content?.videoUrl) {
              await clearVideoMutation.mutateAsync(
                user?.displayName || user?.email || undefined,
              )
            }
            setFile(null)
            setRemoveVideo(true)
            setPreviewUrl(null)
            appToast.success(t("admin.website.videoBanner.toasts.videoRemoved"))
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.videoBanner.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}
