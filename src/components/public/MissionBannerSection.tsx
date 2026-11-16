import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pause, Play } from "lucide-react"
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6"
import { useVideoBannerContentQuery } from "@/features/website/hooks"
import { isRenderableVideoSrc } from "@/features/website/paths"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"
import type { VideoBannerSocialNetwork } from "@/types/website"
import vodSrc from "@/assets/vod.mp4"

const SOCIAL_ICONS: Record<
  VideoBannerSocialNetwork,
  { Icon: typeof FaFacebookF; label: string }
> = {
  facebook: { Icon: FaFacebookF, label: "Facebook" },
  linkedin: { Icon: FaLinkedinIn, label: "LinkedIn" },
  youtube: { Icon: FaYoutube, label: "YouTube" },
  instagram: { Icon: FaInstagram, label: "Instagram" },
  tiktok: { Icon: FaTiktok, label: "TikTok" },
}

const DEFAULT_SOCIALS: Array<{
  network: VideoBannerSocialNetwork
  href: string
}> = [
  { network: "facebook", href: "#" },
  { network: "linkedin", href: "#" },
  { network: "youtube", href: "#" },
  { network: "instagram", href: "#" },
]

export function MissionBannerSection() {
  const { t, i18n } = useTranslation()
  const { locale, isRtl } = useLocale()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(true)

  const {
    data: content,
    isPending,
    isFetched,
    isError,
  } = useVideoBannerContentQuery({ audience: "public" })

  const hasCms = Boolean(content)
  const useStaticFallback = isFetched && (isError || !hasCms)
  const awaitingCms = isPending && !hasCms
  const source = hasCms && !useStaticFallback ? content! : null

  const headline = source
    ? resolveBilingualText(source.headline, locale, t("mission.headline"))
    : t("mission.headline")
  const author = source
    ? resolveBilingualText(source.author, locale, t("mission.author"))
    : t("mission.author")
  const videoSrc =
    source?.videoUrl && isRenderableVideoSrc(source.videoUrl)
      ? source.videoUrl
      : vodSrc

  const socials = useMemo(() => {
    if (source) {
      return source.socials
        .filter((item) => item.enabled)
        .map((item) => ({
          network: item.network,
          href: item.url.trim() || "#",
        }))
    }
    return DEFAULT_SOCIALS
  }, [source])

  // Marquee stays static from i18n — never CMS-driven.
  const marqueePhrase = t("mission.marquee")
  const marqueeUnit = `${marqueePhrase} · ${marqueePhrase} · `

  useEffect(() => {
    const video = videoRef.current
    if (!video || awaitingCms) return
    video.muted = true
    void video
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false))
  }, [awaitingCms, videoSrc])

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  return (
    <section className="w-full px-[15px] py-12 md:py-16 lg:px-[30px]">
      <div className="relative mx-auto flex min-h-[640px] w-full flex-col overflow-hidden rounded-[24px] bg-[var(--gym-dark)] sm:min-h-[680px] sm:rounded-[30px] lg:min-h-[560px] lg:flex-row">
        <div className="relative min-h-[360px] w-full shrink-0 overflow-hidden sm:min-h-[400px] lg:min-h-0 lg:w-[58%] lg:flex-1 lg:shrink">
          {awaitingCms ? (
            <div className="absolute inset-0 animate-pulse bg-white/10" />
          ) : (
            <>
              <video
                ref={videoRef}
                key={videoSrc}
                className="absolute inset-0 size-full object-cover"
                src={videoSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={t("mission.videoLabel")}
              />
              <button
                type="button"
                onClick={togglePlayback}
                className="absolute bottom-5 end-5 z-20 inline-flex size-12 items-center justify-center rounded-full bg-white text-[var(--gym-ink)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out hover:scale-105 active:scale-95 sm:bottom-6 sm:end-6 sm:size-14"
                aria-label={playing ? t("mission.pause") : t("mission.play")}
              >
                {playing ? (
                  <Pause
                    className="size-5 fill-current sm:size-6"
                    strokeWidth={0}
                  />
                ) : (
                  <Play
                    className="size-5 fill-current ps-0.5 sm:size-6"
                    strokeWidth={0}
                  />
                )}
              </button>
            </>
          )}
        </div>

        <div className="relative z-10 flex w-full flex-col justify-start overflow-hidden bg-[var(--gym-dark)] px-8 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10 lg:w-[42%] lg:px-12 lg:pb-24 lg:pt-12 xl:px-14">
          {awaitingCms ? (
            <div className="space-y-5" aria-hidden>
              <div className="h-10 w-4/5 animate-pulse rounded-lg bg-white/15" />
              <div className="h-4 w-1/3 animate-pulse rounded-md bg-white/10" />
              <div className="mt-10 flex gap-3">
                <div className="h-7 w-16 animate-pulse rounded-md bg-white/10" />
                <div className="size-7 animate-pulse rounded-[7px] bg-white/15" />
                <div className="size-7 animate-pulse rounded-[7px] bg-white/15" />
                <div className="size-7 animate-pulse rounded-[7px] bg-white/15" />
              </div>
            </div>
          ) : (
            <>
              <h2 className="max-w-[18ch] font-heading text-[28px] font-bold leading-[1.18] text-white sm:text-[32px] md:text-[34px] lg:text-[36px]">
                {headline}
              </h2>

              <p className="mt-9 flex items-center gap-3 text-[15px] font-medium text-white sm:mt-10 sm:text-[16px]">
                <span
                  className="inline-block h-px w-7 bg-white/80"
                  aria-hidden
                />
                <span>{author}</span>
              </p>

              {socials.length > 0 ? (
                <div className="mt-12 flex flex-wrap items-center gap-4 sm:mt-14 lg:mt-20">
                  <span className="text-[14px] tracking-[0.04em] text-white sm:text-[15px]">
                    {t("mission.follow")}
                  </span>
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    {socials.map(({ network, href }) => {
                      const meta = SOCIAL_ICONS[network]
                      const Icon = meta.Icon
                      return (
                        <a
                          key={network}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={meta.label}
                          className="inline-flex size-7 items-center justify-center rounded-[7px] bg-[var(--gym-lime)] text-white transition-transform duration-300 ease-out hover:scale-105 active:scale-95 sm:size-8 sm:rounded-[8px]"
                        >
                          <Icon className="size-3.5 sm:size-4" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}

          <div
            dir="ltr"
            className={cn(
              "mission-marquee pointer-events-none relative mt-10 overflow-hidden sm:mt-12",
              isRtl ? "h-[4rem] sm:h-[4.4rem]" : "h-[3.4rem] sm:h-[3.8rem]",
              "-mx-8 w-[calc(100%+4rem)] sm:-mx-10 sm:w-[calc(100%+5rem)]",
              "lg:absolute lg:inset-x-0 lg:mx-0 lg:mt-0 lg:h-auto lg:w-auto",
              isRtl ? "lg:bottom-16" : "lg:bottom-10",
              isRtl && "mission-marquee--rtl",
            )}
            aria-hidden
          >
            <div
              key={i18n.language}
              className="mission-marquee__track flex w-max will-change-transform"
            >
              {[0, 1].map((copy) => (
                <p
                  key={copy}
                  dir={isRtl ? "rtl" : "ltr"}
                  className={cn(
                    "mission-marquee__text shrink-0 whitespace-nowrap pr-8 font-heading text-[44px] font-extrabold sm:text-[52px] lg:text-[72px]",
                    isRtl
                      ? "tracking-normal leading-[1.18] pb-[0.12em]"
                      : "uppercase leading-none tracking-[-0.02em]",
                  )}
                >
                  {marqueeUnit}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
