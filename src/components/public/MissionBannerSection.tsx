import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pause, Play } from "lucide-react"
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa6"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import vodSrc from "@/assets/vod.mp4"

const SOCIALS = [
  { key: "facebook", href: "#", Icon: FaFacebookF, label: "Facebook" },
  { key: "linkedin", href: "#", Icon: FaLinkedinIn, label: "LinkedIn" },
  { key: "youtube", href: "#", Icon: FaYoutube, label: "YouTube" },
  { key: "instagram", href: "#", Icon: FaInstagram, label: "Instagram" },
] as const

export function MissionBannerSection() {
  const { t, i18n } = useTranslation()
  const { isRtl } = useLocale()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(true)
  const marqueePhrase = t("mission.marquee")
  const marqueeUnit = `${marqueePhrase} · ${marqueePhrase} · `

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [])

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
        {/* Left — autoplay video (taller on mobile only) */}
        <div className="relative min-h-[360px] w-full shrink-0 overflow-hidden sm:min-h-[400px] lg:min-h-0 lg:w-[58%] lg:flex-1 lg:shrink">
          <video
            ref={videoRef}
            className="absolute inset-0 size-full object-cover"
            src={vodSrc}
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
              <Pause className="size-5 fill-current sm:size-6" strokeWidth={0} />
            ) : (
              <Play className="size-5 fill-current ps-0.5 sm:size-6" strokeWidth={0} />
            )}
          </button>
        </div>

        {/* Right — mission copy + socials + ghost marquee */}
        <div className="relative z-10 flex w-full flex-col justify-start overflow-hidden bg-[var(--gym-dark)] px-8 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10 lg:w-[42%] lg:px-12 lg:pb-24 lg:pt-12 xl:px-14">
          <h2 className="max-w-[18ch] font-heading text-[28px] font-bold leading-[1.18] text-white sm:text-[32px] md:text-[34px] lg:text-[36px]">
            {t("mission.headline")}
          </h2>

          <p className="mt-9 flex items-center gap-3 text-[15px] font-medium text-white sm:mt-10 sm:text-[16px]">
            <span className="inline-block h-px w-7 bg-white/80" aria-hidden />
            <span>{t("mission.author")}</span>
          </p>

          {/* On mobile, socials sit above a reserved marquee band (no overlap) */}
          <div className="mt-12 flex flex-wrap items-center gap-4 sm:mt-14 lg:mt-20">
            <span className="text-[14px] tracking-[0.04em] text-white sm:text-[15px]">
              {t("mission.follow")}
            </span>
            <div className="flex items-center gap-3.5 sm:gap-4">
              {SOCIALS.map(({ key, href, Icon, label }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex size-7 items-center justify-center rounded-[7px] bg-[var(--gym-lime)] text-white transition-transform duration-300 ease-out hover:scale-105 active:scale-95 sm:size-8 sm:rounded-[8px]"
                >
                  <Icon className="size-3.5 sm:size-4" />
                </a>
              ))}
            </div>
          </div>

          {/*
            Mobile: in-flow + negative margins cancel content px so clip is the card edge.
            Desktop (lg+): absolute overlay — unchanged.
          */}
          <div
            dir="ltr"
            className={cn(
              "mission-marquee pointer-events-none relative mt-10 overflow-hidden sm:mt-12",
              /* Arabic glyphs sit lower in the em box — extra height so they are not clipped */
              isRtl ? "h-[4rem] sm:h-[4.4rem]" : "h-[3.4rem] sm:h-[3.8rem]",
              /* break out of px-8 / sm:px-10 so marquee hits the card sides */
              "-mx-8 w-[calc(100%+4rem)] sm:-mx-10 sm:w-[calc(100%+5rem)]",
              "lg:absolute lg:inset-x-0 lg:mx-0 lg:mt-0 lg:h-auto lg:w-auto",
              /* Lift Arabic off the rounded card edge (dir=ltr on this node, so no rtl: variant) */
              isRtl ? "lg:bottom-16" : "lg:bottom-10",
              isRtl && "mission-marquee--rtl"
            )}
            aria-hidden
          >
            {/*
              Overflow box is dir=ltr so the loop is visible at t=0 in Arabic.
              Two identical copies + physical pr-* keep -50% wrap math equal.
            */}
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
                      : "uppercase leading-none tracking-[-0.02em]"
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
