import { doc, getDoc, setDoc } from "firebase/firestore"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import type { BilingualText } from "@/types/program"
import type {
  AboutHowICoachCard,
  AboutHowICoachCardId,
  AboutHowICoachContent,
} from "@/types/website"

export const ABOUT_HOW_I_COACH_COLLECTION = "website_about_how_i_coach"
export const ABOUT_HOW_I_COACH_DOC_ID = "config"
export const ABOUT_HOW_I_COACH_CARDS_MAX = 3

export const ABOUT_HOW_I_COACH_CARD_IDS: AboutHowICoachCardId[] = [
  "method",
  "nutrition",
  "accountability",
]

export const DEFAULT_ABOUT_HOW_I_COACH_COPY = {
  title: {
    en: "A simple system that actually sticks",
    ar: "نظام بسيط يثبت فعلاً",
  },
  subtitle: {
    en: "Every program is built around three non-negotiables so progress feels measurable and sustainable.",
    ar: "كل برنامج يُبنى على ثلاثة أسس ثابتة ليكون التقدم قابلاً للقياس ومستداماً.",
  },
  cards: {
    method: {
      title: { en: "Smart programming", ar: "برمجة ذكية" },
      body: {
        en: "Workouts progress with intention—right volume, right intensity, and clear weekly structure matched to your level and schedule.",
        ar: "تمارين تتقدم بقصد—الحجم المناسب، والشدة المناسبة، وبنية أسبوعية واضحة تناسب مستواك وجدولك.",
      },
    },
    nutrition: {
      title: { en: "Practical nutrition", ar: "تغذية عملية" },
      body: {
        en: "No extreme diets. Just food strategies you can follow at home, at work, and on busy days while still moving toward your goal.",
        ar: "بدون حميات قاسية. فقط استراتيجيات غذائية تقدر تتبعها في البيت والعمل والأيام المزدحمة وأنت تتقدم نحو هدفك.",
      },
    },
    accountability: {
      title: { en: "Real accountability", ar: "متابعة حقيقية" },
      body: {
        en: "Check-ins, form feedback, and plan adjustments keep you moving forward when motivation dips and life gets loud.",
        ar: "متابعة دورية، ملاحظات على الأداء، وتعديلات على الخطة تبقيك متقدماً حتى عندما تقل الحماسة وتزدحم الحياة.",
      },
    },
  },
} as const

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function normalizeBilingual(
  value: unknown,
  fallback: BilingualText = { en: "", ar: "" },
): BilingualText {
  if (!value || typeof value !== "object") return { ...fallback }
  const raw = value as Record<string, unknown>
  return {
    en: asString(raw.en, fallback.en),
    ar: asString(raw.ar, fallback.ar),
  }
}

function emptyCard(id: AboutHowICoachCardId): AboutHowICoachCard {
  const defaults = DEFAULT_ABOUT_HOW_I_COACH_COPY.cards[id]
  return {
    id,
    title: { ...defaults.title },
    body: { ...defaults.body },
  }
}

function normalizeCard(
  id: AboutHowICoachCardId,
  raw: Record<string, unknown> | null | undefined,
): AboutHowICoachCard {
  const defaults = DEFAULT_ABOUT_HOW_I_COACH_COPY.cards[id]
  return {
    id,
    title: normalizeBilingual(raw?.title, defaults.title),
    body: normalizeBilingual(raw?.body, defaults.body),
  }
}

export function normalizeAboutHowICoachContent(
  raw: Record<string, unknown> | null | undefined,
): AboutHowICoachContent {
  const cardsRaw = Array.isArray(raw?.cards) ? raw.cards : []
  const byId = new Map<string, Record<string, unknown>>()
  for (const entry of cardsRaw) {
    if (!entry || typeof entry !== "object") continue
    const row = entry as Record<string, unknown>
    const id = asString(row.id)
    if (ABOUT_HOW_I_COACH_CARD_IDS.includes(id as AboutHowICoachCardId)) {
      byId.set(id, row)
    }
  }

  return {
    id: ABOUT_HOW_I_COACH_DOC_ID,
    title: normalizeBilingual(raw?.title, DEFAULT_ABOUT_HOW_I_COACH_COPY.title),
    subtitle: normalizeBilingual(
      raw?.subtitle,
      DEFAULT_ABOUT_HOW_I_COACH_COPY.subtitle,
    ),
    cards: ABOUT_HOW_I_COACH_CARD_IDS.map((id) =>
      normalizeCard(id, byId.get(id) ?? null),
    ),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export function createDefaultAboutHowICoachContent(): AboutHowICoachContent {
  return {
    id: ABOUT_HOW_I_COACH_DOC_ID,
    title: { ...DEFAULT_ABOUT_HOW_I_COACH_COPY.title },
    subtitle: { ...DEFAULT_ABOUT_HOW_I_COACH_COPY.subtitle },
    cards: ABOUT_HOW_I_COACH_CARD_IDS.map((id) => emptyCard(id)),
    updatedAt: "",
    updatedBy: undefined,
  }
}

export async function fetchAboutHowICoachContent(): Promise<AboutHowICoachContent | null> {
  const snap = await getDoc(
    doc(getDb(), ABOUT_HOW_I_COACH_COLLECTION, ABOUT_HOW_I_COACH_DOC_ID),
  )
  if (!snap.exists()) return null
  return normalizeAboutHowICoachContent(
    snap.data() as Record<string, unknown>,
  )
}

function requireBilingual(
  en: string,
  ar: string,
  label: string,
): BilingualText {
  const mirrored = mirrorBilingual(en, ar)
  if (!mirrored) throw new Error(`${label} is required`)
  return mirrored
}

async function readOrDefault(): Promise<AboutHowICoachContent> {
  const existing = await fetchAboutHowICoachContent()
  return existing ?? createDefaultAboutHowICoachContent()
}

async function writeContent(
  content: AboutHowICoachContent,
): Promise<AboutHowICoachContent> {
  await setDoc(
    doc(getDb(), ABOUT_HOW_I_COACH_COLLECTION, ABOUT_HOW_I_COACH_DOC_ID),
    stripUndefined({ ...content, id: ABOUT_HOW_I_COACH_DOC_ID }),
  )
  return content
}

export type SaveAboutHowICoachHeaderInput = {
  title: BilingualText
  subtitle: BilingualText
  updatedBy?: string
}

export async function saveAboutHowICoachHeader(
  input: SaveAboutHowICoachHeaderInput,
): Promise<AboutHowICoachContent> {
  const current = await readOrDefault()
  const now = new Date().toISOString()
  return writeContent({
    ...current,
    title: requireBilingual(input.title.en, input.title.ar, "Title"),
    subtitle: requireBilingual(
      input.subtitle.en,
      input.subtitle.ar,
      "Description",
    ),
    updatedAt: now,
    updatedBy: input.updatedBy || current.updatedBy,
  })
}

export type SaveAboutHowICoachCardInput = {
  cardId: AboutHowICoachCardId
  title: BilingualText
  body: BilingualText
  updatedBy?: string
}

export async function saveAboutHowICoachCard(
  input: SaveAboutHowICoachCardInput,
): Promise<AboutHowICoachContent> {
  if (!ABOUT_HOW_I_COACH_CARD_IDS.includes(input.cardId)) {
    throw new Error("Invalid how-I-coach card")
  }

  const current = await readOrDefault()
  const nextCard: AboutHowICoachCard = {
    id: input.cardId,
    title: requireBilingual(input.title.en, input.title.ar, "Card title"),
    body: requireBilingual(input.body.en, input.body.ar, "Card description"),
  }

  const cards = ABOUT_HOW_I_COACH_CARD_IDS.map((id) => {
    if (id === input.cardId) return nextCard
    return current.cards.find((card) => card.id === id) ?? emptyCard(id)
  })

  const now = new Date().toISOString()
  return writeContent({
    ...current,
    cards,
    updatedAt: now,
    updatedBy: input.updatedBy || current.updatedBy,
  })
}
