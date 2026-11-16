import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import { isRenderableImageSrc } from "@/features/website/paths"
import {
  deleteHomeHeroSlide,
  fetchHomeHeroSlides,
  normalizeHomeHeroSlide,
  reorderHomeHeroSlides,
  saveHomeHeroSlide,
  setHomeHeroSlideEnabled,
  type SaveHomeHeroSlideInput,
} from "@/features/website/service"
import {
  deleteTrustedPartnerLogo,
  fetchTrustedPartnerLogos,
  fetchTrustedPartnersSettings,
  normalizeTrustedPartnerLogo,
  normalizeTrustedPartnersSettings,
  reorderTrustedPartnerLogos,
  saveTrustedPartnerLogo,
  saveTrustedPartnersSettings,
  setTrustedPartnerLogoEnabled,
  type SaveTrustedPartnerLogoInput,
} from "@/features/website/trustedPartners"
import {
  clearWhoIAmImage,
  fetchWhoIAmContent,
  normalizeWhoIAmContent,
  saveWhoIAmContent,
  type SaveWhoIAmContentInput,
} from "@/features/website/whoIAm"
import {
  deleteFitnessDreamCard,
  fetchFitnessDreamCards,
  normalizeFitnessDreamCard,
  reorderFitnessDreamCards,
  saveFitnessDreamCard,
  setFitnessDreamCardEnabled,
  type SaveFitnessDreamCardInput,
} from "@/features/website/fitnessDream"
import {
  clearCoachingAppImage,
  fetchCoachingAppBanner,
  normalizeCoachingAppBanner,
  saveCoachingAppBanner,
  type SaveCoachingAppBannerInput,
} from "@/features/website/coachingApp"
import {
  clearVideoBannerVideo,
  fetchVideoBannerContent,
  normalizeVideoBannerContent,
  saveVideoBannerContent,
  type SaveVideoBannerInput,
} from "@/features/website/videoBanner"
import {
  deleteTestimonial,
  fetchPublicTestimonials,
  fetchTestimonials,
  normalizeTestimonialItem,
  saveTestimonial,
  type SaveTestimonialInput,
} from "@/features/website/testimonials"
import {
  clearGoalsBannerTabImage,
  fetchGoalsBannerContent,
  normalizeGoalsBannerContent,
  saveGoalsBannerTab,
  saveGoalsBannerTitle,
  type SaveGoalsBannerTabInput,
  type SaveGoalsBannerTitleInput,
} from "@/features/website/goalsBanner"
import {
  clearAboutHeroImage,
  fetchAboutHeroContent,
  normalizeAboutHeroContent,
  saveAboutHeroContent,
  type SaveAboutHeroContentInput,
} from "@/features/website/aboutHero"
import {
  clearAboutMyStoryImage,
  fetchAboutMyStoryContent,
  normalizeAboutMyStoryContent,
  saveAboutMyStoryContent,
  type SaveAboutMyStoryContentInput,
} from "@/features/website/aboutMyStory"
import {
  fetchAboutHowICoachContent,
  normalizeAboutHowICoachContent,
  saveAboutHowICoachCard,
  saveAboutHowICoachHeader,
  type SaveAboutHowICoachCardInput,
  type SaveAboutHowICoachHeaderInput,
} from "@/features/website/aboutHowICoach"
import {
  fetchAboutWhoIHelpContent,
  normalizeAboutWhoIHelpContent,
  saveAboutWhoIHelpContent,
  type SaveAboutWhoIHelpContentInput,
} from "@/features/website/aboutWhoIHelp"
import {
  fetchAboutCertificationsContent,
  normalizeAboutCertificationsContent,
  saveAboutCertificationsContent,
  type SaveAboutCertificationsContentInput,
} from "@/features/website/aboutCertifications"
import {
  clearAboutClosingBannerImage,
  fetchAboutClosingBannerContent,
  normalizeAboutClosingBannerContent,
  saveAboutClosingBannerContent,
  type SaveAboutClosingBannerContentInput,
} from "@/features/website/aboutClosingBanner"
import {
  deleteFaqItem,
  fetchFaqItems,
  isFaqItemComplete,
  normalizeFaqItem,
  reorderFaqItems,
  saveFaqItem,
  setFaqItemFeatured,
  type SaveFaqItemInput,
} from "@/features/website/faq"
import {
  deleteTransformationItem,
  fetchTransformationItems,
  normalizeTransformationItem,
  reorderTransformationItems,
  saveTransformationItem,
  setTransformationItemEnabled,
  setTransformationItemLoop,
  type SaveTransformationItemInput,
} from "@/features/website/transformations"
import {
  fetchFooterContent,
  normalizeFooterContent,
  saveFooterContent,
  type SaveFooterContentInput,
} from "@/features/website/footer"
import type {
  AboutCertificationsContent,
  AboutClosingBannerContent,
  AboutHeroContent,
  AboutHowICoachContent,
  AboutMyStoryContent,
  AboutWhoIHelpContent,
  CoachingAppBanner,
  FaqItem,
  FitnessDreamCard,
  FooterContent,
  GoalsBannerContent,
  GoalsBannerTabId,
  HomeHeroSlide,
  TestimonialItem,
  TransformationItem,
  TransformationLoop,
  TrustedPartnerLogo,
  TrustedPartnersSettings,
  VideoBannerContent,
  WhoIAmContent,
} from "@/types/website"

export const HOME_HERO_QUERY_KEYS = {
  all: ["website_home_hero_slides"] as const,
  public: ["website_home_hero_slides", "public"] as const,
  admin: ["website_home_hero_slides", "admin"] as const,
}

const PUBLIC_HERO_CACHE_KEY = "website_home_hero_public_v1"

function readPublicHeroCache(): HomeHeroSlide[] | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_HERO_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined
    const slides = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null
        const rawItem = item as Record<string, unknown>
        const id = typeof rawItem.id === "string" ? rawItem.id : ""
        if (!id) return null
        return normalizeHomeHeroSlide(id, rawItem)
      })
      .filter((slide): slide is HomeHeroSlide =>
        Boolean(slide && slide.enabled && isRenderableImageSrc(slide.imageUrl)),
      )
    return slides.length > 0 ? slides : undefined
  } catch {
    return undefined
  }
}

function writePublicHeroCache(slides: HomeHeroSlide[]) {
  if (typeof window === "undefined") return
  try {
    if (slides.length === 0) {
      window.sessionStorage.removeItem(PUBLIC_HERO_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(PUBLIC_HERO_CACHE_KEY, JSON.stringify(slides))
  } catch {
    // Quota / private mode — ignore
  }
}

type HomeHeroQueryOptions = {
  enabled?: boolean
  /** Public site: enabled slides with images only. Admin: all slides. */
  audience?: "public" | "admin"
}

export function useHomeHeroSlidesQuery(options?: HomeHeroQueryOptions) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"

  return useQuery({
    queryKey: isPublic
      ? HOME_HERO_QUERY_KEYS.public
      : HOME_HERO_QUERY_KEYS.admin,
    queryFn: async () => {
      const slides = await fetchHomeHeroSlides({ publicOnly: isPublic })
      if (isPublic) writePublicHeroCache(slides)
      return slides
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    // Instant paint on reload when CMS banners already exist — never flash static fallback.
    ...(isPublic
      ? {
          initialData: () => readPublicHeroCache(),
          initialDataUpdatedAt: () => Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateHomeHeroCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  // Drop session snapshot so a hard reload never briefly shows deleted banners.
  writePublicHeroCache([])
  void queryClient.invalidateQueries({ queryKey: HOME_HERO_QUERY_KEYS.all })
}

export function useSaveHomeHeroSlideMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveHomeHeroSlideInput) => saveHomeHeroSlide(input),
    onSuccess: () => invalidateHomeHeroCaches(queryClient),
  })
}

export function useSetHomeHeroSlideEnabledMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; enabled: boolean; updatedBy?: string }) =>
      setHomeHeroSlideEnabled(input.id, input.enabled, input.updatedBy),
    onSuccess: () => invalidateHomeHeroCaches(queryClient),
  })
}

export function useReorderHomeHeroSlidesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { orderedIds: string[]; updatedBy?: string }) =>
      reorderHomeHeroSlides(input.orderedIds, input.updatedBy),
    onSuccess: () => invalidateHomeHeroCaches(queryClient),
  })
}

export function useDeleteHomeHeroSlideMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteHomeHeroSlide(id),
    onSuccess: () => invalidateHomeHeroCaches(queryClient),
  })
}

/* ------------------------------------------------------------------ */
/* Trusted partners                                                     */
/* ------------------------------------------------------------------ */

export const TRUSTED_PARTNERS_QUERY_KEYS = {
  all: ["website_trusted_partners"] as const,
  settings: ["website_trusted_partners", "settings"] as const,
  logosAll: ["website_trusted_partners", "logos"] as const,
  logosPublic: ["website_trusted_partners", "logos", "public"] as const,
  logosAdmin: ["website_trusted_partners", "logos", "admin"] as const,
  publicBundle: ["website_trusted_partners", "public_bundle"] as const,
}

const PUBLIC_TRUST_CACHE_KEY = "website_trusted_partners_public_v1"

type PublicTrustCache = {
  settings: TrustedPartnersSettings
  logos: TrustedPartnerLogo[]
}

function readPublicTrustCache(): PublicTrustCache | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_TRUST_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Partial<PublicTrustCache>
    const settings = normalizeTrustedPartnersSettings(
      (parsed.settings ?? null) as Record<string, unknown> | null,
    )
    const logos = Array.isArray(parsed.logos)
      ? parsed.logos
          .map((item) => {
            if (!item || typeof item !== "object") return null
            const rawItem = item as Record<string, unknown>
            const id = typeof rawItem.id === "string" ? rawItem.id : ""
            if (!id) return null
            return normalizeTrustedPartnerLogo(id, rawItem)
          })
          .filter((logo): logo is TrustedPartnerLogo =>
            Boolean(
              logo && logo.enabled && isRenderableImageSrc(logo.imageUrl),
            ),
          )
      : []
    return { settings, logos }
  } catch {
    return undefined
  }
}

function writePublicTrustCache(bundle: PublicTrustCache | null) {
  if (typeof window === "undefined") return
  try {
    if (!bundle) {
      window.sessionStorage.removeItem(PUBLIC_TRUST_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_TRUST_CACHE_KEY,
      JSON.stringify(bundle),
    )
  } catch {
    // ignore
  }
}

export function useTrustedPartnersSettingsQuery(options?: {
  enabled?: boolean
}) {
  return useQuery({
    queryKey: TRUSTED_PARTNERS_QUERY_KEYS.settings,
    queryFn: fetchTrustedPartnersSettings,
    staleTime: QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled ?? true,
  })
}

export function useTrustedPartnerLogosQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  return useQuery({
    queryKey:
      audience === "public"
        ? TRUSTED_PARTNERS_QUERY_KEYS.logosPublic
        : TRUSTED_PARTNERS_QUERY_KEYS.logosAdmin,
    queryFn: () =>
      fetchTrustedPartnerLogos({ publicOnly: audience === "public" }),
    staleTime:
      audience === "public"
        ? QUERY_STALE_TIMES.catalog
        : QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled ?? true,
  })
}

/** Public TrustSection: settings + enabled logos in one cached bundle. */
export function usePublicTrustedPartnersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: TRUSTED_PARTNERS_QUERY_KEYS.publicBundle,
    queryFn: async () => {
      const [settings, logos] = await Promise.all([
        fetchTrustedPartnersSettings(),
        fetchTrustedPartnerLogos({ publicOnly: true }),
      ])
      const bundle = { settings, logos }
      writePublicTrustCache(bundle)
      return bundle
    },
    staleTime: QUERY_STALE_TIMES.catalog,
    initialData: () => readPublicTrustCache(),
    initialDataUpdatedAt: () => Date.now() - QUERY_STALE_TIMES.catalog,
    enabled: options?.enabled ?? true,
  })
}

function invalidateTrustedPartnersCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  writePublicTrustCache(null)
  void queryClient.invalidateQueries({
    queryKey: TRUSTED_PARTNERS_QUERY_KEYS.all,
  })
}

export function useSaveTrustedPartnersSettingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      coachesCount: TrustedPartnersSettings["coachesCount"]
      updatedBy?: string
    }) => saveTrustedPartnersSettings(input),
    onSuccess: () => invalidateTrustedPartnersCaches(queryClient),
  })
}

export function useSaveTrustedPartnerLogoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveTrustedPartnerLogoInput) =>
      saveTrustedPartnerLogo(input),
    onSuccess: () => invalidateTrustedPartnersCaches(queryClient),
  })
}

export function useSetTrustedPartnerLogoEnabledMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; enabled: boolean; updatedBy?: string }) =>
      setTrustedPartnerLogoEnabled(input.id, input.enabled, input.updatedBy),
    onSuccess: () => invalidateTrustedPartnersCaches(queryClient),
  })
}

export function useReorderTrustedPartnerLogosMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { orderedIds: string[]; updatedBy?: string }) =>
      reorderTrustedPartnerLogos(input.orderedIds, input.updatedBy),
    onSuccess: () => invalidateTrustedPartnersCaches(queryClient),
  })
}

export function useDeleteTrustedPartnerLogoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTrustedPartnerLogo(id),
    onSuccess: () => invalidateTrustedPartnersCaches(queryClient),
  })
}

/* ------------------------------------------------------------------ */
/* Who I Am                                                             */
/* ------------------------------------------------------------------ */

export const WHO_I_AM_QUERY_KEYS = {
  all: ["website_who_i_am"] as const,
  content: ["website_who_i_am", "content"] as const,
  public: ["website_who_i_am", "public"] as const,
}

const PUBLIC_WHO_I_AM_CACHE_KEY = "website_who_i_am_public_v1"

function readPublicWhoIAmCache(): WhoIAmContent | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_WHO_I_AM_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeWhoIAmContent(parsed)
  } catch {
    return undefined
  }
}

function writePublicWhoIAmCache(content: WhoIAmContent | null) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_WHO_I_AM_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_WHO_I_AM_CACHE_KEY,
      JSON.stringify(content),
    )
  } catch {
    // ignore
  }
}

export function useWhoIAmContentQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicWhoIAmCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? WHO_I_AM_QUERY_KEYS.public
      : WHO_I_AM_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchWhoIAmContent()
      if (isPublic) writePublicWhoIAmCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    // Only seed when a real CMS snapshot exists — never seed `null` or the
    // query looks “settled empty” and the UI flashes static defaults.
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateWhoIAmCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: WHO_I_AM_QUERY_KEYS.all })
}

export function useSaveWhoIAmContentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveWhoIAmContentInput) => saveWhoIAmContent(input),
    onSuccess: (content) => {
      writePublicWhoIAmCache(content)
      invalidateWhoIAmCaches(queryClient)
    },
  })
}

export function useClearWhoIAmImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updatedBy?: string) => clearWhoIAmImage(updatedBy),
    onSuccess: (content) => {
      writePublicWhoIAmCache(content)
      invalidateWhoIAmCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* Fitness dream gallery                                                */
/* ------------------------------------------------------------------ */

export const FITNESS_DREAM_QUERY_KEYS = {
  all: ["website_fitness_dream_cards"] as const,
  public: ["website_fitness_dream_cards", "public"] as const,
  admin: ["website_fitness_dream_cards", "admin"] as const,
}

const PUBLIC_FITNESS_DREAM_CACHE_KEY = "website_fitness_dream_public_v1"

function readPublicFitnessDreamCache(): FitnessDreamCard[] | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_FITNESS_DREAM_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined
    const cards = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null
        const rawItem = item as Record<string, unknown>
        const id = typeof rawItem.id === "string" ? rawItem.id : ""
        if (!id) return null
        return normalizeFitnessDreamCard(id, rawItem)
      })
      .filter((card): card is FitnessDreamCard =>
        Boolean(
          card &&
            card.enabled &&
            isRenderableImageSrc(card.imageUrl) &&
            (card.title.en.trim() || card.title.ar.trim()),
        ),
      )
    return cards.length > 0 ? cards : undefined
  } catch {
    return undefined
  }
}

function writePublicFitnessDreamCache(cards: FitnessDreamCard[]) {
  if (typeof window === "undefined") return
  try {
    if (cards.length === 0) {
      window.sessionStorage.removeItem(PUBLIC_FITNESS_DREAM_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_FITNESS_DREAM_CACHE_KEY,
      JSON.stringify(cards),
    )
  } catch {
    // Quota / private mode — ignore
  }
}

type FitnessDreamQueryOptions = {
  enabled?: boolean
  audience?: "public" | "admin"
}

export function useFitnessDreamCardsQuery(options?: FitnessDreamQueryOptions) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"

  return useQuery({
    queryKey: isPublic
      ? FITNESS_DREAM_QUERY_KEYS.public
      : FITNESS_DREAM_QUERY_KEYS.admin,
    queryFn: async () => {
      const cards = await fetchFitnessDreamCards({ publicOnly: isPublic })
      if (isPublic) writePublicFitnessDreamCache(cards)
      return cards
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic
      ? {
          initialData: () => readPublicFitnessDreamCache(),
          initialDataUpdatedAt: () => Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateFitnessDreamCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  writePublicFitnessDreamCache([])
  void queryClient.invalidateQueries({ queryKey: FITNESS_DREAM_QUERY_KEYS.all })
}

export function useSaveFitnessDreamCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveFitnessDreamCardInput) =>
      saveFitnessDreamCard(input),
    onSuccess: () => invalidateFitnessDreamCaches(queryClient),
  })
}

export function useSetFitnessDreamCardEnabledMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; enabled: boolean; updatedBy?: string }) =>
      setFitnessDreamCardEnabled(input.id, input.enabled, input.updatedBy),
    onSuccess: () => invalidateFitnessDreamCaches(queryClient),
  })
}

export function useReorderFitnessDreamCardsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { orderedIds: string[]; updatedBy?: string }) =>
      reorderFitnessDreamCards(input.orderedIds, input.updatedBy),
    onSuccess: () => invalidateFitnessDreamCaches(queryClient),
  })
}

export function useDeleteFitnessDreamCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFitnessDreamCard(id),
    onSuccess: () => invalidateFitnessDreamCaches(queryClient),
  })
}

/* ------------------------------------------------------------------ */
/* Coaching app banner                                                  */
/* ------------------------------------------------------------------ */

export const COACHING_APP_QUERY_KEYS = {
  all: ["website_coaching_app"] as const,
  content: ["website_coaching_app", "content"] as const,
  public: ["website_coaching_app", "public"] as const,
}

const PUBLIC_COACHING_APP_CACHE_KEY = "website_coaching_app_public_v1"

function readPublicCoachingAppCache(): CoachingAppBanner | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_COACHING_APP_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeCoachingAppBanner(parsed)
  } catch {
    return undefined
  }
}

function writePublicCoachingAppCache(content: CoachingAppBanner | null) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_COACHING_APP_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_COACHING_APP_CACHE_KEY,
      JSON.stringify(content),
    )
  } catch {
    // ignore
  }
}

export function useCoachingAppBannerQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicCoachingAppCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? COACHING_APP_QUERY_KEYS.public
      : COACHING_APP_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchCoachingAppBanner()
      if (isPublic) writePublicCoachingAppCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateCoachingAppCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: COACHING_APP_QUERY_KEYS.all })
}

export function useSaveCoachingAppBannerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveCoachingAppBannerInput) =>
      saveCoachingAppBanner(input),
    onSuccess: (content) => {
      writePublicCoachingAppCache(content)
      invalidateCoachingAppCaches(queryClient)
    },
  })
}

export function useClearCoachingAppImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updatedBy?: string) => clearCoachingAppImage(updatedBy),
    onSuccess: (content) => {
      writePublicCoachingAppCache(content)
      invalidateCoachingAppCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* Video / Mission banner                                               */
/* ------------------------------------------------------------------ */

export const VIDEO_BANNER_QUERY_KEYS = {
  all: ["website_video_banner"] as const,
  content: ["website_video_banner", "content"] as const,
  public: ["website_video_banner", "public"] as const,
}

const PUBLIC_VIDEO_BANNER_CACHE_KEY = "website_video_banner_public_v1"

function readPublicVideoBannerCache(): VideoBannerContent | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_VIDEO_BANNER_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeVideoBannerContent(parsed)
  } catch {
    return undefined
  }
}

function writePublicVideoBannerCache(content: VideoBannerContent | null) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_VIDEO_BANNER_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_VIDEO_BANNER_CACHE_KEY,
      JSON.stringify(content),
    )
  } catch {
    // ignore
  }
}

export function useVideoBannerContentQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicVideoBannerCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? VIDEO_BANNER_QUERY_KEYS.public
      : VIDEO_BANNER_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchVideoBannerContent()
      if (isPublic) writePublicVideoBannerCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateVideoBannerCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: VIDEO_BANNER_QUERY_KEYS.all })
}

export function useSaveVideoBannerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveVideoBannerInput) => saveVideoBannerContent(input),
    onSuccess: (content) => {
      writePublicVideoBannerCache(content)
      invalidateVideoBannerCaches(queryClient)
    },
  })
}

export function useClearVideoBannerVideoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updatedBy?: string) => clearVideoBannerVideo(updatedBy),
    onSuccess: (content) => {
      writePublicVideoBannerCache(content)
      invalidateVideoBannerCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* Testimonials (exactly 6 slots)                                       */
/* ------------------------------------------------------------------ */

export const TESTIMONIALS_QUERY_KEYS = {
  all: ["website_testimonials"] as const,
  public: ["website_testimonials", "public"] as const,
  admin: ["website_testimonials", "admin"] as const,
}

const PUBLIC_TESTIMONIALS_CACHE_KEY = "website_testimonials_public_v1"

function readPublicTestimonialsCache(): TestimonialItem[] | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_TESTIMONIALS_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined
    const items = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null
        const rawItem = item as Record<string, unknown>
        const id = typeof rawItem.id === "string" ? rawItem.id : ""
        if (!id) return null
        return normalizeTestimonialItem(id, rawItem)
      })
      .filter((item): item is TestimonialItem =>
        Boolean(
          item &&
            isRenderableImageSrc(item.imageUrl) &&
            (item.title.en.trim() || item.title.ar.trim()),
        ),
      )
    return items.length > 0 ? items : undefined
  } catch {
    return undefined
  }
}

function writePublicTestimonialsCache(items: TestimonialItem[]) {
  if (typeof window === "undefined") return
  try {
    if (items.length === 0) {
      window.sessionStorage.removeItem(PUBLIC_TESTIMONIALS_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_TESTIMONIALS_CACHE_KEY,
      JSON.stringify(items),
    )
  } catch {
    // ignore
  }
}

export function useTestimonialsQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"

  return useQuery({
    queryKey: isPublic
      ? TESTIMONIALS_QUERY_KEYS.public
      : TESTIMONIALS_QUERY_KEYS.admin,
    queryFn: async () => {
      if (isPublic) {
        const items = await fetchPublicTestimonials()
        writePublicTestimonialsCache(items)
        return items
      }
      return fetchTestimonials()
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic
      ? {
          initialData: () => readPublicTestimonialsCache(),
          initialDataUpdatedAt: () => Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateTestimonialsCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  writePublicTestimonialsCache([])
  void queryClient.invalidateQueries({ queryKey: TESTIMONIALS_QUERY_KEYS.all })
}

export function useSaveTestimonialMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveTestimonialInput) => saveTestimonial(input),
    onSuccess: () => invalidateTestimonialsCaches(queryClient),
  })
}

export function useDeleteTestimonialMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slotId: string) => deleteTestimonial(slotId),
    onSuccess: () => invalidateTestimonialsCaches(queryClient),
  })
}

/* ------------------------------------------------------------------ */
/* Goals banner (section title + 4 fixed tabs)                          */
/* ------------------------------------------------------------------ */

export const GOALS_BANNER_QUERY_KEYS = {
  all: ["website_goals_banner"] as const,
  content: ["website_goals_banner", "content"] as const,
  public: ["website_goals_banner", "public"] as const,
}

const PUBLIC_GOALS_BANNER_CACHE_KEY = "website_goals_banner_public_v1"

function readPublicGoalsBannerCache(): GoalsBannerContent | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_GOALS_BANNER_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeGoalsBannerContent(parsed)
  } catch {
    return undefined
  }
}

function writePublicGoalsBannerCache(content: GoalsBannerContent | null) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_GOALS_BANNER_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_GOALS_BANNER_CACHE_KEY,
      JSON.stringify(content),
    )
  } catch {
    // ignore
  }
}

export function useGoalsBannerContentQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicGoalsBannerCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? GOALS_BANNER_QUERY_KEYS.public
      : GOALS_BANNER_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchGoalsBannerContent()
      if (isPublic) writePublicGoalsBannerCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateGoalsBannerCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: GOALS_BANNER_QUERY_KEYS.all })
}

export function useSaveGoalsBannerTitleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveGoalsBannerTitleInput) =>
      saveGoalsBannerTitle(input),
    onSuccess: (content) => {
      writePublicGoalsBannerCache(content)
      invalidateGoalsBannerCaches(queryClient)
    },
  })
}

export function useSaveGoalsBannerTabMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveGoalsBannerTabInput) => saveGoalsBannerTab(input),
    onSuccess: (content) => {
      writePublicGoalsBannerCache(content)
      invalidateGoalsBannerCaches(queryClient)
    },
  })
}

export function useClearGoalsBannerTabImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { tabId: GoalsBannerTabId; updatedBy?: string }) =>
      clearGoalsBannerTabImage(params.tabId, params.updatedBy),
    onSuccess: (content) => {
      writePublicGoalsBannerCache(content)
      invalidateGoalsBannerCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* About page hero                                                      */
/* ------------------------------------------------------------------ */

export const ABOUT_HERO_QUERY_KEYS = {
  all: ["website_about_hero"] as const,
  content: ["website_about_hero", "content"] as const,
  public: ["website_about_hero", "public"] as const,
}

const PUBLIC_ABOUT_HERO_CACHE_KEY = "website_about_hero_public_v1"

function readPublicAboutHeroCache(): AboutHeroContent | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_ABOUT_HERO_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeAboutHeroContent(parsed)
  } catch {
    return undefined
  }
}

function writePublicAboutHeroCache(content: AboutHeroContent | null) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_ABOUT_HERO_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_ABOUT_HERO_CACHE_KEY,
      JSON.stringify(content),
    )
  } catch {
    // ignore
  }
}

export function useAboutHeroContentQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicAboutHeroCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? ABOUT_HERO_QUERY_KEYS.public
      : ABOUT_HERO_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchAboutHeroContent()
      if (isPublic) writePublicAboutHeroCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateAboutHeroCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: ABOUT_HERO_QUERY_KEYS.all })
}

export function useSaveAboutHeroContentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveAboutHeroContentInput) =>
      saveAboutHeroContent(input),
    onSuccess: (content) => {
      writePublicAboutHeroCache(content)
      invalidateAboutHeroCaches(queryClient)
    },
  })
}

export function useClearAboutHeroImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updatedBy?: string) => clearAboutHeroImage(updatedBy),
    onSuccess: (content) => {
      writePublicAboutHeroCache(content)
      invalidateAboutHeroCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* About My Story                                                       */
/* ------------------------------------------------------------------ */

export const ABOUT_MY_STORY_QUERY_KEYS = {
  all: ["website_about_my_story"] as const,
  content: ["website_about_my_story", "content"] as const,
  public: ["website_about_my_story", "public"] as const,
}

const PUBLIC_ABOUT_MY_STORY_CACHE_KEY = "website_about_my_story_public_v1"

function readPublicAboutMyStoryCache(): AboutMyStoryContent | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_ABOUT_MY_STORY_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeAboutMyStoryContent(parsed)
  } catch {
    return undefined
  }
}

function writePublicAboutMyStoryCache(content: AboutMyStoryContent | null) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_ABOUT_MY_STORY_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_ABOUT_MY_STORY_CACHE_KEY,
      JSON.stringify(content),
    )
  } catch {
    // ignore
  }
}

export function useAboutMyStoryContentQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicAboutMyStoryCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? ABOUT_MY_STORY_QUERY_KEYS.public
      : ABOUT_MY_STORY_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchAboutMyStoryContent()
      if (isPublic) writePublicAboutMyStoryCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateAboutMyStoryCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: ABOUT_MY_STORY_QUERY_KEYS.all,
  })
}

export function useSaveAboutMyStoryContentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveAboutMyStoryContentInput) =>
      saveAboutMyStoryContent(input),
    onSuccess: (content) => {
      writePublicAboutMyStoryCache(content)
      invalidateAboutMyStoryCaches(queryClient)
    },
  })
}

export function useClearAboutMyStoryImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updatedBy?: string) => clearAboutMyStoryImage(updatedBy),
    onSuccess: (content) => {
      writePublicAboutMyStoryCache(content)
      invalidateAboutMyStoryCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* About How I coach                                                    */
/* ------------------------------------------------------------------ */

export const ABOUT_HOW_I_COACH_QUERY_KEYS = {
  all: ["website_about_how_i_coach"] as const,
  content: ["website_about_how_i_coach", "content"] as const,
  public: ["website_about_how_i_coach", "public"] as const,
}

const PUBLIC_ABOUT_HOW_I_COACH_CACHE_KEY = "website_about_how_i_coach_public_v1"

function readPublicAboutHowICoachCache(): AboutHowICoachContent | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(
      PUBLIC_ABOUT_HOW_I_COACH_CACHE_KEY,
    )
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeAboutHowICoachContent(parsed)
  } catch {
    return undefined
  }
}

function writePublicAboutHowICoachCache(
  content: AboutHowICoachContent | null,
) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_ABOUT_HOW_I_COACH_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_ABOUT_HOW_I_COACH_CACHE_KEY,
      JSON.stringify(content),
    )
  } catch {
    // ignore
  }
}

export function useAboutHowICoachContentQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicAboutHowICoachCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? ABOUT_HOW_I_COACH_QUERY_KEYS.public
      : ABOUT_HOW_I_COACH_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchAboutHowICoachContent()
      if (isPublic) writePublicAboutHowICoachCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateAboutHowICoachCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: ABOUT_HOW_I_COACH_QUERY_KEYS.all,
  })
}

export function useSaveAboutHowICoachHeaderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveAboutHowICoachHeaderInput) =>
      saveAboutHowICoachHeader(input),
    onSuccess: (content) => {
      writePublicAboutHowICoachCache(content)
      invalidateAboutHowICoachCaches(queryClient)
    },
  })
}

export function useSaveAboutHowICoachCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveAboutHowICoachCardInput) =>
      saveAboutHowICoachCard(input),
    onSuccess: (content) => {
      writePublicAboutHowICoachCache(content)
      invalidateAboutHowICoachCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* About Who I help                                                     */
/* ------------------------------------------------------------------ */

export const ABOUT_WHO_I_HELP_QUERY_KEYS = {
  all: ["website_about_who_i_help"] as const,
  content: ["website_about_who_i_help", "content"] as const,
  public: ["website_about_who_i_help", "public"] as const,
}

const PUBLIC_ABOUT_WHO_I_HELP_CACHE_KEY = "website_about_who_i_help_public_v1"

function readPublicAboutWhoIHelpCache(): AboutWhoIHelpContent | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_ABOUT_WHO_I_HELP_CACHE_KEY)
    if (!raw) return undefined
    return normalizeAboutWhoIHelpContent(
      JSON.parse(raw) as Record<string, unknown>,
    )
  } catch {
    return undefined
  }
}

function writePublicAboutWhoIHelpCache(content: AboutWhoIHelpContent | null) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_ABOUT_WHO_I_HELP_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_ABOUT_WHO_I_HELP_CACHE_KEY,
      JSON.stringify(content),
    )
  } catch {
    // ignore
  }
}

export function useAboutWhoIHelpContentQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicAboutWhoIHelpCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? ABOUT_WHO_I_HELP_QUERY_KEYS.public
      : ABOUT_WHO_I_HELP_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchAboutWhoIHelpContent()
      if (isPublic) writePublicAboutWhoIHelpCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateAboutWhoIHelpCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: ABOUT_WHO_I_HELP_QUERY_KEYS.all,
  })
}

export function useSaveAboutWhoIHelpContentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveAboutWhoIHelpContentInput) =>
      saveAboutWhoIHelpContent(input),
    onSuccess: (content) => {
      writePublicAboutWhoIHelpCache(content)
      invalidateAboutWhoIHelpCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* About Certifications                                                 */
/* ------------------------------------------------------------------ */

export const ABOUT_CERTIFICATIONS_QUERY_KEYS = {
  all: ["website_about_certifications"] as const,
  content: ["website_about_certifications", "content"] as const,
  public: ["website_about_certifications", "public"] as const,
}

const PUBLIC_ABOUT_CERTIFICATIONS_CACHE_KEY =
  "website_about_certifications_public_v1"

function readPublicAboutCertificationsCache():
  | AboutCertificationsContent
  | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(
      PUBLIC_ABOUT_CERTIFICATIONS_CACHE_KEY,
    )
    if (!raw) return undefined
    return normalizeAboutCertificationsContent(
      JSON.parse(raw) as Record<string, unknown>,
    )
  } catch {
    return undefined
  }
}

function writePublicAboutCertificationsCache(
  content: AboutCertificationsContent | null,
) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_ABOUT_CERTIFICATIONS_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_ABOUT_CERTIFICATIONS_CACHE_KEY,
      JSON.stringify(content),
    )
  } catch {
    // ignore
  }
}

export function useAboutCertificationsContentQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicAboutCertificationsCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? ABOUT_CERTIFICATIONS_QUERY_KEYS.public
      : ABOUT_CERTIFICATIONS_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchAboutCertificationsContent()
      if (isPublic) writePublicAboutCertificationsCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateAboutCertificationsCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: ABOUT_CERTIFICATIONS_QUERY_KEYS.all,
  })
}

export function useSaveAboutCertificationsContentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveAboutCertificationsContentInput) =>
      saveAboutCertificationsContent(input),
    onSuccess: (content) => {
      writePublicAboutCertificationsCache(content)
      invalidateAboutCertificationsCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* About closing CTA banner                                             */
/* ------------------------------------------------------------------ */

export const ABOUT_CLOSING_BANNER_QUERY_KEYS = {
  all: ["website_about_closing_banner"] as const,
  content: ["website_about_closing_banner", "content"] as const,
  public: ["website_about_closing_banner", "public"] as const,
}

const PUBLIC_ABOUT_CLOSING_BANNER_CACHE_KEY =
  "website_about_closing_banner_public_v1"

function readPublicAboutClosingBannerCache():
  | AboutClosingBannerContent
  | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(
      PUBLIC_ABOUT_CLOSING_BANNER_CACHE_KEY,
    )
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeAboutClosingBannerContent(parsed)
  } catch {
    return undefined
  }
}

function writePublicAboutClosingBannerCache(
  content: AboutClosingBannerContent | null,
) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_ABOUT_CLOSING_BANNER_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_ABOUT_CLOSING_BANNER_CACHE_KEY,
      JSON.stringify(content),
    )
  } catch {
    // ignore
  }
}

export function useAboutClosingBannerContentQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicAboutClosingBannerCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? ABOUT_CLOSING_BANNER_QUERY_KEYS.public
      : ABOUT_CLOSING_BANNER_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchAboutClosingBannerContent()
      if (isPublic) writePublicAboutClosingBannerCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateAboutClosingBannerCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: ABOUT_CLOSING_BANNER_QUERY_KEYS.all,
  })
}

export function useSaveAboutClosingBannerContentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveAboutClosingBannerContentInput) =>
      saveAboutClosingBannerContent(input),
    onSuccess: (content) => {
      writePublicAboutClosingBannerCache(content)
      invalidateAboutClosingBannerCaches(queryClient)
    },
  })
}

export function useClearAboutClosingBannerImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updatedBy?: string) => clearAboutClosingBannerImage(updatedBy),
    onSuccess: (content) => {
      writePublicAboutClosingBannerCache(content)
      invalidateAboutClosingBannerCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* FAQ items                                                            */
/* ------------------------------------------------------------------ */

export const FAQ_QUERY_KEYS = {
  all: ["website_faq_items"] as const,
  admin: ["website_faq_items", "admin"] as const,
  public: ["website_faq_items", "public"] as const,
}

const PUBLIC_FAQ_CACHE_KEY = "website_faq_items_public_v1"

function readPublicFaqCache(): FaqItem[] | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_FAQ_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Array<
      Record<string, unknown> & { id?: string }
    >
    if (!Array.isArray(parsed)) return undefined
    return parsed
      .map((item) =>
        normalizeFaqItem(String(item.id ?? ""), item as Record<string, unknown>),
      )
      .filter(isFaqItemComplete)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  } catch {
    return undefined
  }
}

function writePublicFaqCache(items: FaqItem[] | null) {
  if (typeof window === "undefined") return
  try {
    if (!items) {
      window.sessionStorage.removeItem(PUBLIC_FAQ_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(PUBLIC_FAQ_CACHE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function useFaqItemsQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicFaqCache() : undefined

  return useQuery({
    queryKey: isPublic ? FAQ_QUERY_KEYS.public : FAQ_QUERY_KEYS.admin,
    queryFn: async () => {
      const items = await fetchFaqItems({ publicOnly: isPublic })
      if (isPublic) writePublicFaqCache(items)
      return items
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateFaqCaches(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: FAQ_QUERY_KEYS.all })
}

export function useSaveFaqItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveFaqItemInput) => saveFaqItem(input),
    onSuccess: async () => {
      const items = await fetchFaqItems({ publicOnly: true })
      writePublicFaqCache(items)
      invalidateFaqCaches(queryClient)
    },
  })
}

export function useSetFaqItemFeaturedMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      featured: boolean
      updatedBy?: string
    }) => setFaqItemFeatured(input.id, input.featured, input.updatedBy),
    onSuccess: async () => {
      const items = await fetchFaqItems({ publicOnly: true })
      writePublicFaqCache(items)
      invalidateFaqCaches(queryClient)
    },
  })
}

export function useReorderFaqItemsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { orderedIds: string[]; updatedBy?: string }) =>
      reorderFaqItems(input.orderedIds, input.updatedBy),
    onSuccess: async () => {
      const items = await fetchFaqItems({ publicOnly: true })
      writePublicFaqCache(items)
      invalidateFaqCaches(queryClient)
    },
  })
}

export function useDeleteFaqItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFaqItem(id),
    onSuccess: async () => {
      const items = await fetchFaqItems({ publicOnly: true })
      writePublicFaqCache(items)
      invalidateFaqCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* Transformations gallery                                              */
/* ------------------------------------------------------------------ */

export const TRANSFORMATIONS_QUERY_KEYS = {
  all: ["website_transformations"] as const,
  admin: ["website_transformations", "admin"] as const,
  public: ["website_transformations", "public"] as const,
}

const PUBLIC_TRANSFORMATIONS_CACHE_KEY = "website_transformations_public_v1"

function readPublicTransformationsCache(): TransformationItem[] | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_TRANSFORMATIONS_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Array<
      Record<string, unknown> & { id?: string }
    >
    if (!Array.isArray(parsed)) return undefined
    return parsed
      .map((item) =>
        normalizeTransformationItem(
          String(item.id ?? ""),
          item as Record<string, unknown>,
        ),
      )
      .filter((item) => item.id)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  } catch {
    return undefined
  }
}

function writePublicTransformationsCache(items: TransformationItem[] | null) {
  if (typeof window === "undefined") return
  try {
    if (!items?.length) {
      window.sessionStorage.removeItem(PUBLIC_TRANSFORMATIONS_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(
      PUBLIC_TRANSFORMATIONS_CACHE_KEY,
      JSON.stringify(items),
    )
  } catch {
    // ignore
  }
}

export function useTransformationItemsQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicTransformationsCache() : undefined

  return useQuery({
    queryKey: isPublic
      ? TRANSFORMATIONS_QUERY_KEYS.public
      : TRANSFORMATIONS_QUERY_KEYS.admin,
    queryFn: async () => {
      const items = await fetchTransformationItems({ publicOnly: isPublic })
      if (isPublic) writePublicTransformationsCache(items)
      return items
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateTransformationsCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: TRANSFORMATIONS_QUERY_KEYS.all,
  })
}

export function useSaveTransformationItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveTransformationItemInput) =>
      saveTransformationItem(input),
    onSuccess: async () => {
      const items = await fetchTransformationItems({ publicOnly: true })
      writePublicTransformationsCache(items)
      invalidateTransformationsCaches(queryClient)
    },
  })
}

export function useSetTransformationItemEnabledMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      enabled: boolean
      updatedBy?: string
    }) =>
      setTransformationItemEnabled(input.id, input.enabled, input.updatedBy),
    onSuccess: async () => {
      const items = await fetchTransformationItems({ publicOnly: true })
      writePublicTransformationsCache(items)
      invalidateTransformationsCaches(queryClient)
    },
  })
}

export function useSetTransformationItemLoopMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      loop: TransformationLoop
      updatedBy?: string
    }) => setTransformationItemLoop(input.id, input.loop, input.updatedBy),
    onSuccess: async () => {
      const items = await fetchTransformationItems({ publicOnly: true })
      writePublicTransformationsCache(items)
      invalidateTransformationsCaches(queryClient)
    },
  })
}

export function useReorderTransformationItemsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { orderedIds: string[]; updatedBy?: string }) =>
      reorderTransformationItems(input.orderedIds, input.updatedBy),
    onSuccess: async () => {
      const items = await fetchTransformationItems({ publicOnly: true })
      writePublicTransformationsCache(items)
      invalidateTransformationsCaches(queryClient)
    },
  })
}

export function useDeleteTransformationItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTransformationItem(id),
    onSuccess: async () => {
      const items = await fetchTransformationItems({ publicOnly: true })
      writePublicTransformationsCache(items)
      invalidateTransformationsCaches(queryClient)
    },
  })
}

/* ------------------------------------------------------------------ */
/* Footer (phone, email, socials)                                       */
/* ------------------------------------------------------------------ */

export const FOOTER_QUERY_KEYS = {
  all: ["website_footer"] as const,
  content: ["website_footer", "content"] as const,
  public: ["website_footer", "public"] as const,
}

const PUBLIC_FOOTER_CACHE_KEY = "website_footer_public_v1"

function readPublicFooterCache(): FooterContent | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_FOOTER_CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== "object") return undefined
    return normalizeFooterContent(parsed)
  } catch {
    return undefined
  }
}

function writePublicFooterCache(content: FooterContent | null) {
  if (typeof window === "undefined") return
  try {
    if (!content) {
      window.sessionStorage.removeItem(PUBLIC_FOOTER_CACHE_KEY)
      return
    }
    window.sessionStorage.setItem(PUBLIC_FOOTER_CACHE_KEY, JSON.stringify(content))
  } catch {
    // ignore
  }
}

export function useFooterContentQuery(options?: {
  enabled?: boolean
  audience?: "public" | "admin"
}) {
  const audience = options?.audience ?? "admin"
  const isPublic = audience === "public"
  const cached = isPublic ? readPublicFooterCache() : undefined

  return useQuery({
    queryKey: isPublic ? FOOTER_QUERY_KEYS.public : FOOTER_QUERY_KEYS.content,
    queryFn: async () => {
      const content = await fetchFooterContent()
      if (isPublic) writePublicFooterCache(content)
      return content
    },
    staleTime: isPublic
      ? QUERY_STALE_TIMES.catalog
      : QUERY_STALE_TIMES.adminList,
    ...(isPublic && cached
      ? {
          initialData: cached,
          initialDataUpdatedAt: Date.now() - QUERY_STALE_TIMES.catalog,
        }
      : {}),
    enabled: options?.enabled ?? true,
  })
}

function invalidateFooterCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: FOOTER_QUERY_KEYS.all })
}

export function useSaveFooterContentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveFooterContentInput) => saveFooterContent(input),
    onSuccess: (content) => {
      writePublicFooterCache(content)
      invalidateFooterCaches(queryClient)
    },
  })
}

