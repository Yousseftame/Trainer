import type { PhysicalTherapyRecord } from "@/types/physicalTherapy"

export const DEMO_PT_RECORDS: PhysicalTherapyRecord[] = [
  {
    id: "pt-alex-shoulder",
    subscriberId: "sub-alex",
    subscriberName: "Alex Haddad",
    injuryTitle: {
      en: "Right Subacromial Shoulder Impingement",
      ar: "متلازمة انحشار الكتف الأيمن تحت الأخرم",
    },
    affectedArea: "shoulder",
    severity: "mild",
    status: "recovering",
    diagnosisDate: "2026-08-15",
    nextEvaluationDate: "2026-11-20",
    restrictions: [
      {
        id: "res-1",
        prohibited: {
          en: "Straight-bar overhead shoulder press",
          ar: "الدفع العلوي بالبار المستقيم",
        },
        safeAlternative: {
          en: "Neutral-grip dumbbell shoulder press or landmine press",
          ar: "دفع علوي بالدمبلز قبضة محايدة أو جهاز اللاندمين",
        },
        reason: {
          en: "Reduces internal rotation torque on the supraspinatus tendon.",
          ar: "يقلل من إجهاد الدوران الداخلي على وتر العضلة فوق الشوكية.",
        },
        equipment: "Dumbbells / Landmine",
      },
      {
        id: "res-2",
        prohibited: {
          en: "Wide-grip behind-the-neck pulldowns or upright rows",
          ar: "سحب عريض خلف الرقبة أو التجديف العمودي بالبار",
        },
        safeAlternative: {
          en: "Neutral-grip chest-supported rows and face pulls",
          ar: "تجديف مدعوم بالصدر بقبضة محايدة وتمرين فيس بول",
        },
        reason: {
          en: "Avoids extreme end-range anterior capsule stress.",
          ar: "يتجنب الضغط الأقصى على المحفظة المفصلية الأمامية.",
        },
        equipment: "Cable machine / Dumbbells",
      },
    ],
    rehabExercises: [
      {
        id: "rehab-1",
        name: {
          en: "Side-lying dumbbell external rotation",
          ar: "دوران خارجي للكتف بالدمبل في وضع الاستلقاء الجانبي",
        },
        sets: 3,
        reps: "15 reps",
        frequency: "3x / week",
        notes: {
          en: "Use 2-3kg dumbbell. Keep elbow pinned to hip with towel roll.",
          ar: "استخدم دمبل 2-3 كجم. حافظ على المرفق ملتصقاً بالجانب بمساعدة منشفة.",
        },
      },
      {
        id: "rehab-2",
        name: {
          en: "Cable face pull with external rotation",
          ar: "فيس بول بالكابل مع دوران خارجي في نهاية الحركة",
        },
        sets: 3,
        reps: "12-15 reps",
        frequency: "Pre-workout",
        notes: {
          en: "Focus on rear delts and scapular retraction. 2 sec pause at contraction.",
          ar: "ركز على عضلات الكتف الخلفي وتقريب لوحي الكتف. ثبات ثانيتين عند الانقباض.",
        },
      },
      {
        id: "rehab-3",
        name: {
          en: "Prone Y-T-W shoulder raises",
          ar: "رفع الذراعين على شكل Y-T-W في وضع الانبطاح",
        },
        sets: 2,
        reps: "10 reps each",
        frequency: "Daily warmup",
        notes: {
          en: "Bodyweight only. Squeeze lower traps at top.",
          ar: "بوزن الجسم فقط. اعصر عضلات الظهر السفلية في القمة.",
        },
      },
    ],
    therapistNotes: {
      en: "Alex is responding well to neutral-grip variations. Range of motion improved by 15° since October. Advised not to load flat barbell bench past 80% 1RM until next check.",
      ar: "أليكس يستجيب بشكل ممتاز لتمارين القبضة المحايدة. مدى الحركة تحسن بمقدار 15 درجة منذ أكتوبر. تم التوصية بعدم تجاوز 80% في بنش البار حتى التقييم القادم.",
    },
    createdAt: "2026-08-15T10:00:00.000Z",
    updatedAt: "2026-10-25T14:30:00.000Z",
  },
  {
    id: "pt-alex-ankle-cleared",
    subscriberId: "sub-alex",
    subscriberName: "Alex Haddad",
    injuryTitle: {
      en: "Left Ankle Grade 1 Inversion Sprain (Resolved)",
      ar: "التواء الكاحل الأيسر من الدرجة الأولى (مكتمل الشفاء)",
    },
    affectedArea: "ankle",
    severity: "mild",
    status: "cleared",
    diagnosisDate: "2026-04-10",
    clearanceDate: "2026-06-20",
    restrictions: [
      {
        id: "res-ankle-1",
        prohibited: {
          en: "Max-effort lateral bounding or box jumps",
          ar: "القفزات الجانبية بأقصى قوة أو قفز الصندوق العالي",
        },
        safeAlternative: {
          en: "Single-leg balance on bosu / controlled calf raises",
          ar: "توازن الساق الواحدة على كرة البوسو وتمارين السمانة المضبوطة",
        },
        reason: {
          en: "Avoided sudden inversion torque during initial ligament remodelling.",
          ar: "تجنب عزم الانقلاب المفاجئ أثناء إعادة تشكيل ألياف الرباط.",
        },
        equipment: "Bosu / Stepper",
      },
    ],
    rehabExercises: [
      {
        id: "rehab-ankle-1",
        name: {
          en: "Ankle Alphabet & Resistance Band Eversion",
          ar: "رسم الحروف بالكاحل وتمارين الإبعاد بالرباط المطاطي",
        },
        sets: 3,
        reps: "20 reps",
        frequency: "Daily",
        notes: {
          en: "Strengthened peroneus longus and brevis. Full mobility achieved.",
          ar: "تم تقوية العضلات الشظوية واستعادة المدى الحركي الكامل.",
        },
      },
    ],
    therapistNotes: {
      en: "Full lateral stability restored. Single-leg hop test cleared with 98% symmetry. Subscriber fully cleared for all agility and running work.",
      ar: "تم استعادة الثبات الجانبي بالكامل. فحص القفز الأحادي أظهر تطابقاً بنسبة 98%. اللاعب مصرح له بالكامل بجميع تدريبات الرشاقة والجري.",
    },
    createdAt: "2026-04-10T09:00:00.000Z",
    updatedAt: "2026-06-20T11:00:00.000Z",
  },
  {
    id: "pt-sara-knee",
    subscriberId: "sub-sara",
    subscriberName: "Sara Mostafa",
    injuryTitle: {
      en: "Patellofemoral Pain Syndrome (Runner's Knee)",
      ar: "متلازمة ألم الفخذ الرضفي (ركبة العداء)",
    },
    affectedArea: "knee",
    severity: "moderate",
    status: "active",
    diagnosisDate: "2026-09-10",
    nextEvaluationDate: "2026-11-15",
    restrictions: [
      {
        id: "res-3",
        prohibited: {
          en: "Deep lunges with knee travelling excessively past toes",
          ar: "الطعنات العميقة مع تقدم الركبة للأمام بشكل مفرط",
        },
        safeAlternative: {
          en: "Reverse lunges with vertical tibia or box step-ups",
          ar: "طعنات خلفية مع ساق عمودية أو الصعود على صندوق ثابت",
        },
        reason: {
          en: "Shifts mechanical load from the patellar tendon to glutes and hamstrings.",
          ar: "ينقل الحمل الميكانيكي من وتر الصابونة إلى عضلات الألوية والخلفية.",
        },
        equipment: "Box / Dumbbells",
      },
      {
        id: "res-4",
        prohibited: {
          en: "Leg extension machine with heavy loads",
          ar: "جهاز فرد الركبة بأوزان ثقيلة",
        },
        safeAlternative: {
          en: "Terminal knee extension (TKE) with resistance band",
          ar: "فرد الركبة النهائي بحبل مقاومة مطاطي (TKE)",
        },
        reason: {
          en: "Protects retro-patellar cartilage from excessive shear force.",
          ar: "يحمي غضروف ما خلف الرضفة من قوى القص الزائدة.",
        },
        equipment: "Resistance band",
      },
    ],
    rehabExercises: [
      {
        id: "rehab-4",
        name: {
          en: "Banded terminal knee extension (TKE)",
          ar: "فرد الركبة النهائي ضد مقاومة مطاطية",
        },
        sets: 3,
        reps: "20 reps / leg",
        frequency: "Daily",
        notes: {
          en: "Contract VMO (vastus medialis) for 2 seconds at full extension.",
          ar: "ركز على عضلة الفخذ الأمامية الداخلية واثبت ثانيتين عند الفرد الكامل.",
        },
      },
      {
        id: "rehab-5",
        name: {
          en: "Side-lying clam shells with loop band",
          ar: "تمرين المحارة الجانبي مع رباط مطاطي لتقوية الألوية الوسطى",
        },
        sets: 3,
        reps: "15 reps / side",
        frequency: "4x / week",
        notes: {
          en: "Strengthens gluteus medius to eliminate dynamic knee valgus.",
          ar: "يقوي الألوية الوسطى لمنع انحناء الركبة إلى الداخل أثناء الحركة.",
        },
      },
      {
        id: "rehab-6",
        name: {
          en: "Spanish Squat (band-supported wall squat)",
          ar: "السكوات الإسباني مدعوماً بحزام مطاطي",
        },
        sets: 4,
        reps: "45 sec hold",
        frequency: "Pre-workout",
        notes: {
          en: "Isometric loading relieves patellar tendon pain immediately.",
          ar: "التحميل الثابت يخفف آلام وتر الرضفة بشكل فوري قبل التمرين.",
        },
      },
    ],
    therapistNotes: {
      en: "Knee flexion tolerance has increased. Avoid jump squats or impact plyometrics for 4 more weeks. Spanish squats recommended before every leg workout.",
      ar: "تحسن تحمل ثني الركبة. يرجى تجنب القفز والتمارين الارتدادية لمدة 4 أسابيع إضافية. يوصى بالسكوات الإسباني قبل كل تمرين أرجل.",
    },
    createdAt: "2026-09-10T12:00:00.000Z",
    updatedAt: "2026-10-28T09:15:00.000Z",
  },
  {
    id: "pt-karim-back",
    subscriberId: "sub-karim",
    subscriberName: "Karim El-Sayed",
    injuryTitle: {
      en: "L4-L5 Mild Disc Bulge / Lower Back Strain",
      ar: "بروز غضروفي خفيف بين الفقرتين L4-L5 وإجهاد قطني",
    },
    affectedArea: "lower_back",
    severity: "moderate",
    status: "recovering",
    diagnosisDate: "2026-07-20",
    clearanceDate: null,
    nextEvaluationDate: "2026-11-25",
    restrictions: [
      {
        id: "res-5",
        prohibited: {
          en: "Heavy conventional barbell deadlifts from the floor",
          ar: "الرفعة الميتة التقليدية بالبار الثقيل من الأرض",
        },
        safeAlternative: {
          en: "Trap bar deadlift (high handles) or dumbbell Romanian deadlift",
          ar: "ديدليفت بتراب بار (مقابض مرتفعة) أو رومانيان ديدليفت بالدمبلز",
        },
        reason: {
          en: "Keeps center of mass closer to body and reduces lumbar shear force.",
          ar: "يبقي مركز الثقل أقرب للجسم ويقلل إجهاد الانحناء على الفقرات القطنية.",
        },
        equipment: "Trap Bar / Dumbbells",
      },
      {
        id: "res-6",
        prohibited: {
          en: "Seated machine leg press or heavy barbell back squats",
          ar: "جهاز ضغط الأرجل مع انثناء الحوض أو سكوات البار الخلفي الثقيل",
        },
        safeAlternative: {
          en: "Split squats / Bulgarian split squats with dumbbells",
          ar: "السكوات البلغاري الأحادي بالدمبلز",
        },
        reason: {
          en: "Eliminates spinal compression while overloading leg musculature.",
          ar: "يلغي الضغط المحوري على العمود الفقري مع تحميل عضلات الساق بقوة.",
        },
        equipment: "Dumbbells / Bench",
      },
    ],
    rehabExercises: [
      {
        id: "rehab-7",
        name: {
          en: "McGill Big 3: Bird-Dog",
          ar: "تمرين بيرد-دوج (ثلاثية ماكجيل لصحة الظهر)",
        },
        sets: 3,
        reps: "8 reps / side with 5s hold",
        frequency: "Daily",
        notes: {
          en: "Do not hyperextend lumbar spine. Squeeze glute and core.",
          ar: "حافظ على استقامة الظهر دون تقويس زائد. اعصر الألوية والبطن.",
        },
      },
      {
        id: "rehab-8",
        name: {
          en: "Side Plank with hip abduction",
          ar: "بلانك جانبي لتقوية عضلات الجذع الجانبية والعمود الفقري",
        },
        sets: 3,
        reps: "30-45 sec / side",
        frequency: "4x / week",
        notes: {
          en: "Maintain rigid straight line from ankle to shoulder.",
          ar: "حافظ على خط مستقيم متماسك من الكاحل حتى الكتف.",
        },
      },
      {
        id: "rehab-9",
        name: {
          en: "Deadbug with abdominal bracing",
          ar: "تمرين ديدباج مع شد عضلات البطن العميقة",
        },
        sets: 3,
        reps: "12 reps",
        frequency: "Daily",
        notes: {
          en: "Keep lower back pressed flat into the floor.",
          ar: "اضغط أسفل الظهر بثبات على الأرض طوال مدة التمرين.",
        },
      },
    ],
    therapistNotes: {
      en: "Karim has zero radiating nerve pain down the leg. Core stiffness is significantly higher. Trap bar deadlift approved up to 100kg with perfect form.",
      ar: "كريم لا يعاني من أي ألم عصبي مشع إلى الساق. ثبات عضلات الجذع ممتاز. تم اعتماد تراب بار ديدليفت حتى 100 كجم بأداء متقن.",
    },
    createdAt: "2026-07-20T11:00:00.000Z",
    updatedAt: "2026-10-20T16:00:00.000Z",
  },
]

