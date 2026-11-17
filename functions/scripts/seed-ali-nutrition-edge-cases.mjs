/**
 * One-shot seed: assign Ali Ali a nutrition day covering substitute vs request-change cases.
 * Uses Firebase CLI login tokens (no gcloud ADC needed).
 *
 *   node functions/scripts/seed-ali-nutrition-edge-cases.mjs
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {Firestore} from "@google-cloud/firestore"

const PROJECT_ID = "trainer-d4699"

function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function loadFirebaseCliAccessToken() {
  const cfgPath = path.join(
    os.homedir(),
    ".config",
    "configstore",
    "firebase-tools.json",
  )
  const raw = JSON.parse(fs.readFileSync(cfgPath, "utf8"))
  const access = raw?.tokens?.access_token
  const expiresAt = Number(raw?.tokens?.expires_at || 0)
  if (!access) {
    throw new Error("No Firebase CLI access token found. Run: firebase login")
  }
  if (expiresAt && expiresAt < Date.now() + 60_000) {
    throw new Error(
      "Firebase CLI access token expired. Run any firebase command (e.g. firebase projects:list) then retry.",
    )
  }
  return access
}

function buildEdgeCaseDays() {
  const edgeDay = {
    id: id("day"),
    weekday: 1,
    label: {en: "Edge-case Test Day", ar: "يوم اختبار الحالات"},
    targetCalories: 2200,
    targetWaterLiters: 3,
    meals: [
      {
        id: id("slot"),
        slot: "breakfast",
        label: {en: "Breakfast", ar: "فطور"},
        timeRecommendation: "08:00",
        calories: 450,
        coachingNote: {
          en: "TEST: This item HAS approved alternatives — use Substitute to swap locally (should NOT appear in admin).",
          ar: "اختبار: هذا العنصر له بدائل معتمدة — استخدم الاستبدال المحلي (لا يظهر في الأدمن).",
        },
        items: [
          {
            id: id("item"),
            name: {en: "Oats with milk", ar: "شوفان بالحليب"},
            quantity: {en: "1 bowl (60g oats)", ar: "وعاء واحد (60 جم شوفان)"},
            notes: {en: "Has 2 approved alts", ar: "يحتوي بديلين معتمدين"},
            calories: 320,
            protein: 14,
            carbs: 48,
            fats: 8,
            alternatives: [
              {
                id: id("alt"),
                name: {en: "Greek yogurt + berries", ar: "زبادي يوناني مع توت"},
                quantity: {en: "200g yogurt", ar: "200 جم زبادي"},
                calories: 280,
                protein: 20,
                carbs: 25,
                fats: 7,
                percentage: 90,
                reason: {
                  en: "If oats unavailable",
                  ar: "إذا لم يتوفر الشوفان",
                },
              },
              {
                id: id("alt"),
                name: {
                  en: "Egg whites omelette + toast",
                  ar: "أومليت بياض مع توست",
                },
                quantity: {en: "4 whites + 1 toast", ar: "4 بياض + توست"},
                calories: 300,
                protein: 22,
                carbs: 28,
                fats: 6,
                percentage: 85,
                reason: {
                  en: "Higher protein option",
                  ar: "خيار بروتين أعلى",
                },
              },
            ],
          },
        ],
      },
      {
        id: id("slot"),
        slot: "lunch",
        label: {en: "Lunch", ar: "غداء"},
        timeRecommendation: "13:00",
        calories: 650,
        coachingNote: {
          en: "TEST: Mixed meal — one item WITH alts, one WITHOUT (request change).",
          ar: "اختبار: وجبة مختلطة — عنصر ببدائل وآخر بدون.",
        },
        items: [
          {
            id: id("item"),
            name: {en: "Grilled chicken breast", ar: "صدر دجاج مشوي"},
            quantity: {en: "180g cooked", ar: "180 جم مطبوخ"},
            notes: {en: "Has 1 approved alt", ar: "له بديل معتمد واحد"},
            calories: 300,
            protein: 45,
            carbs: 0,
            fats: 8,
            alternatives: [
              {
                id: id("alt"),
                name: {en: "Turkey breast", ar: "صدر ديك رومي"},
                quantity: {en: "180g cooked", ar: "180 جم مطبوخ"},
                calories: 280,
                protein: 44,
                carbs: 0,
                fats: 6,
                percentage: 95,
                reason: {
                  en: "Same macros if chicken missing",
                  ar: "نفس الماكروز إذا لم يتوفر الدجاج",
                },
              },
            ],
          },
          {
            id: id("item"),
            name: {en: "Brown rice", ar: "أرز بني"},
            quantity: {en: "150g cooked", ar: "150 جم مطبوخ"},
            notes: {
              en: "NO alternatives — use Request change → should reach admin",
              ar: "بدون بدائل — استخدم طلب التغيير → يظهر في الأدمن",
            },
            calories: 180,
            protein: 4,
            carbs: 38,
            fats: 1.5,
          },
          {
            id: id("item"),
            name: {en: "Mixed salad", ar: "سلطة مشكلة"},
            quantity: {en: "1 large bowl", ar: "وعاء كبير"},
            notes: {
              en: "NO alternatives — item coach request edge case",
              ar: "بدون بدائل — حالة طلب تغيير عنصر",
            },
            calories: 90,
            protein: 3,
            carbs: 10,
            fats: 4,
          },
        ],
      },
      {
        id: id("slot"),
        slot: "snack",
        label: {en: "Snack", ar: "سناك"},
        timeRecommendation: "16:30",
        calories: 220,
        coachingNote: {
          en: "TEST: Single item with NO alts — item refresh opens Request coach change.",
          ar: "اختبار: عنصر واحد بدون بدائل — زر التحديث يفتح طلب المدرب.",
        },
        items: [
          {
            id: id("item"),
            name: {en: "Protein shake", ar: "شيك بروتين"},
            quantity: {en: "1 scoop + water", ar: "سكوب واحد + ماء"},
            notes: {
              en: "No approved alts → Save & request change",
              ar: "لا بدائل → حفظ وطلب التغيير",
            },
            calories: 120,
            protein: 24,
            carbs: 3,
            fats: 1,
          },
        ],
      },
      {
        id: id("slot"),
        slot: "dinner",
        label: {en: "Dinner", ar: "عشاء"},
        timeRecommendation: "20:00",
        calories: 700,
        coachingNote: {
          en: "TEST: Use top Substitute button → Send meal request to coach (full-meal request).",
          ar: "اختبار: زر الاستبدال أعلى الوجبة → إرسال طلب استبدال الوجبة كاملة.",
        },
        items: [
          {
            id: id("item"),
            name: {en: "Salmon fillet", ar: "فيليه سلمون"},
            quantity: {en: "160g", ar: "160 جم"},
            calories: 340,
            protein: 34,
            carbs: 0,
            fats: 22,
            alternatives: [
              {
                id: id("alt"),
                name: {en: "Lean beef steak", ar: "ستيك لحم قليل الدهن"},
                quantity: {en: "160g", ar: "160 جم"},
                calories: 320,
                protein: 36,
                carbs: 0,
                fats: 18,
                percentage: 88,
                reason: {
                  en: "If salmon unavailable",
                  ar: "إذا لم يتوفر السلمون",
                },
              },
            ],
          },
          {
            id: id("item"),
            name: {en: "Sweet potato", ar: "بطاطا حلوة"},
            quantity: {en: "200g baked", ar: "200 جم مشوية"},
            notes: {
              en: "NO alts — good for item request OR full-meal request from dinner Substitute",
              ar: "بدون بدائل — مناسب لطلب عنصر أو طلب وجبة كاملة",
            },
            calories: 180,
            protein: 3,
            carbs: 41,
            fats: 0.5,
          },
          {
            id: id("item"),
            name: {en: "Steamed broccoli", ar: "بروكلي مطهو بالبخار"},
            quantity: {en: "150g", ar: "150 جم"},
            calories: 50,
            protein: 4,
            carbs: 8,
            fats: 0.5,
            alternatives: [
              {
                id: id("alt"),
                name: {en: "Green beans", ar: "فاصوليا خضراء"},
                quantity: {en: "150g", ar: "150 جم"},
                calories: 45,
                protein: 3,
                carbs: 8,
                fats: 0.2,
                percentage: 92,
              },
            ],
          },
        ],
      },
    ],
  }

  const days = [edgeDay]
  for (let weekday = 2; weekday <= 7; weekday++) {
    days.push({
      id: id("day"),
      weekday,
      label: {
        en: `Day ${weekday} (filler)`,
        ar: `اليوم ${weekday} (تعبئة)`,
      },
      targetCalories: 2000,
      meals: [
        {
          id: id("slot"),
          slot: "breakfast",
          label: {en: "Breakfast", ar: "فطور"},
          items: [
            {
              id: id("item"),
              name: {en: "Filler meal — ignore", ar: "وجبة تعبئة — تجاهل"},
              quantity: {en: "1 serving", ar: "حصة واحدة"},
              calories: 300,
              protein: 20,
              carbs: 30,
              fats: 8,
            },
          ],
        },
      ],
    })
  }
  return days
}

async function findAli(db) {
  const snap = await db.collection("subscribers").limit(150).get()
  const matches = []
  for (const doc of snap.docs) {
    const data = doc.data() || {}
    const email = String(data.email || "").toLowerCase()
    const name = String(data.displayName || "").toLowerCase()
    if (
      email === "ali@gmail.com" ||
      name === "ali ali" ||
      (name.includes("ali") && email.includes("ali"))
    ) {
      matches.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        status: data.status,
      })
    }
  }
  return matches
}

async function main() {
  const accessToken = loadFirebaseCliAccessToken()
  const authClient = {
    async getAccessToken() {
      return {token: accessToken}
    },
    async getRequestHeaders() {
      return {Authorization: `Bearer ${accessToken}`}
    },
  }
  const db = new Firestore({
    projectId: PROJECT_ID,
    authClient,
  })

  const matches = await findAli(db)
  if (!matches.length) {
    console.error("No subscriber matching Ali found.")
    process.exit(1)
  }
  console.log("Matched subscribers:", matches)
  const ali =
    matches.find((m) => String(m.email || "").toLowerCase() === "ali@gmail.com") ||
    matches.find((m) => String(m.displayName || "").toLowerCase() === "ali ali") ||
    matches[0]

  const now = new Date().toISOString()
  const days = buildEdgeCaseDays()

  const activeSnap = await db
    .collection("nutrition_programs")
    .where("subscriberId", "==", ali.id)
    .where("status", "==", "active")
    .get()

  const batch = db.batch()
  let nextVersion = 1
  for (const d of activeSnap.docs) {
    const existing = d.data() || {}
    nextVersion = Math.max(nextVersion, Number(existing.version || 1) + 1)
    batch.update(d.ref, {
      status: "archived",
      archivedAt: now,
      updatedAt: now,
    })
  }

  const ref = db.collection("nutrition_programs").doc()
  const program = {
    id: ref.id,
    title: {
      en: "Ali Ali — Edge Cases Nutrition Test",
      ar: "علي علي — اختبار حالات التغذية",
    },
    description: {
      en: "Seeded plan to test substitute (with alts) vs request change (no alts) vs full-meal coach request.",
      ar: "خطة اختبار للاستبدال المحلي وطلب التغيير وطلب استبدال الوجبة.",
    },
    format: "interactive",
    version: nextVersion,
    status: "active",
    subscriberId: ali.id,
    days,
    targetCalories: 2200,
    targetWaterLiters: 3,
    macros: {proteinGrams: 160, carbsGrams: 220, fatsGrams: 70},
    notes: {
      en: "Day 1 has all edge cases. Read each meal coaching note.",
      ar: "اليوم 1 يحتوي كل الحالات. اقرأ ملاحظة كل وجبة.",
    },
    disclaimerAcknowledged: true,
    adherence: {done: 0, total: 7},
    createdAt: now,
    updatedAt: now,
  }

  batch.set(ref, program)
  await batch.commit()

  console.log("Assigned nutrition program:")
  console.log(
    JSON.stringify(
      {
        programId: ref.id,
        subscriberId: ali.id,
        subscriberName: ali.displayName,
        email: ali.email,
        archivedActiveCount: activeSnap.size,
      },
      null,
      2,
    ),
  )
  console.log("\nHow to test as Ali (Day 1):")
  console.log("1) Breakfast oats → Substitute → pick approved alt (LOCAL only, not in admin)")
  console.log("2) Lunch Brown rice / Mixed salad → Request coach change → Admin Nutrition requests")
  console.log("3) Snack Protein shake → Request coach change → Admin inbox")
  console.log("4) Dinner top Substitute → Send meal request to coach → Admin inbox")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
