import type {
  PackageEntitlements,
  PackageTone,
  SubscriberSubscription,
  SubscriptionPackage,
} from "@/types/subscription"

export type { PackageTone }

export type DemoPackage = SubscriptionPackage & {
  featured: boolean
  tone: PackageTone
  price: { en: string; ar: string }
  period: { en: string; ar: string }
  featureList: { en: string[]; ar: string[] }
  entitlements: PackageEntitlements
}

export const DEMO_PACKAGES: DemoPackage[] = [
  {
    id: "pkg-quick",
    name: { en: "Quick start", ar: "بداية سريعة" },
    description: {
      en: "4-week kickstart with a focused plan and check-in.",
      ar: "انطلاقة لمدة 4 أسابيع مع خطة مركّزة ومتابعة.",
    },
    durationDays: 30,
    features: [],
    isActive: true,
    sortOrder: 1,
    featured: false,
    tone: "light",
    price: { en: "EGP 12", ar: "١٢ ج.م" },
    period: { en: "/hour", ar: "/ساعة" },
    featureList: {
      en: [
        "1-hour personalized consultation",
        "Starter workout & nutrition notes",
        "Fitness roadmap for your goal",
      ],
      ar: [
        "استشارة شخصية لمدة ساعة",
        "ملاحظات تمارين وتغذية للبداية",
        "خارطة طريق لهدفك",
      ],
    },
    entitlements: {
      workoutProgram: true,
      nutritionProgram: false,
      exerciseVideos: true,
      pdfDocuments: true,
      progressTracking: true,
    },
  },
  {
    id: "pkg-transform",
    name: { en: "Transform", ar: "تحوّل" },
    description: {
      en: "12-week coaching with workouts, nutrition, and weekly review.",
      ar: "تدريب 12 أسبوعاً مع التمارين والتغذية والمراجعة الأسبوعية.",
    },
    durationDays: 90,
    features: [],
    isActive: true,
    sortOrder: 2,
    featured: true,
    tone: "dark",
    price: { en: "EGP 189", ar: "١٨٩ ج.م" },
    period: { en: "/month", ar: "/شهر" },
    featureList: {
      en: [
        "Customized workout & nutrition plan",
        "Daily support and weekly video calls",
        "Monthly progress reports",
      ],
      ar: [
        "خطة تمارين وتغذية مخصصة",
        "دعم يومي ومكالمات أسبوعية",
        "تقارير تقدم شهرية",
      ],
    },
    entitlements: {
      workoutProgram: true,
      nutritionProgram: true,
      exerciseVideos: true,
      pdfDocuments: true,
      progressTracking: true,
    },
  },
  {
    id: "pkg-elite",
    name: { en: "Elite", ar: "نخبة" },
    description: {
      en: "Premium 1:1 coaching with assessments and VIP workshops.",
      ar: "تدريب خاص مع تقييمات وورش VIP.",
    },
    durationDays: 180,
    features: [],
    isActive: true,
    sortOrder: 3,
    featured: false,
    tone: "sage",
    price: { en: "EGP 299", ar: "٢٩٩ ج.م" },
    period: { en: "/month", ar: "/شهر" },
    featureList: {
      en: [
        "1-on-1 training sessions",
        "Weekly assessments and adjustments",
        "Video feedback on form",
      ],
      ar: [
        "جلسات تدريب فردية",
        "تقييمات وتعديلات أسبوعية",
        "ملاحظات فيديو على الأداء",
      ],
    },
    entitlements: {
      workoutProgram: true,
      nutritionProgram: true,
      exerciseVideos: true,
      pdfDocuments: true,
      progressTracking: true,
    },
  },
  {
    id: "pkg-foundation",
    name: { en: "Foundation", ar: "أساس" },
    description: {
      en: "Archived starter plan — no longer offered to new subscribers.",
      ar: "باقة بداية مؤرشفة — لم تعد تُعرض للمشتركين الجدد.",
    },
    durationDays: 60,
    features: [],
    isActive: false,
    sortOrder: 4,
    featured: false,
    tone: "light",
    price: { en: "EGP 99", ar: "٩٩ ج.م" },
    period: { en: "/month", ar: "/شهر" },
    featureList: {
      en: ["Core workout template", "Basic nutrition PDF"],
      ar: ["قالب تمارين أساسي", "ملف تغذية مبسط"],
    },
    entitlements: {
      workoutProgram: true,
      nutritionProgram: false,
      exerciseVideos: false,
      pdfDocuments: true,
      progressTracking: true,
    },
  },
]

export const DEMO_SUBSCRIPTIONS: SubscriberSubscription[] = [
  {
    id: "sub-01",
    subscriberId: "sub-alex",
    packageId: "pkg-transform",
    status: "active",
    startsAt: "2026-08-12T00:00:00.000Z",
    endsAt: "2026-11-10T00:00:00.000Z",
    activatedBy: "Head Coach",
    notes: "Moved from Quick start after the first month.",
    createdAt: "2026-08-12T00:00:00.000Z",
    updatedAt: "2026-08-12T00:00:00.000Z",
  },
  {
    id: "sub-02",
    subscriberId: "sub-sara",
    packageId: "pkg-elite",
    status: "active",
    startsAt: "2026-07-01T00:00:00.000Z",
    endsAt: "2026-12-28T00:00:00.000Z",
    activatedBy: "Head Coach",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "sub-03",
    subscriberId: "sub-omar",
    packageId: "pkg-quick",
    status: "expired",
    startsAt: "2026-08-20T00:00:00.000Z",
    endsAt: "2026-09-19T00:00:00.000Z",
    activatedBy: "Head Coach",
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-09-19T00:00:00.000Z",
  },
  {
    id: "sub-04",
    subscriberId: "sub-layla",
    packageId: "pkg-transform",
    status: "pending",
    startsAt: null,
    endsAt: null,
    createdAt: "2026-10-22T00:00:00.000Z",
    updatedAt: "2026-10-22T00:00:00.000Z",
  },
  {
    id: "sub-05",
    subscriberId: "sub-karim",
    packageId: "pkg-elite",
    status: "suspended",
    startsAt: "2026-06-10T00:00:00.000Z",
    endsAt: "2026-12-07T00:00:00.000Z",
    activatedBy: "Head Coach",
    notes: "Paused at subscriber request.",
    createdAt: "2026-06-10T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "sub-06",
    subscriberId: "sub-nina",
    packageId: "pkg-transform",
    status: "active",
    startsAt: "2026-09-15T00:00:00.000Z",
    endsAt: "2026-12-14T00:00:00.000Z",
    activatedBy: "Head Coach",
    createdAt: "2026-09-15T00:00:00.000Z",
    updatedAt: "2026-09-15T00:00:00.000Z",
  },
  {
    id: "sub-07",
    subscriberId: "sub-hassan",
    packageId: "pkg-quick",
    status: "cancelled",
    startsAt: "2026-05-02T00:00:00.000Z",
    endsAt: "2026-06-01T00:00:00.000Z",
    activatedBy: "Head Coach",
    createdAt: "2026-05-02T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
  },
  {
    id: "sub-08",
    subscriberId: "sub-alex",
    packageId: "pkg-quick",
    status: "expired",
    startsAt: "2026-04-01T00:00:00.000Z",
    endsAt: "2026-05-01T00:00:00.000Z",
    activatedBy: "Head Coach",
    notes: "4-week kickstart completed. Rolled into Transform.",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
]

export function getPackageById(id: string | null | undefined) {
  if (!id) return undefined
  return DEMO_PACKAGES.find((item) => item.id === id)
}

export function activeSubscribersForPackage(packageId: string) {
  return DEMO_SUBSCRIPTIONS.filter(
    (item) => item.packageId === packageId && item.status === "active",
  ).length
}

export function subscriptionsFor(subscriberId: string) {
  return DEMO_SUBSCRIPTIONS.filter((item) => item.subscriberId === subscriberId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function currentSubscriptionFor(subscriberId: string) {
  const list = subscriptionsFor(subscriberId)
  return (
    list.find((item) => item.status === "active" || item.status === "suspended") ??
    list[0] ??
    null
  )
}

export const getActiveSubscriptionFor = currentSubscriptionFor
