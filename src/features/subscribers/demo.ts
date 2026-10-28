import type { UserStatus } from "@/types/user"
import { currentSubscriptionFor } from "@/features/subscriptions/demo"

export type DemoSubscriber = {
  id: string
  displayName: string
  email: string
  phone: string
  status: UserStatus
  locale: "en" | "ar"
  createdAt: string
  heightCm?: number
  sex?: "male" | "female"
  goal?: { en: string; ar: string }
  coachNotes?: { en: string; ar: string }
}

export const DEMO_SUBSCRIBERS: DemoSubscriber[] = [
  {
    id: "sub-alex",
    displayName: "Alex Haddad",
    email: "alex@trainer.app",
    phone: "+20 100 111 2233",
    status: "active",
    locale: "en",
    createdAt: "2026-04-01T00:00:00.000Z",
    heightCm: 178,
    sex: "male",
    goal: { en: "Fat loss while keeping strength", ar: "خسارة دهون مع الحفاظ على القوة" },
    coachNotes: {
      en: "On Transform. Sleep is the limiter — keep the cut, do not drop protein.",
      ar: "على باقة تحوّل. النوم هو العائق — أبقِ القص دون خفض البروتين.",
    },
  },
  {
    id: "sub-sara",
    displayName: "Sara Mostafa",
    email: "sara@trainer.app",
    phone: "+20 122 445 6677",
    status: "active",
    locale: "ar",
    createdAt: "2026-07-01T00:00:00.000Z",
    heightCm: 165,
    sex: "female",
    goal: { en: "Build a training habit and tone", ar: "بناء عادة تدريب وتنسيق الجسم" },
    coachNotes: {
      en: "Starter 3-day. Last week dropped to 1/3 — nudge her before Friday.",
      ar: "مبتدئ 3 أيام. الأسبوع الماضي 1/3 — تذكير قبل الجمعة.",
    },
  },
  {
    id: "sub-omar",
    displayName: "Omar Fathi",
    email: "omar.f@trainer.app",
    phone: "+20 111 888 9900",
    status: "active",
    locale: "en",
    createdAt: "2026-08-20T00:00:00.000Z",
    heightCm: 182,
    sex: "male",
    goal: { en: "Stay consistent while travelling", ar: "الاستمرار أثناء السفر" },
    coachNotes: {
      en: "Quick start expired. Travel PDF and Ramadan plan are archived — renew before assigning again.",
      ar: "انتهت البداية السريعة. ملفات السفر ورمضان مؤرشفة — جدّد قبل التعيين.",
    },
  },
  {
    id: "sub-layla",
    displayName: "Layla Nasser",
    email: "layla@trainer.app",
    phone: "+20 155 321 0099",
    status: "pending",
    locale: "ar",
    createdAt: "2026-10-22T00:00:00.000Z",
    sex: "female",
    goal: { en: "Requested Transform — waiting on approval", ar: "طلبت باقة تحوّل — بانتظار الموافقة" },
  },
  {
    id: "sub-karim",
    displayName: "Karim Adel",
    email: "karim@trainer.app",
    phone: "+20 128 700 4411",
    status: "suspended",
    locale: "en",
    createdAt: "2026-06-10T00:00:00.000Z",
    heightCm: 175,
    sex: "male",
    goal: { en: "Elite coaching — paused", ar: "تدريب نخبة — متوقف" },
    coachNotes: {
      en: "Paused at his request. Last check-in July. Do not assign programs until reactivated.",
      ar: "إيقاف بطلبه. آخر تسجيل في يوليو. لا تعيّن برامج قبل إعادة التفعيل.",
    },
  },
  {
    id: "sub-nina",
    displayName: "Nina Farouk",
    email: "nina@trainer.app",
    phone: "+20 101 555 7788",
    status: "active",
    locale: "en",
    createdAt: "2026-09-15T00:00:00.000Z",
    heightCm: 162,
    sex: "female",
    goal: { en: "Lean muscle — weight going up is expected", ar: "عضل نحيف — ارتفاع الوزن متوقع" },
    coachNotes: {
      en: "Nutrition only for now. Adherence slipping under 70% — check grocery swaps.",
      ar: "تغذية فقط حالياً. الالتزام تحت 70٪ — راجع بدائل البقالة.",
    },
  },
  {
    id: "sub-hassan",
    displayName: "Hassan Youssef",
    email: "hassan@trainer.app",
    phone: "+20 114 222 3366",
    status: "rejected",
    locale: "ar",
    createdAt: "2026-05-02T00:00:00.000Z",
    goal: { en: "Application was not approved", ar: "لم يُقبل الطلب" },
  },
]

export function getSubscriberById(id: string) {
  return DEMO_SUBSCRIBERS.find((item) => item.id === id)
}

export function subscriberRow(subscriber: DemoSubscriber) {
  const subscription = currentSubscriptionFor(subscriber.id)
  return { ...subscriber, subscription }
}
