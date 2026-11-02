import { Link } from "react-router-dom"
import {
  Activity,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  ShieldAlert,
} from "lucide-react"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { useSubscriberPTQuery } from "@/features/physicalTherapy/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import type { PTAffectedArea } from "@/types/physicalTherapy"

const AREA_LABELS: Record<PTAffectedArea, { en: string; ar: string }> = {
  shoulder: { en: "Shoulder", ar: "الكتف" },
  knee: { en: "Knee", ar: "الركبة" },
  lower_back: { en: "Lower Back", ar: "أسفل الظهر" },
  neck: { en: "Neck", ar: "الرقبة" },
  ankle: { en: "Ankle", ar: "الكاحل" },
  hip: { en: "Hip", ar: "الحوض" },
  elbow: { en: "Elbow", ar: "المرفق" },
  wrist: { en: "Wrist", ar: "المعصم" },
  other: { en: "Other", ar: "أخرى" },
}

export function PhysicalTherapyPage() {
  const { locale } = useLocale()
  const isAr = locale === "ar"
  useDocumentTitle(isAr ? "العلاج الطبيعي والتأهيل الحركي" : "Physical Therapy & Rehab")

  const { user } = useAuth()
  const { data: subscribers = [] } = useSubscribersQuery()

  // Match logged in subscriber
  const currentSub = subscribers.find(
    (s) =>
      s.id === user?.uid ||
      s.email.toLowerCase() === (user?.email || "").toLowerCase(),
  )

  const subscriberId = currentSub?.id || user?.uid || "sub-alex"
  const { data: ptRecord, isLoading } = useSubscriberPTQuery(subscriberId)

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[26px] bg-[var(--gym-ink,#063434)] p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[12px] font-bold text-[var(--gym-lime,#b8fe22)]">
            <HeartPulse className="size-3.5" />
            <span>{isAr ? "الرعاية الحركية والتأهيل الوقائي" : "Preventative Care & Rehab Protocol"}</span>
          </div>

          <h1 className="font-heading text-[24px] font-extrabold tracking-tight sm:text-[30px]">
            {isAr ? "خطة العلاج الطبيعي والتأهيل الحركي" : "My Physical Therapy & Rehab"}
          </h1>
          <p className="text-[13px] sm:text-[14px] leading-relaxed text-white/80">
            {isAr
              ? "بروتوكول موجه لحمايتك من الإصابات، مع بدائل ذكية للتمارين لتستمر في التدريب بأمان وفاعلية تامة."
              : "Trainer-approved injury recovery and movement guidance with safe exercise alternatives so you stay strong without pain."}
          </p>
        </div>

        <div className="pointer-events-none absolute -end-8 -top-8 size-48 rounded-full bg-white/5 blur-2xl" />
      </div>

      {isLoading ? (
        <div className="flex min-h-60 items-center justify-center rounded-[24px] bg-white p-8 text-sm text-[#8c8c8c]">
          {isAr ? "جارٍ تحميل بيانات التأهيل..." : "Loading rehab records..."}
        </div>
      ) : !ptRecord ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
            <CheckCircle2 className="size-7" />
          </div>
          <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
            {isAr ? "لا توجد قيود حركية أو إصابات مسجلة" : "No Active Injury Restrictions"}
          </h2>
          <p className="mt-1.5 max-w-md text-[13px] text-[#8c8c8c] leading-relaxed">
            {isAr
              ? "ملفك الطبي وتدريبك في حالة ممتازة. إذا شعرت بأي ألم أو احتكاك أثناء التمرين، تواصل مع مدربك لإضافة بروتوكول تأهيل فوري."
              : "Your physical profile is clear! If you ever feel joint discomfort or pain during your sessions, reach out to your coach to prescribe safe alternatives."}
          </p>
          <Link
            to={APP_ROUTES.subscriber.workout}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-5 py-2.5 text-[13px] font-bold text-white transition hover:opacity-95"
          >
            <Dumbbell className="size-4" />
            {isAr ? "الانتقال إلى جدول التمارين" : "View Workout Plan"}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Status & Injury Overview Card */}
          <div className="rounded-[24px] bg-white p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-black/5 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StatusBadge
                    label={isAr ? AREA_LABELS[ptRecord.affectedArea]?.ar : AREA_LABELS[ptRecord.affectedArea]?.en}
                    tone="info"
                  />
                  <StatusBadge
                    label={
                      ptRecord.status === "active"
                        ? isAr
                          ? "تأهيل نشط"
                          : "Active Rehab"
                        : ptRecord.status === "recovering"
                          ? isAr
                            ? "في مرحلة الاستشفاء"
                            : "In Recovery"
                          : isAr
                            ? "تعافي مكتمل"
                            : "Cleared"
                    }
                    tone={ptRecord.status === "cleared" ? "success" : "warning"}
                  />
                  <StatusBadge
                    label={
                      ptRecord.severity === "mild"
                        ? isAr
                          ? "درجة خفيفة"
                          : "Mild"
                        : ptRecord.severity === "moderate"
                          ? isAr
                            ? "درجة متوسطة"
                            : "Moderate"
                          : isAr
                            ? "إصابة شديدة"
                            : "Severe"
                    }
                    tone={ptRecord.severity === "severe" ? "danger" : "muted"}
                  />
                </div>

                <h2 className="font-heading text-[22px] font-extrabold text-[var(--gym-ink,#063434)]">
                  {ptRecord.injuryTitle[locale] || ptRecord.injuryTitle.en}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-[#8c8c8c]">
                  <span>
                    {isAr ? "تاريخ بدء التشخيص: " : "Diagnosed: "}
                    <strong className="text-[var(--gym-ink,#063434)]">
                      {formatDate(ptRecord.diagnosisDate, locale)}
                    </strong>
                  </span>
                  {ptRecord.nextEvaluationDate ? (
                    <span>
                      · {isAr ? "التقييم القادم: " : "Next check-in: "}
                      <strong className="text-[var(--gym-ink,#063434)]">
                        {formatDate(ptRecord.nextEvaluationDate, locale)}
                      </strong>
                    </span>
                  ) : null}
                </div>
              </div>

              <Link
                to={APP_ROUTES.subscriber.workout}
                className="inline-flex items-center gap-2 self-start rounded-full bg-[#F4F4F4] px-4 py-2 text-[12px] font-bold text-[var(--gym-ink,#063434)] hover:bg-[#e9e9e9]"
              >
                <Dumbbell className="size-3.5" />
                {isAr ? "جدول التمارين الحالي" : "Go to Workout Plan"}
              </Link>
            </div>

            {/* Therapist Clinical Advice */}
            {ptRecord.therapistNotes ? (
              <div className="mt-4 rounded-xl bg-[#F8F9FA] p-4 border border-black/5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c8c8c] mb-1">
                  {isAr ? "توجيهات ونصائح المعالج الرياضي" : "Therapist Clinical Notes"}
                </p>
                <p className="text-[13px] leading-relaxed text-[var(--gym-ink,#063434)] font-medium">
                  {ptRecord.therapistNotes[locale] || ptRecord.therapistNotes.en}
                </p>
              </div>
            ) : null}
          </div>

          {/* Section 1: Movement Restrictions & Safe Alternatives */}
          <div className="rounded-[24px] bg-white p-5 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-red-100 text-red-600">
                <ShieldAlert className="size-4" />
              </div>
              <h3 className="font-heading text-[17px] font-extrabold text-[var(--gym-ink,#063434)]">
                {isAr ? "موانع الحركة والبدائل الآمنة في الجيم" : "Prohibited Movements & Safe Substitutes"}
              </h3>
            </div>
            <p className="text-[13px] text-[#8c8c8c] mb-5">
              {isAr
                ? "تجنب الحركات التالية لحماية المفصل من التدهور، واستبدلها فوراً بالبديل الآمن المعتمد أدناه."
                : "Avoid the following movements to prevent aggravating the injury. Use the approved safe substitute instead."}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {ptRecord.restrictions.map((res) => (
                <div
                  key={res.id}
                  className="rounded-2xl border border-red-200/70 bg-gradient-to-br from-red-50/40 via-white to-emerald-50/30 p-4 sm:p-5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-3">
                    {/* Prohibited */}
                    <div className="flex items-start gap-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-[12px] font-bold text-red-700">
                        ✕
                      </span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                          {isAr ? "ممنوع أداءه حالياً:" : "Avoid / Do Not Perform:"}
                        </p>
                        <p className="text-[14px] font-extrabold text-red-950 mt-0.5">
                          {res.prohibited[locale] || res.prohibited.en}
                        </p>
                      </div>
                    </div>

                    {/* Safe Substitute */}
                    <div className="flex items-start gap-2.5 pt-3 border-t border-black/5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-700">
                        ✓
                      </span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                          {isAr ? "البديل الآمن المعتمد:" : "Approved Safe Substitute:"}
                        </p>
                        <p className="text-[14px] font-extrabold text-emerald-950 mt-0.5">
                          {res.safeAlternative[locale] || res.safeAlternative.en}
                        </p>
                        {res.equipment ? (
                          <span className="mt-1 inline-block rounded-md bg-emerald-100/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {res.equipment}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {res.reason ? (
                    <p className="text-[11px] text-[#777] italic pt-2 border-t border-black/5">
                      💡 {res.reason[locale] || res.reason.en}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Prescribed Rehab Exercises */}
          <div className="rounded-[24px] bg-white p-5 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Activity className="size-4" />
              </div>
              <h3 className="font-heading text-[17px] font-extrabold text-[var(--gym-ink,#063434)]">
                {isAr ? "تمارين التأهيل والاستشفاء الموصوفة لك" : "Prescribed Rehab & Mobility Routine"}
              </h3>
            </div>
            <p className="text-[13px] text-[#8c8c8c] mb-5">
              {isAr
                ? "احرص على أداء هذه التمارين وفق الجدول الموصى به لتقوية العضلات المساندة وتسريع التعافي."
                : "Perform these exercises according to the prescribed frequency to restore joint stability and tissue resilience."}
            </p>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {ptRecord.rehabExercises.map((reh, idx) => (
                <div
                  key={reh.id}
                  className="rounded-2xl border border-blue-100 bg-[#FBFDFF] p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-800">
                        #{idx + 1}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                        {reh.frequency}
                      </span>
                    </div>

                    <h4 className="font-heading text-[15px] font-extrabold text-blue-950">
                      {reh.name[locale] || reh.name.en}
                    </h4>

                    <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-100/50 px-2.5 py-1 text-[12px] font-bold text-blue-900">
                      <span>{reh.sets} {isAr ? "مجموعات" : "sets"}</span>
                      <span>×</span>
                      <span>{reh.reps}</span>
                    </div>
                  </div>

                  {reh.notes ? (
                    <div className="rounded-xl bg-white p-2.5 text-[12px] text-[#555] leading-relaxed border border-blue-50">
                      <span className="font-bold text-[var(--gym-ink,#063434)] block text-[10px] uppercase tracking-wider mb-0.5">
                        {isAr ? "توجيهات الأداء:" : "Form Cue:"}
                      </span>
                      {reh.notes[locale] || reh.notes.en}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
