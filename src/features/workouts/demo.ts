import type {
  BilingualText,
  WorkoutDay,
  WorkoutExercise,
  WorkoutProgram,
  WorkoutSessionLog,
} from "@/types/program"

export type DemoWorkoutDay = WorkoutDay
export type DemoWorkoutProgram = WorkoutProgram

const WARMUP_CARDIO: WorkoutExercise[] = [
  {
    id: "ex-jump-jacks",
    name: { en: "Jump Jacks", ar: "القفز مع فتح الذراعين والقدمين (Jump Jacks)" },
    description: {
      en: "Jump with your legs spread wide and hands touching overhead, then return.",
      ar: "اقفز مع فتح الذراعين والقدمين للأعلى ثم العودة للوضع الابتدائي بإيقاع سريع ومنتظم.",
    },
    sets: 1,
    reps: "max",
    restSeconds: 60,
    videoUrl: "https://www.youtube.com/embed/iSSAk4XCsRA",
    thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
    equipment: "Bodyweight",
    targetMuscles: ["Full Body", "Cardio"],
    notes: {
      en: "Warmup - maintain continuous breathing rhythm",
      ar: "إحماء لكامل الجسم - حافظ على وتيرة تنفس منتظمة",
    },
    alternatives: [
      {
        id: "alt-step-jacks",
        name: { en: "Low Impact Step Jacks", ar: "ستيب جاكس خفيف بدون قفز" },
        reason: {
          en: "Knee discomfort or zero-impact preference",
          ar: "لحماية الركبتين أو تجنب الارتطام",
        },
        equipment: "Bodyweight",
      },
    ],
  },
  {
    id: "ex-arm-circles",
    name: { en: "Forward Arm Circle", ar: "دوائر الذراعين للأمام (Forward Arm Circle)" },
    description: {
      en: "Rotate arms forward in controlled circles to warm up shoulders and rotator cuff.",
      ar: "تدوير الذراعين للأمام بحركة دائرية محكمة لتهيئة الكتفين وأوتار الروتاتور كف.",
    },
    sets: 1,
    reps: "max",
    restSeconds: 60,
    videoUrl: "https://www.youtube.com/embed/140RTNMQQve",
    thumbnailUrl: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?w=400&auto=format&fit=crop&q=80",
    equipment: "Bodyweight",
    targetMuscles: ["Shoulders", "Rotator Cuff"],
    notes: {
      en: "Controlled speed, keep core braced",
      ar: "سرعة متوسطة محكمة مع شد الجذع",
    },
    alternatives: [
      {
        id: "alt-band-pullapart",
        name: { en: "Band Pull-Aparts", ar: "سحب حبل مطاطي للكتف" },
        reason: {
          en: "Gentler on shoulder joints",
          ar: "أكثر ملاءمة لمرونة مفصل الكتف",
        },
        equipment: "Resistance Band",
      },
    ],
  },
  {
    id: "ex-high-knee",
    name: { en: "High Knee", ar: "الجري في المكان برفع الركبتين (High Knee)" },
    description: {
      en: "Drive knees up towards chest quickly while pumping arms.",
      ar: "رفع الركبتين بالتناوب نحو الصدر بسرعة مع تحريك الذراعين لتنشيط الدورة الدموية.",
    },
    sets: 1,
    reps: "max",
    restSeconds: 60,
    videoUrl: "https://www.youtube.com/embed/8opcQdC-5gk",
    thumbnailUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&auto=format&fit=crop&q=80",
    equipment: "Bodyweight",
    targetMuscles: ["Hip Flexors", "Quads", "Cardio"],
    notes: {
      en: "Stay on balls of your feet",
      ar: "حافظ على الارتكاز على مشط القدم",
    },
    alternatives: [
      {
        id: "alt-high-march",
        name: { en: "Standing High March", ar: "المشي السريع في المكان برفع الركبة" },
        reason: {
          en: "Joint friendly alternative",
          ar: "بديل آمن وخفيف على المفاصل",
        },
        equipment: "Bodyweight",
      },
    ],
  },
]

const INCLINE_PUSHUP: WorkoutExercise = {
  id: "ex-incline-pushup",
  name: { en: "Incline Push Up", ar: "تمرين ضغط مائل (Incline Push Up)" },
  description: {
    en: "Hands on elevated bench, lower chest to bench with elbows at 45 degrees, push up.",
    ar: "ضع يديك على بنش مرتفع، انزل بصدرك بتحكم مع زاوية مرفق 45 درجة ثم ادفع للأعلى.",
  },
  sets: 4,
  reps: "10 - 15",
  restSeconds: 60,
  videoUrl: "https://www.youtube.com/embed/4dF1DOWzf20",
  thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&auto=format&fit=crop&q=80",
  equipment: "Bench / Box",
  targetMuscles: ["Chest", "Triceps", "Front Shoulders"],
  notes: {
    en: "Keep body in straight plank alignment",
    ar: "حافظ على استقامة الجسم بالكامل كلوح مستقيم",
  },
  alternatives: [
    {
      id: "alt-knee-pushup",
      name: { en: "Knee Push-Ups", ar: "ضغط على الركبتين" },
      reason: {
        en: "Easier modification to complete all sets",
        ar: "تعديل مناسب لإكمال جميع التكرارات بنقاء",
      },
      equipment: "Mat",
    },
    {
      id: "alt-wall-pushup",
      name: { en: "Wall Push-Ups", ar: "ضغط مستنداً على الحائط" },
      reason: {
        en: "Rehabilitation / light load",
        ar: "لحالات التأهيل أو تخفيف الحمل",
      },
      equipment: "Wall",
    },
  ],
}

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
      {
        id: "a-full",
        weekday: 0,
        label: { en: "Day 1 - Full Body", ar: "يوم 1 - full body (8 تمارين)" },
        focus: { en: "Full Body Warmup & Foundation", ar: "إحماء وتهيئة لكامل الجسم" },
        exercises: [...WARMUP_CARDIO, ...PUSH.slice(0, 3)],
      },
      {
        id: "a-legs",
        weekday: 1,
        label: { en: "Day 2 - Lower Body", ar: "يوم 2 - الجزء السفلي" },
        focus: { en: "Legs & Core Stability", ar: "قوة الأرجل وعضلات الجذع" },
        exercises: LEGS,
      },
      {
        id: "a-upper",
        weekday: 2,
        label: { en: "Day 3 - Upper Body", ar: "يوم 3 upper body (4 تمارين)" },
        focus: { en: "Chest, Shoulders & Arms", ar: "عضلات الصدر والكتف والذراعين" },
        exercises: [INCLINE_PUSHUP, ...PUSH.slice(0, 2), ...PULL.slice(0, 1)],
      },
      {
        id: "a-pull",
        weekday: 3,
        label: { en: "Day 4 - Back & Pull", ar: "يوم 4 - الظهر والسحب" },
        focus: { en: "Back Width & Biceps", ar: "عرض الظهر والبايسبس" },
        exercises: PULL,
      },
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
    dayId: "a-full",
    weekday: 0,
    date: "2026-10-26",
    workoutTitle: "Full Body (Warmup & Strength)",
    durationMinutes: 52,
    activeMinutes: 38,
    restMinutes: 14,
    perceivedEffort: 8,
    energyLevel: "great",
    totalVolumeKg: 1480,
    notes: "Solid bench sets, pushed 95kg for 8 reps on final set.",
    completedAt: "2026-10-26T18:40:00.000Z",
    exercisesCompleted: [
      {
        exerciseId: "ex-jump-jacks",
        name: "Jump Jacks",
        targetSets: 1,
        completedSets: 1,
        repsDone: "60s max",
        durationSeconds: 60,
        restSeconds: 60,
      },
      {
        exerciseId: "ex-arm-circles",
        name: "Forward Arm Circle",
        targetSets: 1,
        completedSets: 1,
        repsDone: "45s max",
        durationSeconds: 45,
        restSeconds: 60,
      },
      {
        exerciseId: "ex-high-knee",
        name: "High Knee",
        targetSets: 1,
        completedSets: 1,
        repsDone: "60s max",
        durationSeconds: 60,
        restSeconds: 60,
      },
      {
        exerciseId: "ex-bp",
        name: "Barbell bench press",
        targetSets: 4,
        completedSets: 4,
        weightKg: 85,
        repsDone: 10,
        restSeconds: 90,
      },
    ],
  },
  {
    id: "wlog-2",
    subscriberId: "sub-alex",
    programId: "asg-alex",
    dayId: "a-pull",
    weekday: 1,
    date: "2026-10-27",
    workoutTitle: "Back & Pull Session",
    durationMinutes: 48,
    activeMinutes: 34,
    restMinutes: 14,
    perceivedEffort: 7,
    energyLevel: "good",
    totalVolumeKg: 1220,
    notes: "Row tempo was clean, no lower back fatigue.",
    completedAt: "2026-10-27T19:15:00.000Z",
    exercisesCompleted: [
      {
        exerciseId: "ex-row",
        name: "Chest-supported row",
        targetSets: 4,
        completedSets: 4,
        weightKg: 32,
        repsDone: 10,
        restSeconds: 90,
      },
      {
        exerciseId: "ex-lat",
        name: "Lat pulldown",
        targetSets: 3,
        completedSets: 3,
        weightKg: 55,
        repsDone: 12,
        restSeconds: 75,
      },
    ],
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
