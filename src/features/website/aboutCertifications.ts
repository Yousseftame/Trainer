import { doc, getDoc, setDoc } from "firebase/firestore"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { allocateFirestoreId } from "@/lib/firebase/ids"
import type { BilingualText } from "@/types/program"
import type {
  AboutCertificationPoint,
  AboutCertificationsContent,
} from "@/types/website"

export const ABOUT_CERTIFICATIONS_COLLECTION = "website_about_certifications"
export const ABOUT_CERTIFICATIONS_DOC_ID = "config"
export const ABOUT_CERTIFICATIONS_POINTS_MAX = 6

export const DEFAULT_ABOUT_CERTIFICATIONS_COPY = {
  title: {
    en: "Credentials you can trust",
    ar: "شهادات يمكنك الوثوق بها",
  },
  points: [
    {
      id: "trainer",
      text: {
        en: "Certified personal trainer",
        ar: "مدرب شخصي معتمد",
      },
    },
    {
      id: "nutrition",
      text: { en: "Nutrition specialist", ar: "أخصائي تغذية" },
    },
    {
      id: "strength",
      text: {
        en: "Strength and conditioning coach",
        ar: "مدرب قوة وتكييف",
      },
    },
    {
      id: "trusted",
      text: { en: "Trusted by hundreds", ar: "موثوق من المئات" },
    },
  ] satisfies AboutCertificationPoint[],
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

function normalizePoints(value: unknown): AboutCertificationPoint[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null
      const raw = item as Record<string, unknown>
      const id = asString(raw.id) || `point-${index}`
      const text = normalizeBilingual(raw.text)
      if (!text.en && !text.ar) return null
      return { id, text }
    })
    .filter((p): p is AboutCertificationPoint => Boolean(p))
    .slice(0, ABOUT_CERTIFICATIONS_POINTS_MAX)
}

export function normalizeAboutCertificationsContent(
  raw: Record<string, unknown> | null | undefined,
): AboutCertificationsContent {
  const points = normalizePoints(raw?.points)
  return {
    id: ABOUT_CERTIFICATIONS_DOC_ID,
    title: normalizeBilingual(
      raw?.title,
      DEFAULT_ABOUT_CERTIFICATIONS_COPY.title,
    ),
    points:
      points.length > 0
        ? points
        : DEFAULT_ABOUT_CERTIFICATIONS_COPY.points.map((p) => ({
            id: p.id,
            text: { ...p.text },
          })),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export async function fetchAboutCertificationsContent(): Promise<AboutCertificationsContent | null> {
  const snap = await getDoc(
    doc(
      getDb(),
      ABOUT_CERTIFICATIONS_COLLECTION,
      ABOUT_CERTIFICATIONS_DOC_ID,
    ),
  )
  if (!snap.exists()) return null
  return normalizeAboutCertificationsContent(
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

export type SaveAboutCertificationsContentInput = {
  title: BilingualText
  points: Array<{ id?: string; text: BilingualText }>
  updatedBy?: string
}

export async function saveAboutCertificationsContent(
  input: SaveAboutCertificationsContentInput,
): Promise<AboutCertificationsContent> {
  const points: AboutCertificationPoint[] = []
  for (const point of input.points) {
    const text = mirrorBilingual(point.text.en, point.text.ar)
    if (!text) continue
    points.push({
      id: point.id?.trim() || allocateFirestoreId("point"),
      text,
    })
  }

  if (points.length === 0) {
    throw new Error("Add at least one certification point")
  }
  if (points.length > ABOUT_CERTIFICATIONS_POINTS_MAX) {
    throw new Error(
      `Maximum of ${ABOUT_CERTIFICATIONS_POINTS_MAX} certification points`,
    )
  }

  const now = new Date().toISOString()
  const existingSnap = await getDoc(
    doc(
      getDb(),
      ABOUT_CERTIFICATIONS_COLLECTION,
      ABOUT_CERTIFICATIONS_DOC_ID,
    ),
  )
  const existingUpdatedBy = existingSnap.exists()
    ? asString(
        (existingSnap.data() as Record<string, unknown>).updatedBy,
      ) || undefined
    : undefined

  const record: AboutCertificationsContent = {
    id: ABOUT_CERTIFICATIONS_DOC_ID,
    title: requireBilingual(input.title.en, input.title.ar, "Title"),
    points,
    updatedAt: now,
    updatedBy: input.updatedBy || existingUpdatedBy,
  }

  await setDoc(
    doc(
      getDb(),
      ABOUT_CERTIFICATIONS_COLLECTION,
      ABOUT_CERTIFICATIONS_DOC_ID,
    ),
    stripUndefined({ ...record }),
  )
  return record
}
