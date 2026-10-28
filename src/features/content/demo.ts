import { DEMO_NUTRITION } from "@/features/nutrition/demo"
import { getSubscriberById } from "@/features/subscribers/demo"
import { getPackageById } from "@/features/subscriptions/demo"
import { DEMO_WORKOUTS } from "@/features/workouts/demo"
import type {
  ContentCategory,
  ContentKind,
  ContentVisibility,
  VideoProviderId,
} from "@/types/content"

export type DemoContentAsset = {
  id: string
  category: ContentCategory
  kind: ContentKind
  title: { en: string; ar: string }
  description: { en: string; ar: string }
  fileName?: string
  tags: string[]
  visibility: ContentVisibility
  sizeLabel: string
  durationSeconds?: number
  pageCount?: number
  videoProvider?: VideoProviderId
  videoAssetId?: string
  storagePath?: string
  packageIds: string[]
  subscriberIds: string[]
  createdAt: string
  updatedAt: string
}

export type ContentFilter = "all" | ContentCategory

export const DEMO_CONTENT: DemoContentAsset[] = [
  {
    id: "vid-bench",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Barbell bench press", ar: "ضغط بنش بالبار" },
    description: {
      en: "Setup, bar path, and tempo for the bench press cue used in hypertrophy days.",
      ar: "الوضع ومسار البار والإيقاع لإشارة ضغط البنش في أيام التضخم.",
    },
    tags: ["chest", "barbell", "push"],
    visibility: "library",
    sizeLabel: "186 MB",
    durationSeconds: 48,
    videoProvider: "stub",
    videoAssetId: "bnny_bench_01",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "vid-ohp",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Seated dumbbell press", ar: "ضغط دمبل جالس" },
    description: {
      en: "Overhead press from a seated position — brace, lock, and avoid flaring the ribs.",
      ar: "ضغط علوي من الجلوس — تثبيت الجذع دون فتح الأضلاع.",
    },
    tags: ["shoulders", "dumbbell", "push"],
    visibility: "library",
    sizeLabel: "142 MB",
    durationSeconds: 36,
    videoProvider: "stub",
    videoAssetId: "bnny_ohp_01",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-09-18T00:00:00.000Z",
  },
  {
    id: "vid-row",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Chest-supported row", ar: "تجديف بدعم الصدر" },
    description: {
      en: "Row with the chest on the pad so the lower back stays out of the lift.",
      ar: "تجديف مع دعم الصدر حتى لا يدخل أسفل الظهر في الرفع.",
    },
    tags: ["back", "row", "pull"],
    visibility: "library",
    sizeLabel: "168 MB",
    durationSeconds: 41,
    videoProvider: "stub",
    videoAssetId: "bnny_row_01",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "vid-face",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Face pull", ar: "سحب للوجه" },
    description: {
      en: "External rotation at the end of each rep. Used as a pull-day finisher.",
      ar: "دوران خارجي في نهاية كل تكرار. يُستخدم كختام ليوم السحب.",
    },
    tags: ["rear delt", "cable", "pull"],
    visibility: "library",
    sizeLabel: "94 MB",
    durationSeconds: 29,
    videoProvider: "stub",
    videoAssetId: "bnny_face_01",
    packageIds: ["pkg-elite"],
    subscriberIds: [],
    createdAt: "2026-07-08T00:00:00.000Z",
    updatedAt: "2026-08-30T00:00:00.000Z",
  },
  {
    id: "vid-squat",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Back squat", ar: "سكوات خلفي" },
    description: {
      en: "Brace, sit between the hips, drive through mid-foot. Linked to hypertrophy legs.",
      ar: "تثبيت الجذع والهبوط بين الوركين والدفع من منتصف القدم.",
    },
    tags: ["legs", "barbell", "squat"],
    visibility: "library",
    sizeLabel: "214 MB",
    durationSeconds: 52,
    videoProvider: "stub",
    videoAssetId: "bnny_squat_01",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    createdAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "vid-rdl",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Romanian deadlift", ar: "ديدليفت روماني" },
    description: {
      en: "Reusable cue video. Not attached to a program yet — ready to link on a legs day.",
      ar: "فيديو تعليمي قابل لإعادة الاستخدام. غير مربوط ببرنامج بعد.",
    },
    tags: ["hamstring", "hinge", "barbell"],
    visibility: "library",
    sizeLabel: "176 MB",
    durationSeconds: 44,
    videoProvider: "stub",
    videoAssetId: "bnny_rdl_01",
    packageIds: [],
    subscriberIds: [],
    createdAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
  },
  {
    id: "pdf-travel",
    category: "workoutPdf",
    kind: "pdf",
    title: { en: "Travel workouts", ar: "تمارين السفر" },
    description: {
      en: "Hotel and bodyweight block used as a PDF program template and Omar’s archived copy.",
      ar: "بلوك وزن الجسم والفنادق المستخدم كقالب PDF ونسخة عمر المؤرشفة.",
    },
    fileName: "Travel_Workouts_v2.pdf",
    tags: ["travel", "bodyweight", "pdf"],
    visibility: "assigned",
    sizeLabel: "2.4 MB",
    pageCount: 12,
    storagePath: "content/pdfs/Travel_Workouts_v2.pdf",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
  },
  {
    id: "pdf-home",
    category: "workoutPdf",
    kind: "pdf",
    title: { en: "Home dumbbell circuit", ar: "دائرة دمبل منزلية" },
    description: {
      en: "Reusable home session PDF. Not assigned yet — drop onto a subscriber when travel is unplanned.",
      ar: "ملف تمارين منزلية قابل لإعادة الاستخدام. غير معيَّن بعد.",
    },
    fileName: "Home_Dumbbell_Circuit.pdf",
    tags: ["home", "dumbbell", "pdf"],
    visibility: "library",
    sizeLabel: "1.1 MB",
    pageCount: 6,
    storagePath: "content/pdfs/Home_Dumbbell_Circuit.pdf",
    packageIds: [],
    subscriberIds: [],
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "pdf-ramadan",
    category: "nutritionPdf",
    kind: "pdf",
    title: { en: "Ramadan nutrition guide", ar: "دليل تغذية رمضان" },
    description: {
      en: "Trainer-approved fasting meal notes. Template plus Omar’s previous assignment.",
      ar: "ملاحظات وجبات الصيام المعتمدة من المدرب. القالب ونسخة عمر السابقة.",
    },
    fileName: "Ramadan_Nutrition_v1.pdf",
    tags: ["ramadan", "fasting", "nutrition"],
    visibility: "assigned",
    sizeLabel: "3.8 MB",
    pageCount: 18,
    storagePath: "content/pdfs/Ramadan_Nutrition_v1.pdf",
    packageIds: ["pkg-elite"],
    subscriberIds: [],
    createdAt: "2026-02-20T00:00:00.000Z",
    updatedAt: "2026-03-02T00:00:00.000Z",
  },
  {
    id: "pdf-grocery",
    category: "nutritionPdf",
    kind: "pdf",
    title: { en: "Grocery swap list", ar: "قائمة بدائل البقالة" },
    description: {
      en: "Food swaps the trainer approves when a listed item is missing. Reusable nutrition PDF.",
      ar: "بدائل غذائية يعتمدها المدرب عند غياب صنف. ملف تغذية قابل لإعادة الاستخدام.",
    },
    fileName: "Grocery_Swap_List.pdf",
    tags: ["grocery", "swaps", "nutrition"],
    visibility: "library",
    sizeLabel: "860 KB",
    pageCount: 4,
    storagePath: "content/pdfs/Grocery_Swap_List.pdf",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    createdAt: "2026-08-22T00:00:00.000Z",
    updatedAt: "2026-08-22T00:00:00.000Z",
  },
  {
    id: "doc-warmup",
    category: "education",
    kind: "document",
    title: { en: "Warm-up protocol", ar: "بروتوكول الإحماء" },
    description: {
      en: "Educational document covering general warm-up before any assigned session.",
      ar: "مستند تعليمي للإحماء العام قبل أي حصة معيّنة.",
    },
    fileName: "Warmup_Protocol.pdf",
    tags: ["warmup", "mobility", "education"],
    visibility: "assigned",
    sizeLabel: "720 KB",
    pageCount: 5,
    storagePath: "content/docs/Warmup_Protocol.pdf",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: ["sub-sara", "sub-alex"],
    createdAt: "2026-04-15T00:00:00.000Z",
    updatedAt: "2026-07-03T00:00:00.000Z",
  },
  {
    id: "doc-cues",
    category: "education",
    kind: "document",
    title: { en: "Squat cue sheet", ar: "ورقة إشارات السكوات" },
    description: {
      en: "Short coaching cues subscribers can re-read next to the squat video.",
      ar: "إشارات تدريب مختصرة يمكن للمشترك مراجعتها بجانب فيديو السكوات.",
    },
    fileName: "Cue_Sheet_Squat.pdf",
    tags: ["cues", "squat", "education"],
    visibility: "library",
    sizeLabel: "410 KB",
    pageCount: 2,
    storagePath: "content/docs/Cue_Sheet_Squat.pdf",
    packageIds: ["pkg-elite"],
    subscriberIds: [],
    createdAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
  },
  {
    id: "ref-equip",
    category: "reference",
    kind: "document",
    title: { en: "Studio equipment list", ar: "قائمة معدات الاستوديو" },
    description: {
      en: "Internal reference of what is available on the gym floor. Staff-facing.",
      ar: "مرجع داخلي لمعدات صالة التدريب. مخصص للفريق.",
    },
    fileName: "Studio_Equipment.pdf",
    tags: ["equipment", "studio", "reference"],
    visibility: "library",
    sizeLabel: "540 KB",
    pageCount: 3,
    storagePath: "content/refs/Studio_Equipment.pdf",
    packageIds: [],
    subscriberIds: [],
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ref-usage",
    category: "reference",
    kind: "document",
    title: { en: "Content usage notes", ar: "ملاحظات استخدام المحتوى" },
    description: {
      en: "How staff may share files. Reminds that URLs stay signed and printing is off for subscribers.",
      ar: "كيف يشارك الفريق الملفات. التذكير بأن الروابط مؤقتة والطباعة غير متاحة للمشتركين.",
    },
    fileName: "Content_Usage_Notes.pdf",
    tags: ["policy", "ip", "reference"],
    visibility: "library",
    sizeLabel: "280 KB",
    pageCount: 3,
    storagePath: "content/refs/Content_Usage_Notes.pdf",
    packageIds: [],
    subscriberIds: [],
    createdAt: "2026-01-08T00:00:00.000Z",
    updatedAt: "2026-06-16T00:00:00.000Z",
  },
]

export type LinkedProgram = {
  id: string
  title: { en: string; ar: string }
  domain: "workout" | "nutrition"
  status: "template" | "active" | "archived"
  subscriberId?: string
}

export type ContentLinks = {
  programs: LinkedProgram[]
  exercises: string[]
  subscribers: NonNullable<ReturnType<typeof getSubscriberById>>[]
  packages: NonNullable<ReturnType<typeof getPackageById>>[]
}

export function getContentLinks(asset: DemoContentAsset): ContentLinks {
  const programs: LinkedProgram[] = []
  const exercises: string[] = []
  const seenPrograms = new Set<string>()
  const subscriberIds = new Set(asset.subscriberIds)

  if (asset.kind === "video") {
    for (const program of DEMO_WORKOUTS) {
      const matched = program.days.flatMap((day) => day.exercises).filter((ex) => ex.videoContentId === asset.id)
      if (!matched.length) continue
      for (const ex of matched) {
        if (!exercises.includes(ex.name)) exercises.push(ex.name)
      }
      if (!seenPrograms.has(program.id)) {
        seenPrograms.add(program.id)
        programs.push({
          id: program.id,
          title: program.title,
          domain: "workout",
          status: program.status,
          subscriberId: program.subscriberId,
        })
      }
      if (program.subscriberId) subscriberIds.add(program.subscriberId)
    }
  }

  if (asset.fileName) {
    for (const program of DEMO_WORKOUTS) {
      if (program.pdfName?.en !== asset.fileName || seenPrograms.has(program.id)) continue
      seenPrograms.add(program.id)
      programs.push({
        id: program.id,
        title: program.title,
        domain: "workout",
        status: program.status,
        subscriberId: program.subscriberId,
      })
      if (program.subscriberId) subscriberIds.add(program.subscriberId)
    }
    for (const program of DEMO_NUTRITION) {
      if (program.pdfName?.en !== asset.fileName || seenPrograms.has(program.id)) continue
      seenPrograms.add(program.id)
      programs.push({
        id: program.id,
        title: program.title,
        domain: "nutrition",
        status: program.status,
        subscriberId: program.subscriberId,
      })
      if (program.subscriberId) subscriberIds.add(program.subscriberId)
    }
  }

  const subscribers = [...subscriberIds]
    .map((id) => getSubscriberById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const packages = asset.packageIds
    .map((id) => getPackageById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  return { programs, exercises, subscribers, packages }
}

export function isContentLinked(asset: DemoContentAsset) {
  const links = getContentLinks(asset)
  return links.programs.length > 0 || links.subscribers.length > 0
}

export function contentStats(assets: DemoContentAsset[] = DEMO_CONTENT) {
  return {
    videos: assets.filter((item) => item.category === "exerciseVideo").length,
    workoutPdfs: assets.filter((item) => item.category === "workoutPdf").length,
    nutritionPdfs: assets.filter((item) => item.category === "nutritionPdf").length,
    resources: assets.filter((item) => item.category === "education" || item.category === "reference").length,
  }
}
