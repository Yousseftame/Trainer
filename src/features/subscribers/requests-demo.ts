export type RegistrationRequestStatus = "pending" | "approved" | "rejected"

export type DemoRegistrationRequest = {
  id: string
  displayName: string
  email: string
  phone: string
  locale: "en" | "ar"
  packageId: string | null
  goal: { en: string; ar: string }
  source: "contact" | "manual"
  status: RegistrationRequestStatus
  createdAt: string
  reviewedAt: string | null
}

export const DEMO_REGISTRATION_REQUESTS: DemoRegistrationRequest[] = [
  {
    id: "req-layla",
    displayName: "Layla Nasser",
    email: "layla@trainer.app",
    phone: "+20 155 321 0099",
    locale: "ar",
    packageId: "pkg-transform",
    goal: {
      en: "I want a 12-week plan after having a baby. Looking for nutrition support and 3 workouts a week.",
      ar: "أريد خطة لـ 12 أسبوعاً بعد الولادة. أحتاج دعماً غذائياً و3 تمارين أسبوعياً.",
    },
    source: "contact",
    status: "pending",
    createdAt: "2026-10-22T09:20:00.000Z",
    reviewedAt: null,
  },
  {
    id: "req-yara",
    displayName: "Yara Selim",
    email: "yara.selim@mail.com",
    phone: "+20 100 442 1188",
    locale: "en",
    packageId: "pkg-elite",
    goal: {
      en: "Training for a May race. Need 1:1 form checks and a structured strength plan.",
      ar: "أستعد لسباق في مايو. أحتاج مراجعة الأداء وخطة قوة منظمة.",
    },
    source: "contact",
    status: "pending",
    createdAt: "2026-10-26T14:05:00.000Z",
    reviewedAt: null,
  },
  {
    id: "req-tamer",
    displayName: "Tamer Fouad",
    email: "tamer.f@mail.com",
    phone: "+20 122 900 3310",
    locale: "ar",
    packageId: "pkg-quick",
    goal: {
      en: "Just starting. Want a consultation first to see if coaching is a fit.",
      ar: "أبدأ الآن. أريد استشارة أولاً لمعرفة إن كان التدريب مناسباً لي.",
    },
    source: "contact",
    status: "pending",
    createdAt: "2026-10-27T08:40:00.000Z",
    reviewedAt: null,
  },
  {
    id: "req-alex",
    displayName: "Alex Haddad",
    email: "alex@trainer.app",
    phone: "+20 100 111 2233",
    locale: "en",
    packageId: "pkg-transform",
    goal: {
      en: "Rebuild consistency after travel. Prefer evening sessions.",
      ar: "أريد العودة للانتظام بعد السفر. أفضل التمرين مساءً.",
    },
    source: "contact",
    status: "approved",
    createdAt: "2026-04-01T00:00:00.000Z",
    reviewedAt: "2026-04-02T10:00:00.000Z",
  },
  {
    id: "req-hassan",
    displayName: "Hassan Youssef",
    email: "hassan@trainer.app",
    phone: "+20 114 222 3366",
    locale: "ar",
    packageId: "pkg-elite",
    goal: {
      en: "Asked for medical rehab programming. Out of current coaching scope.",
      ar: "طلب برنامج تأهيل طبي. خارج نطاق التدريب الحالي.",
    },
    source: "contact",
    status: "rejected",
    createdAt: "2026-05-02T00:00:00.000Z",
    reviewedAt: "2026-05-03T12:00:00.000Z",
  },
]
