import type { UserStatus } from "@/types/user"
import { currentSubscriptionFor } from "@/features/subscriptions/demo"

export type DemoSubscriber = {
  id: string
  displayName: string
  name?: { en: string; ar: string }
  email: string
  phone: string
  status: UserStatus
  locale: "en" | "ar"
  createdAt: string
  updatedAt?: string
  heightCm?: number
  age?: number
  startingWeightKg?: number
  targetWeightKg?: number
  sex?: "male" | "female"
  goal?: { en: string; ar: string }
  healthNotes?: { en: string; ar: string }
  coachNotes?: { en: string; ar: string }
  preferredPackageId?: string
  registrationRequestId?: string
}

export function subscriberDisplayName(
  subscriber: Pick<DemoSubscriber, "displayName" | "name"> | undefined | null,
  locale: "en" | "ar",
): string {
  if (!subscriber) return "—"
  return subscriber.name?.[locale]?.trim() || subscriber.displayName
}

export const DEMO_SUBSCRIBERS: DemoSubscriber[] = [
  {
    id: "sub-alex",
    displayName: "Alex Haddad",
    name: { en: "Alex Haddad", ar: "أليكس حداد" },
    email: "alex@trainer.app",
    phone: "+20 100 111 2233",
    status: "active",
    locale: "en",
    createdAt: "2026-04-01T00:00:00.000Z",
    heightCm: 178,
    age: 31,
    startingWeightKg: 88,
    targetWeightKg: 79,
    sex: "male",
    goal: { en: "Fat loss while keeping strength", ar: "خسارة دهون مع الحفاظ على القوة" },
    healthNotes: {
      en: "Mild right shoulder impingement on overhead press — use neutral grip.",
      ar: "احتكاك خفيف في الكتف الأيمن عند الدفع العلوي — استخدم قبضة محايدة.",
    },
    coachNotes: {
      en: "On Transform. Sleep is the limiter — keep the cut, do not drop protein.",
      ar: "على باقة تحوّل. النوم هو العائق — أبقِ القص دون خفض البروتين.",
    },
    preferredPackageId: "pkg-transform",
    registrationRequestId: "req-alex",
  },
  {
    id: "sub-sara",
    displayName: "Sara Mostafa",
    name: { en: "Sara Mostafa", ar: "سارة مصطفى" },
    email: "sara@trainer.app",
    phone: "+20 122 445 6677",
    status: "active",
    locale: "ar",
    createdAt: "2026-07-01T00:00:00.000Z",
    heightCm: 165,
    age: 27,
    startingWeightKg: 68,
    targetWeightKg: 61,
    sex: "female",
    goal: { en: "Build a training habit and tone", ar: "بناء عادة تدريب وتنسيق الجسم" },
    healthNotes: {
      en: "No joint restrictions.",
      ar: "لا توجد إصابات أو قيود في المفاصل.",
    },
    coachNotes: {
      en: "Starter 3-day. Last week dropped to 1/3 — nudge her before Friday.",
      ar: "مبتدئ 3 أيام. الأسبوع الماضي 1/3 — تذكير قبل الجمعة.",
    },
    preferredPackageId: "pkg-quick",
  },
  {
    id: "sub-omar",
    displayName: "Omar Fathi",
    name: { en: "Omar Fathi", ar: "عمر فتحي" },
    email: "omar.f@trainer.app",
    phone: "+20 111 888 9900",
    status: "active",
    locale: "en",
    createdAt: "2026-08-20T00:00:00.000Z",
    heightCm: 182,
    age: 34,
    startingWeightKg: 91,
    targetWeightKg: 84,
    sex: "male",
    goal: { en: "Stay consistent while travelling", ar: "الاستمرار أثناء السفر" },
    coachNotes: {
      en: "Quick start expired. Travel PDF and Ramadan plan are archived — renew before assigning again.",
      ar: "انتهت البداية السريعة. ملفات السفر ورمضان مؤرشفة — جدّد قبل التعيين.",
    },
    preferredPackageId: "pkg-quick",
  },
  {
    id: "sub-layla",
    displayName: "Layla Nasser",
    name: { en: "Layla Nasser", ar: "ليلى ناصر" },
    email: "layla@trainer.app",
    phone: "+20 155 321 0099",
    status: "pending",
    locale: "ar",
    createdAt: "2026-10-22T00:00:00.000Z",
    age: 29,
    sex: "female",
    goal: { en: "Requested Transform — waiting on approval", ar: "طلبت باقة تحوّل — بانتظار الموافقة" },
    preferredPackageId: "pkg-transform",
    registrationRequestId: "req-layla",
  },
  {
    id: "sub-karim",
    displayName: "Karim Adel",
    name: { en: "Karim Adel", ar: "كريم عادل" },
    email: "karim@trainer.app",
    phone: "+20 128 700 4411",
    status: "suspended",
    locale: "en",
    createdAt: "2026-06-10T00:00:00.000Z",
    heightCm: 175,
    age: 36,
    startingWeightKg: 85,
    targetWeightKg: 78,
    sex: "male",
    goal: { en: "Elite coaching — paused", ar: "تدريب نخبة — متوقف" },
    coachNotes: {
      en: "Paused at his request. Last check-in July. Do not assign programs until reactivated.",
      ar: "إيقاف بطلبه. آخر تسجيل في يوليو. لا تعيّن برامج قبل إعادة التفعيل.",
    },
    preferredPackageId: "pkg-elite",
  },
  {
    id: "sub-nina",
    displayName: "Nina Farouk",
    name: { en: "Nina Farouk", ar: "نينا فاروق" },
    email: "nina@trainer.app",
    phone: "+20 101 555 7788",
    status: "active",
    locale: "en",
    createdAt: "2026-09-15T00:00:00.000Z",
    heightCm: 162,
    age: 25,
    startingWeightKg: 56,
    targetWeightKg: 60,
    sex: "female",
    goal: { en: "Lean muscle — weight going up is expected", ar: "عضل نحيف — ارتفاع الوزن متوقع" },
    coachNotes: {
      en: "Nutrition only for now. Adherence slipping under 70% — check grocery swaps.",
      ar: "تغذية فقط حالياً. الالتزام تحت 70٪ — راجع بدائل البقالة.",
    },
    preferredPackageId: "pkg-transform",
  },
  {
    id: "sub-hassan",
    displayName: "Hassan Youssef",
    name: { en: "Hassan Youssef", ar: "حسن يوسف" },
    email: "hassan@trainer.app",
    phone: "+20 114 222 3366",
    status: "rejected",
    locale: "ar",
    createdAt: "2026-05-02T00:00:00.000Z",
    age: 42,
    sex: "male",
    goal: { en: "Application was not approved", ar: "لم يُقبل الطلب" },
    preferredPackageId: "pkg-elite",
    registrationRequestId: "req-hassan",
  },
]

export function getSubscriberById(id: string) {
  return DEMO_SUBSCRIBERS.find((item) => item.id === id)
}

export function getSubscriberByEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return undefined
  return DEMO_SUBSCRIBERS.find(
    (item) => item.email.trim().toLowerCase() === normalized,
  )
}

export function subscriberRow(subscriber: DemoSubscriber) {
  const subscription = currentSubscriptionFor(subscriber.id)
  return { ...subscriber, subscription }
}
