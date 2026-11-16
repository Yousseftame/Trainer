import type { BilingualText } from "@/types/program"

/** Public home hero banner slide (CMS-managed). */
export type HomeHeroSlide = {
  id: string
  enabled: boolean
  order: number
  greeting: BilingualText
  titleBefore: BilingualText
  titleAccent: BilingualText
  titleAfter: BilingualText
  description: BilingualText
  cta: BilingualText
  watermark: BilingualText
  /** Public download URL for the background image. */
  imageUrl: string
  /** Firebase Storage object path under website/home/hero/... */
  storagePath: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
}

/** Singleton settings for TrustSection coaches count. */
export type TrustedPartnersSettings = {
  id: "config"
  /** Displayed count inside “Trusted by over {count} coaches” (EN/AR). */
  coachesCount: BilingualText
  updatedAt: string
  updatedBy?: string
}

/** Logo in the trusted-partners infinite marquee. */
export type TrustedPartnerLogo = {
  id: string
  enabled: boolean
  order: number
  /** Optional accessible name for the logo. */
  name: BilingualText
  imageUrl: string
  /** Firebase Storage path under website/home/trusted-partners/... */
  storagePath: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
}

/** Certification / highlight point under Who I Am. */
export type WhoIAmPoint = {
  id: string
  text: BilingualText
}

/** Singleton content for the home Who I Am section. */
export type WhoIAmContent = {
  id: "config"
  /** Left photo */
  imageUrl: string
  storagePath: string
  imageAlt: BilingualText
  /** Overlay number on the photo, e.g. "14+" */
  yearsValue: BilingualText
  yearsLabel: BilingualText
  /** Right column copy */
  eyebrow: BilingualText
  titleLine1: BilingualText
  titleLine2: BilingualText
  body: BilingualText
  cta: BilingualText
  /** Points block heading, e.g. "Certifications" */
  pointsTitle: BilingualText
  points: WhoIAmPoint[]
  updatedAt: string
  updatedBy?: string
}

/** Which marquee row a transformation belongs to. */
export type TransformationLoop = "top" | "bottom"

/**
 * Transformations gallery item (before/after composite image).
 * `loop` places the card on the top (left-scrolling) or bottom (right-scrolling) marquee.
 */
export type TransformationItem = {
  id: string
  enabled: boolean
  order: number
  loop: TransformationLoop
  name: BilingualText
  description: BilingualText
  /** Optional display date, e.g. "March 2024". Empty = hidden. */
  date: BilingualText
  imageAlt: BilingualText
  imageUrl: string
  /** Firebase Storage path under website/common/transformations/... */
  storagePath: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
}

/** Card in the home “What’s your fitness dream?” gallery. */
export type FitnessDreamCard = {
  id: string
  enabled: boolean
  order: number
  title: BilingualText
  description: BilingualText
  imageAlt: BilingualText
  imageUrl: string
  /** Firebase Storage path under website/home/fitness-dream/... */
  storagePath: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
}

/** Singleton content for the home Coaching App banner (SecondHero). */
export type CoachingAppBanner = {
  id: "config"
  title: BilingualText
  description: BilingualText
  imageAlt: BilingualText
  imageUrl: string
  /** Firebase Storage path under website/home/coaching-app/... */
  storagePath: string
  updatedAt: string
  updatedBy?: string
}

export type VideoBannerSocialNetwork =
  | "facebook"
  | "linkedin"
  | "youtube"
  | "instagram"
  | "tiktok"

/** One social channel on the Video / Mission banner. */
export type VideoBannerSocialLink = {
  network: VideoBannerSocialNetwork
  /** When false, the icon is hidden on the public site. */
  enabled: boolean
  url: string
}

/** Singleton content for the home Video / Mission banner. Marquee stays i18n-static. */
export type VideoBannerContent = {
  id: "config"
  headline: BilingualText
  author: BilingualText
  /** Public download URL for the autoplay video. */
  videoUrl: string
  /** Firebase Storage path under website/home/video-banner/... */
  storagePath: string
  socials: VideoBannerSocialLink[]
  updatedAt: string
  updatedBy?: string
}

/** Visual size slot in TestimonialsSection (exactly 6 fixed positions). */
export type TestimonialSlotSize =
  | "one"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six"

/** One of the six home testimonials. */
export type TestimonialItem = {
  id: string
  /** 0–5 — locks the avatar into the designed cloud position. */
  slotIndex: number
  size: TestimonialSlotSize
  title: BilingualText
  body: BilingualText
  author: BilingualText
  imageUrl: string
  /** Firebase Storage path under website/home/testimonials/... */
  storagePath: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
}

/** Fixed tab ids for GoalsBannerSection (exactly 4). */
export type GoalsBannerTabId =
  | "logging"
  | "videos"
  | "messaging"
  | "metrics"

/** One feature tab inside the Goals banner. */
export type GoalsBannerTab = {
  id: GoalsBannerTabId
  /** Label on the category pill. */
  tabLabel: BilingualText
  title: BilingualText
  description: BilingualText
  /** CTA label — public link is always #contact. */
  cta: BilingualText
  imageAlt: BilingualText
  imageUrl: string
  /** Firebase Storage path under website/home/goals-banner/... */
  storagePath: string
}

/** Singleton content for the home Goals banner section. */
export type GoalsBannerContent = {
  id: "config"
  /** Section head title above the tabs. */
  title: BilingualText
  tabs: GoalsBannerTab[]
  updatedAt: string
  updatedBy?: string
}

/** One story paragraph in the About “My story” section (max 5). */
export type AboutMyStoryPoint = {
  id: string
  text: BilingualText
}

/**
 * Singleton content for the About “My story” section.
 * Eyebrow + section title stay i18n-static by design.
 */
export type AboutMyStoryContent = {
  id: "config"
  /** Large faded watermark, e.g. "14+" / "+14". */
  watermark: BilingualText
  imageUrl: string
  /** Firebase Storage path under website/about/my-story/... */
  storagePath: string
  imageAlt: BilingualText
  points: AboutMyStoryPoint[]
  updatedAt: string
  updatedBy?: string
}

/** Fixed card ids for About “How I coach” (exactly 3). */
export type AboutHowICoachCardId =
  | "method"
  | "nutrition"
  | "accountability"

/** One pillar card in How I coach. */
export type AboutHowICoachCard = {
  id: AboutHowICoachCardId
  title: BilingualText
  body: BilingualText
}

/**
 * Singleton content for About “How I coach”.
 * Eyebrow stays i18n-static; no Storage assets (copy-only section).
 */
export type AboutHowICoachContent = {
  id: "config"
  title: BilingualText
  subtitle: BilingualText
  cards: AboutHowICoachCard[]
  updatedAt: string
  updatedBy?: string
}

/** Fixed point ids for About “Who I help” (exactly 4). */
export type AboutWhoIHelpPointId =
  | "strength"
  | "fatLoss"
  | "health"
  | "athletes"

export type AboutWhoIHelpPoint = {
  id: AboutWhoIHelpPointId
  text: BilingualText
}

/**
 * Singleton content for About “Who I help”.
 * Eyebrow stays i18n-static; copy-only (no Storage).
 */
export type AboutWhoIHelpContent = {
  id: "config"
  title: BilingualText
  points: AboutWhoIHelpPoint[]
  updatedAt: string
  updatedBy?: string
}

export type AboutCertificationPoint = {
  id: string
  text: BilingualText
}

/**
 * Singleton content for About “Certifications”.
 * Eyebrow stays i18n-static; up to 6 points; copy-only (no Storage).
 */
export type AboutCertificationsContent = {
  id: "config"
  title: BilingualText
  points: AboutCertificationPoint[]
  updatedAt: string
  updatedBy?: string
}

/**
 * FAQ item — copy-only CMS.
 * `featured` controls home FaqSection (max 5). All items render on /faq.
 */
export type FaqItem = {
  id: string
  question: BilingualText
  answer: BilingualText
  /** Show in home FaqSection (max FAQ_FEATURED_MAX). */
  featured: boolean
  order: number
  createdAt: string
  updatedAt: string
  updatedBy?: string
}

/**
 * Singleton content for About closing CTA banner.
 * Gradient / overlay stay fixed in the public design; image + copy + CTA are CMS-driven.
 */
export type AboutClosingBannerContent = {
  id: "config"
  title: BilingualText
  body: BilingualText
  ctaLabel: BilingualText
  /** In-app path (e.g. /#contact) or absolute https URL. */
  ctaHref: string
  imageUrl: string
  /** Firebase Storage path under website/about/closing-banner/... */
  storagePath: string
  imageAlt: BilingualText
  updatedAt: string
  updatedBy?: string
}

/**
 * Singleton content for the About page hero.
 * Eyebrow / role / nameLabel stay i18n-static by design.
 */
export type AboutHeroContent = {
  id: "config"
  name: BilingualText
  /** Large tagline under the name. */
  headline: BilingualText
  /** First description paragraph. */
  lead: BilingualText
  /** Second description paragraph. */
  leadSecondary: BilingualText
  /** Stat number under the divider, e.g. "14+". */
  yearsValue: BilingualText
  yearsLabel: BilingualText
  /** Title beside the experience stat. */
  metaTitle: BilingualText
  /** Description beside the experience stat. */
  metaBody: BilingualText
  imageUrl: string
  /** Firebase Storage path under website/about/hero/... */
  storagePath: string
  imageAlt: BilingualText
  updatedAt: string
  updatedBy?: string
}

/**
 * Shared public footer contact + socials (singleton).
 * Labels / nav links / form copy stay i18n-static. No Storage media.
 */
export type FooterContent = {
  id: "config"
  /** Display phone, e.g. "+20 101 115 1366". */
  phone: string
  /** tel: href value, e.g. "+201011151366". */
  phoneRaw: string
  email: string
  socials: VideoBannerSocialLink[]
  updatedAt: string
  updatedBy?: string
}
