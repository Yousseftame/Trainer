import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { allocateFirestoreId } from "@/lib/firebase/ids"
import type { BilingualText } from "@/types/program"
import type { FaqItem } from "@/types/website"

export const FAQ_COLLECTION = "website_faq_items"
export const FAQ_FEATURED_MAX = 5

/** Static fallbacks when CMS is empty — matches current public i18n defaults. */
export const DEFAULT_FAQ_ITEMS: Array<{
  id: string
  question: BilingualText
  answer: BilingualText
  featured: boolean
  order: number
}> = [
  {
    id: "plan",
    featured: true,
    order: 0,
    question: {
      en: "How do I choose the right plan for me?",
      ar: "كيف أختار الخطة المناسبة لي؟",
    },
    answer: {
      en: "We recommend starting with a consultation to discuss your fitness goals and preferences. This way, we can tailor a plan that suits your individual needs.",
      ar: "نوصي بالبدء باستشارة لمناقشة أهدافك وتفضيلاتك في اللياقة. بهذا نتمكن من تصميم خطة تناسب احتياجاتك الفردية.",
    },
  },
  {
    id: "missed",
    featured: true,
    order: 1,
    question: {
      en: "What if I miss a scheduled training session?",
      ar: "ماذا لو فاتتني جلسة تدريب مجدولة؟",
    },
    answer: {
      en: "If you miss a scheduled training session, please contact your trainer as soon as possible to discuss rescheduling options. We understand that life can be unpredictable, and we are here to help you stay on track with your fitness goals.",
      ar: "إذا فاتتك جلسة تدريب مجدولة، يرجى التواصل مع مدربك في أقرب وقت ممكن لمناقشة خيارات إعادة الجدولة. نتفهم أن الحياة قد تكون غير متوقعة، ونحن هنا لمساعدتك على البقاء على المسار.",
    },
  },
  {
    id: "switch",
    featured: true,
    order: 2,
    question: {
      en: "Can I switch my plan later?",
      ar: "هل يمكنني تغيير خطتي لاحقاً؟",
    },
    answer: {
      en: "Yes, you can switch your plan at any time. We understand that your needs may change, and we are flexible in accommodating those changes to ensure you have the best experience.",
      ar: "نعم، يمكنك تغيير خطتك في أي وقت. نتفهم أن احتياجاتك قد تتغير، ونحن مرنون في استيعاب تلك التغييرات لضمان أفضل تجربة لك.",
    },
  },
  {
    id: "support",
    featured: true,
    order: 3,
    question: {
      en: "How do I contact my trainer for support?",
      ar: "كيف أتواصل مع مدربي للحصول على الدعم؟",
    },
    answer: {
      en: "You can contact your trainer for support by sending them an email or a message through the training app. They are available to assist you with any questions or concerns you may have.",
      ar: "يمكنك التواصل مع مدربك عبر البريد الإلكتروني أو رسالة من خلال تطبيق التدريب. هم متاحون لمساعدتك في أي أسئلة أو استفسارات.",
    },
  },
  {
    id: "commit",
    featured: true,
    order: 4,
    question: {
      en: "Are there any long-term commitments?",
      ar: "هل هناك التزامات طويلة الأمد؟",
    },
    answer: {
      en: "No, there are no long-term commitments required. You have the flexibility to choose a plan that fits your current needs and can adjust or cancel at any time.",
      ar: "لا، لا توجد التزامات طويلة الأمد مطلوبة. لديك المرونة لاختيار خطة تناسب احتياجاتك الحالية ويمكنك التعديل أو الإلغاء في أي وقت.",
    },
  },
]

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

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
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

export function normalizeFaqItem(
  id: string,
  raw: Record<string, unknown> | null | undefined,
): FaqItem {
  const now = new Date().toISOString()
  return {
    id,
    question: normalizeBilingual(raw?.question),
    answer: normalizeBilingual(raw?.answer),
    featured: asBool(raw?.featured, false),
    order: asNumber(raw?.order, 0),
    createdAt: asString(raw?.createdAt, now),
    updatedAt: asString(raw?.updatedAt, now),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

function sortFaqItems(items: FaqItem[]): FaqItem[] {
  return [...items].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}

export function isFaqItemComplete(item: FaqItem): boolean {
  return Boolean(
    (item.question.en.trim() || item.question.ar.trim()) &&
      (item.answer.en.trim() || item.answer.ar.trim()),
  )
}

/** Featured items for home FaqSection (max 5), ordered. */
export function pickFeaturedFaqItems(items: FaqItem[]): FaqItem[] {
  return sortFaqItems(
    items.filter((item) => item.featured && isFaqItemComplete(item)),
  ).slice(0, FAQ_FEATURED_MAX)
}

export async function fetchFaqItems(options?: {
  publicOnly?: boolean
}): Promise<FaqItem[]> {
  const snap = await getDocs(collection(getDb(), FAQ_COLLECTION))
  let items = snap.docs.map((d) =>
    normalizeFaqItem(d.id, d.data() as Record<string, unknown>),
  )
  if (options?.publicOnly) {
    items = items.filter(isFaqItemComplete)
  }
  return sortFaqItems(items)
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

export type SaveFaqItemInput = {
  id?: string
  question: BilingualText
  answer: BilingualText
  featured?: boolean
  order?: number
  updatedBy?: string
}

export async function saveFaqItem(input: SaveFaqItemInput): Promise<FaqItem> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = input.id
    ? await getDoc(doc(db, FAQ_COLLECTION, input.id))
    : null
  const existing =
    existingSnap?.exists()
      ? normalizeFaqItem(
          existingSnap.id,
          existingSnap.data() as Record<string, unknown>,
        )
      : null

  const id = existing?.id ?? allocateFirestoreId(FAQ_COLLECTION)
  const question = requireBilingual(
    input.question.en,
    input.question.ar,
    "Question",
  )
  const answer = requireBilingual(input.answer.en, input.answer.ar, "Answer")

  let featured = input.featured ?? existing?.featured ?? false
  if (featured) {
    const all = await fetchFaqItems()
    const featuredCount = all.filter(
      (item) => item.featured && item.id !== id,
    ).length
    if (featuredCount >= FAQ_FEATURED_MAX) {
      throw new Error(
        `Maximum of ${FAQ_FEATURED_MAX} featured questions on the home FAQ section`,
      )
    }
  }

  let order = input.order ?? existing?.order
  if (order == null) {
    const all = await fetchFaqItems()
    order = all.length === 0 ? 0 : Math.max(...all.map((item) => item.order)) + 1
  }

  const record: FaqItem = {
    id,
    question,
    answer,
    featured,
    order,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(doc(db, FAQ_COLLECTION, id), stripUndefined({ ...record }))
  return record
}

export async function setFaqItemFeatured(
  id: string,
  featured: boolean,
  updatedBy?: string,
): Promise<void> {
  const db = getDb()
  const snap = await getDoc(doc(db, FAQ_COLLECTION, id))
  if (!snap.exists()) throw new Error("FAQ item not found")
  const existing = normalizeFaqItem(
    snap.id,
    snap.data() as Record<string, unknown>,
  )

  if (featured && !existing.featured) {
    const all = await fetchFaqItems()
    const featuredCount = all.filter(
      (item) => item.featured && item.id !== id,
    ).length
    if (featuredCount >= FAQ_FEATURED_MAX) {
      throw new Error(
        `Maximum of ${FAQ_FEATURED_MAX} featured questions on the home FAQ section`,
      )
    }
  }

  await setDoc(
    doc(db, FAQ_COLLECTION, id),
    stripUndefined({
      ...existing,
      featured,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || existing.updatedBy,
    }),
  )
}

export async function reorderFaqItems(
  orderedIds: string[],
  updatedBy?: string,
): Promise<void> {
  if (orderedIds.length === 0) return
  const db = getDb()
  const batch = writeBatch(db)
  const now = new Date().toISOString()
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, FAQ_COLLECTION, id), {
      order: index,
      updatedAt: now,
      ...(updatedBy ? { updatedBy } : {}),
    })
  })
  await batch.commit()
}

export async function deleteFaqItem(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), FAQ_COLLECTION, id))
}
