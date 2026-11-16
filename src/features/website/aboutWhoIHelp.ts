import { doc, getDoc, setDoc } from "firebase/firestore"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import type { BilingualText } from "@/types/program"
import type {
  AboutWhoIHelpContent,
  AboutWhoIHelpPoint,
  AboutWhoIHelpPointId,
} from "@/types/website"

export const ABOUT_WHO_I_HELP_COLLECTION = "website_about_who_i_help"
export const ABOUT_WHO_I_HELP_DOC_ID = "config"
export const ABOUT_WHO_I_HELP_POINTS_MAX = 4

export const ABOUT_WHO_I_HELP_POINT_IDS: AboutWhoIHelpPointId[] = [
  "strength",
  "fatLoss",
  "health",
  "athletes",
]

export const DEFAULT_ABOUT_WHO_I_HELP_COPY = {
  title: {
    en: "Built for goals that matter",
    ar: "مصمم لأهداف تستحق",
  },
  points: {
    strength: {
      en: "Build muscle and lasting strength",
      ar: "بناء العضلات والقوة المستدامة",
    },
    fatLoss: {
      en: "Lose fat without burning out",
      ar: "خسارة الدهون دون إرهاق",
    },
    health: {
      en: "Improve energy, posture, and daily health",
      ar: "تحسين الطاقة والقوام والصحة اليومية",
    },
    athletes: {
      en: "Train with structure as a young athlete or adult",
      ar: "تدريب منظم للرياضيين الصغار والكبار",
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

function emptyPoint(id: AboutWhoIHelpPointId): AboutWhoIHelpPoint {
  return {
    id,
    text: { ...DEFAULT_ABOUT_WHO_I_HELP_COPY.points[id] },
  }
}

function normalizePoint(
  id: AboutWhoIHelpPointId,
  raw: Record<string, unknown> | null | undefined,
): AboutWhoIHelpPoint {
  return {
    id,
    text: normalizeBilingual(
      raw?.text,
      DEFAULT_ABOUT_WHO_I_HELP_COPY.points[id],
    ),
  }
}

export function normalizeAboutWhoIHelpContent(
  raw: Record<string, unknown> | null | undefined,
): AboutWhoIHelpContent {
  const pointsRaw = Array.isArray(raw?.points) ? raw.points : []
  const byId = new Map<string, Record<string, unknown>>()
  for (const entry of pointsRaw) {
    if (!entry || typeof entry !== "object") continue
    const row = entry as Record<string, unknown>
    const id = asString(row.id)
    if (ABOUT_WHO_I_HELP_POINT_IDS.includes(id as AboutWhoIHelpPointId)) {
      byId.set(id, row)
    }
  }

  return {
    id: ABOUT_WHO_I_HELP_DOC_ID,
    title: normalizeBilingual(raw?.title, DEFAULT_ABOUT_WHO_I_HELP_COPY.title),
    points: ABOUT_WHO_I_HELP_POINT_IDS.map((id) =>
      normalizePoint(id, byId.get(id) ?? null),
    ),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export function createDefaultAboutWhoIHelpContent(): AboutWhoIHelpContent {
  return {
    id: ABOUT_WHO_I_HELP_DOC_ID,
    title: { ...DEFAULT_ABOUT_WHO_I_HELP_COPY.title },
    points: ABOUT_WHO_I_HELP_POINT_IDS.map((id) => emptyPoint(id)),
    updatedAt: "",
    updatedBy: undefined,
  }
}

export async function fetchAboutWhoIHelpContent(): Promise<AboutWhoIHelpContent | null> {
  const snap = await getDoc(
    doc(getDb(), ABOUT_WHO_I_HELP_COLLECTION, ABOUT_WHO_I_HELP_DOC_ID),
  )
  if (!snap.exists()) return null
  return normalizeAboutWhoIHelpContent(snap.data() as Record<string, unknown>)
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

export type SaveAboutWhoIHelpContentInput = {
  title: BilingualText
  points: Array<{ id: AboutWhoIHelpPointId; text: BilingualText }>
  updatedBy?: string
}

export async function saveAboutWhoIHelpContent(
  input: SaveAboutWhoIHelpContentInput,
): Promise<AboutWhoIHelpContent> {
  const byId = new Map(input.points.map((p) => [p.id, p]))
  const points: AboutWhoIHelpPoint[] = ABOUT_WHO_I_HELP_POINT_IDS.map((id) => {
    const incoming = byId.get(id)
    if (!incoming) throw new Error(`Missing Who I help point: ${id}`)
    return {
      id,
      text: requireBilingual(incoming.text.en, incoming.text.ar, "Point text"),
    }
  })

  const now = new Date().toISOString()
  const existingSnap = await getDoc(
    doc(getDb(), ABOUT_WHO_I_HELP_COLLECTION, ABOUT_WHO_I_HELP_DOC_ID),
  )
  const existingUpdatedBy = existingSnap.exists()
    ? asString(
        (existingSnap.data() as Record<string, unknown>).updatedBy,
      ) || undefined
    : undefined

  const record: AboutWhoIHelpContent = {
    id: ABOUT_WHO_I_HELP_DOC_ID,
    title: requireBilingual(input.title.en, input.title.ar, "Title"),
    points,
    updatedAt: now,
    updatedBy: input.updatedBy || existingUpdatedBy,
  }

  await setDoc(
    doc(getDb(), ABOUT_WHO_I_HELP_COLLECTION, ABOUT_WHO_I_HELP_DOC_ID),
    stripUndefined({ ...record }),
  )
  return record
}
