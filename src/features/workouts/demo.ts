import type {
  BilingualText,
  WorkoutDay,
  WorkoutExercise,
  WorkoutProgram,
  WorkoutSessionLog,
} from "@/types/program"

export type DemoWorkoutDay = WorkoutDay
export type DemoWorkoutProgram = WorkoutProgram

const PUSH: WorkoutExercise[] = [
  {
    id: "ex-bp",
    name: "Barbell bench press",
    description: "Control the bar to the chest, drive up without bouncing.",
    sets: 4,
    reps: "8–10",
    restSeconds: 90,
    notes: "Last set RPE 8",
    videoContentId: "vid-bench",
    equipment: "Barbell & Flat Bench",
    alternatives: [
      {
        id: "alt-bp-db",
        name: { en: "Flat Dumbbell Bench Press", ar: "بنش برس مستوي بالدمبلز" },
        reason: {
          en: "No bench press rack available / easier on shoulders",
          ar: "في حال عدم توفر جهاز البنش بالبار أو لتخفيف الحمل على الكتف",
        },
        equipment: "Dumbbells & Flat Bench",
        notes: {
          en: "Tuck elbows at 45 degrees, full stretch at bottom.",
          ar: "اضبط زاوية المرفقين 45 درجة مع تمدد كامل في الأسفل.",
        },
      },
      {
        id: "alt-bp-pushup",
        name: { en: "Deficit Push-ups (or Weighted Push-ups)", ar: "تمرين ضغط مع رفع اليدين على أقراص أوزان" },
        reason: {
          en: "Home workout / machine occupied",
          ar: "بديل بوزن الجسم عند انشغال الأجهزة في الجيم",
        },
        equipment: "Floor / Weight Plates",
        notes: {
          en: "Keep core braced, slow 3-second eccentric tempo.",
          ar: "شد عضلات البطن مع هبوط بطيء في 3 ثوانٍ.",
        },
      },
    ],
  },
  {
    id: "ex-ohp",
    name: "Seated dumbbell press",
    sets: 3,
    reps: "10",
    restSeconds: 75,
    videoContentId: "vid-ohp",
    equipment: "Dumbbells & Incline Bench",
    alternatives: [
      {
        id: "alt-ohp-landmine",
        name: { en: "Half-Kneeling Landmine Press", ar: "دفع أمامي بجهاز اللاندمين نصف راكع" },
        reason: {
          en: "Shoulder impingement or no heavy dumbbells",
          ar: "آمن للكتف في حال وجود احتكاك أو عدم توفر أوزان مناسبة",
        },
        equipment: "Landmine / Barbell",
      },
      {
        id: "alt-ohp-machine",
        name: { en: "Machine Shoulder Press", ar: "جهاز دفع الأكتاف جالس" },
        reason: {
          en: "Safe locked movement path",
          ar: "مسار حركة آمن وثابت",
        },
        equipment: "Shoulder Press Machine",
      },
    ],
  },
  {
    id: "ex-fly",
    name: "Cable fly",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    notes: "Pause 1s at squeeze",
    equipment: "Dual Cable Pulley",
    alternatives: [
      {
        id: "alt-fly-db",
        name: { en: "Flat Bench Dumbbell Flyes", ar: "تفتيح صدر بالدمبلز على بنش مستوي" },
        reason: {
          en: "Cable station occupied",
          ar: "في حال انشغال جهاز الكابل المزدوج",
        },
        equipment: "Dumbbells",
      },
      {
        id: "alt-fly-band",
        name: { en: "Resistance Band Chest Flyes", ar: "تفتيح صدر بحبال المقاومة" },
        reason: {
          en: "Home workout / hotel gym",
          ar: "بديل سريع أثناء السفر أو في المنزل",
        },
        equipment: "Resistance Band",
      },
    ],
  },
]

const PULL: WorkoutExercise[] = [
  {
    id: "ex-row",
    name: "Chest-supported row",
    sets: 4,
    reps: "10",
    restSeconds: 90,
    videoContentId: "vid-row",
    equipment: "Incline Bench & Dumbbells",
    alternatives: [
      {
        id: "alt-row-db",
        name: { en: "One-Arm Dumbbell Row", ar: "تجديف فردي بالدمبل على بنش مستوي" },
        reason: {
          en: "No chest-supported bench available",
          ar: "في حال عدم توفر بنش مائل مدعوم بالصدر",
        },
        equipment: "Dumbbell & Flat Bench",
      },
      {
        id: "alt-row-cable",
        name: { en: "Seated Cable Row (Neutral Grip)", ar: "تجديف بالكابل جالس بقبضة محايدة" },
        reason: {
          en: "Smooth constant tension",
          ar: "مقاومة مستمرة وسلسة على عضلات الظهر",
        },
        equipment: "Cable Machine",
      },
    ],
  },
  {
    id: "ex-lat",
    name: "Lat pulldown",
    sets: 3,
    reps: "10–12",
    restSeconds: 75,
    equipment: "Lat Pulldown Station",
    alternatives: [
      {
        id: "alt-lat-pullup",
        name: { en: "Pull-ups (or Band-Assisted)", ar: "عقلة حرة أو عقلة مدعومة برباط مطاطي" },
        reason: {
          en: "No lat pulldown machine available",
          ar: "في حال عدم توفر جهاز سحب الظهر العالي",
        },
        equipment: "Pull-up Bar",
      },
      {
        id: "alt-lat-kneeling",
        name: { en: "Half-Kneeling Single-Arm Cable Pulldown", ar: "سحب كابل فردي في وضع نصف الركوع" },
        reason: {
          en: "Better lat isolation and stretch",
          ar: "عزل أقوى لعضلة المجنص وتمدد ممتاز",
        },
        equipment: "Cable Pulley",
      },
    ],
  },
  {
    id: "ex-face",
    name: "Face pull",
    sets: 3,
    reps: "15",
    restSeconds: 45,
    notes: "External rotation at the end",
    videoContentId: "vid-face",
    equipment: "Cable Pulley & Rope Attachment",
    alternatives: [
      {
        id: "alt-face-rear",
        name: { en: "Incline Bench Dumbbell Rear Delt Flyes", ar: "رفرفة كتف خلفي بالدمبلز على بنش مائل" },
        reason: {
          en: "Cable pulley station occupied",
          ar: "عند انشغال أجهزة الكابل",
        },
        equipment: "Dumbbells",
      },
    ],
  },
]

const LEGS: WorkoutExercise[] = [
  {
    id: "ex-squat",
    name: "Back squat",
    description: "Brace, sit between the hips, drive through mid-foot.",
    sets: 4,
    reps: "6–8",
    restSeconds: 120,
    videoContentId: "vid-squat",
    equipment: "Squat Rack & Barbell",
    alternatives: [
      {
        id: "alt-squat-goblet",
        name: { en: "Heavy Dumbbell Goblet Squat", ar: "سكوات جوبلت بالدمبل الثقيل" },
        reason: {
          en: "Squat rack occupied or lower back fatigue",
          ar: "في حال انشغال راك السكوات أو إجهاد أسفل الظهر",
        },
        equipment: "Dumbbell / Kettlebell",
      },
      {
        id: "alt-squat-legpress",
        name: { en: "45-Degree Leg Press", ar: "جهاز ضغط الأرجل بزاوية 45 درجة" },
        reason: {
          en: "High quad load without spinal compression",
          ar: "حمل عالي على عضلات الفخذ دون ضغط محوري على الظهر",
        },
        equipment: "Leg Press Machine",
      },
    ],
  },
  {
    id: "ex-rdl",
    name: "Romanian deadlift",
    sets: 3,
    reps: "8",
    restSeconds: 90,
    equipment: "Barbell",
    alternatives: [
      {
        id: "alt-rdl-db",
        name: { en: "Dumbbell Romanian Deadlift", ar: "رومانيان ديدليفت بالدمبلز" },
        reason: {
          en: "Easier bar path / no barbell available",
          ar: "في حال عدم توفر بار حر أو لسهولة توجيه الوزن بجانب الساق",
        },
        equipment: "Dumbbells",
      },
      {
        id: "alt-rdl-cable",
        name: { en: "Cable Pull-Through", ar: "تمرين سحب كابل بين الساقين للألوية والخلفيات" },
        reason: {
          en: "Safe hip hinge without lower back shear",
          ar: "حركة مفصلية للألوية والخلفية بأمان تام على الظهر",
        },
        equipment: "Low Cable & Rope",
      },
    ],
  },
  {
    id: "ex-lunge",
    name: "Walking lunge",
    sets: 3,
    reps: "10/leg",
    restSeconds: 60,
    equipment: "Dumbbells",
    alternatives: [
      {
        id: "alt-lunge-split",
        name: { en: "Bulgarian Split Squat", ar: "سكوات بلغاري أحادي بالدمبلز" },
        reason: {
          en: "Limited gym floor space / knee-friendly",
          ar: "عند ضيق المساحة في الجيم ولتخفيف الضغط على الركبة",
        },
        equipment: "Bench & Dumbbells",
      },
    ],
  },
]

function week(days: Array<Partial<DemoWorkoutDay> & { weekday: number; id: string }>): DemoWorkoutDay[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const found = days.find((day) => day.weekday === weekday)
    return {
      id: found?.id ?? `rest-${weekday}`,
      weekday,
      isRest: found?.isRest ?? !found?.exercises,
      exercises: found?.exercises ?? [],
    }
  })
}

export const DEMO_WORKOUTS: DemoWorkoutProgram[] = [
  {
    id: "tpl-hypertrophy",
    title: { en: "Hypertrophy 4-day", ar: "تضخم 4 أيام" },
    format: "interactive",
    version: 3,
    status: "template",
    updatedAt: "2026-10-18T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
    days: week([
      { id: "d-push", weekday: 0, exercises: PUSH },
      { id: "d-pull", weekday: 1, exercises: PULL },
      { id: "d-rest-1", weekday: 2, isRest: true, exercises: [] },
      { id: "d-legs", weekday: 3, exercises: LEGS },
      { id: "d-upper", weekday: 4, exercises: [...PUSH.slice(0, 2), ...PULL.slice(0, 1)] },
    ]),
  },
  {
    id: "tpl-starter",
    title: { en: "Starter 3-day", ar: "مبتدئ 3 أيام" },
    format: "interactive",
    version: 1,
    status: "template",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
    days: week([
      { id: "s-full-1", weekday: 0, exercises: [LEGS[0], PUSH[0], PULL[0]] },
      { id: "s-full-2", weekday: 2, exercises: [LEGS[1], PUSH[1], PULL[1]] },
      { id: "s-full-3", weekday: 4, exercises: [LEGS[2], PUSH[2], PULL[2]] },
    ]),
  },
  {
    id: "tpl-pdf",
    title: { en: "Travel PDF block", ar: "بلوك سفر PDF" },
    format: "pdf",
    version: 2,
    status: "template",
    createdAt: "2026-04-10T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
    pdfContentId: "pdf-travel",
    pdfName: { en: "Travel_Workouts_v2.pdf", ar: "تمارين_السفر_v2.pdf" },
    days: week([]),
  },
  {
    id: "asg-alex",
    title: { en: "Alex — Hypertrophy 4-day", ar: "أليكس — تضخم 4 أيام" },
    format: "interactive",
    version: 3,
    status: "active",
    subscriberId: "sub-alex",
    templateId: "tpl-hypertrophy",
    createdAt: "2026-06-15T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    completion: { done: 3, total: 4 },
    days: week([
      { id: "a-push", weekday: 0, exercises: PUSH },
      { id: "a-pull", weekday: 1, exercises: PULL },
      { id: "a-legs", weekday: 3, exercises: LEGS },
      { id: "a-upper", weekday: 4, exercises: [...PUSH.slice(0, 2), ...PULL.slice(0, 1)] },
    ]),
  },
  {
    id: "asg-alex-start",
    title: { en: "Alex — Quick start 3-day", ar: "أليكس — بداية سريعة 3 أيام" },
    format: "interactive",
    version: 1,
    status: "archived",
    subscriberId: "sub-alex",
    templateId: "tpl-starter",
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    archivedAt: "2026-06-15T00:00:00.000Z",
    completion: { done: 3, total: 3 },
    days: week([
      { id: "ax-1", weekday: 0, exercises: [LEGS[0], PUSH[0], PULL[0]] },
      { id: "ax-2", weekday: 2, exercises: [LEGS[1], PUSH[1], PULL[1]] },
      { id: "ax-3", weekday: 4, exercises: [LEGS[2], PUSH[2], PULL[2]] },
    ]),
  },
  {
    id: "asg-sara",
    title: { en: "Sara — Starter 3-day", ar: "سارة — مبتدئ 3 أيام" },
    format: "interactive",
    version: 1,
    status: "active",
    subscriberId: "sub-sara",
    templateId: "tpl-starter",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-10-12T00:00:00.000Z",
    completion: { done: 2, total: 3 },
    days: week([
      { id: "sa-1", weekday: 0, exercises: [LEGS[0], PUSH[0], PULL[0]] },
      { id: "sa-2", weekday: 2, exercises: [LEGS[1], PUSH[1], PULL[1]] },
      { id: "sa-3", weekday: 5, exercises: [LEGS[2], PUSH[2], PULL[2]] },
    ]),
  },
  {
    id: "asg-omar",
    title: { en: "Omar — Travel PDF", ar: "عمر — PDF سفر" },
    format: "pdf",
    version: 2,
    status: "archived",
    subscriberId: "sub-omar",
    templateId: "tpl-pdf",
    pdfContentId: "pdf-travel",
    pdfName: { en: "Travel_Workouts_v2.pdf", ar: "تمارين_السفر_v2.pdf" },
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-09-19T00:00:00.000Z",
    archivedAt: "2026-09-19T00:00:00.000Z",
    days: week([]),
  },
]

export const INITIAL_WORKOUT_LOGS: WorkoutSessionLog[] = [
  {
    id: "wlog-1",
    subscriberId: "sub-alex",
    programId: "asg-alex",
    dayId: "a-push",
    weekday: 0,
    date: "2026-10-26",
    durationMinutes: 52,
    perceivedEffort: 8,
    notes: "Solid bench sets, pushed 95kg for 8 reps on final set.",
    completedAt: "2026-10-26T18:40:00.000Z",
  },
  {
    id: "wlog-2",
    subscriberId: "sub-alex",
    programId: "asg-alex",
    dayId: "a-pull",
    weekday: 1,
    date: "2026-10-27",
    durationMinutes: 48,
    perceivedEffort: 7,
    notes: "Row tempo was clean, no lower back fatigue.",
    completedAt: "2026-10-27T19:15:00.000Z",
  },
  {
    id: "wlog-3",
    subscriberId: "sub-sara",
    programId: "asg-sara",
    dayId: "sa-1",
    weekday: 0,
    date: "2026-10-26",
    durationMinutes: 42,
    perceivedEffort: 6,
    notes: "Great squat form, knee tracking was perfect.",
    completedAt: "2026-10-26T17:30:00.000Z",
  },
]

export function resolveBilingualText(
  value: string | BilingualText | undefined,
  locale: "en" | "ar",
  fallback = "",
): string {
  if (!value) return fallback
  if (typeof value === "string") return value
  return value[locale] || value.en || value.ar || fallback
}

export function formatRest(seconds?: number) {
  if (!seconds) return "—"
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m}:${String(s).padStart(2, "0")}` : `${m}:00`
}

export function trainingDayCount(program: DemoWorkoutProgram) {
  return program.days.filter((day) => !day.isRest && day.exercises.length > 0).length
}
