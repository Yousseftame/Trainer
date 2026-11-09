import {onDocumentCreated, onDocumentWritten} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {COLLECTIONS} from "../config/collections.js";
import {db} from "../config/firebase.js";
import {enqueueNotice} from "../shared/notices.js";

function bilingual(en: string, ar: string) {
  return {en, ar};
}

/** New registration / contact form → confirmation email + staff browser alarm. */
export const onRegistrationRequestCreated = onDocumentCreated(
  `${COLLECTIONS.registrationRequests}/{requestId}`,
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const email = String(data.email ?? "").trim().toLowerCase();
    if (!email) return;
    const name = String(data.displayName ?? email);
    const phone = String(data.phone ?? "").trim();
    const source = String(data.source ?? "contact");
    const requestId = event.params.requestId;
    const fromContact = source === "contact";
    const goalRaw = data.goal as {en?: string; ar?: string} | string | undefined;
    const messageSnippet = (
      typeof goalRaw === "string"
        ? goalRaw
        : String(goalRaw?.en || goalRaw?.ar || "")
    )
      .trim()
      .slice(0, 120);

    let packageLabel = "";
    const packageId =
      typeof data.packageId === "string" ? data.packageId : undefined;
    if (packageId) {
      const pkgSnap = await db.collection(COLLECTIONS.packages).doc(packageId).get();
      if (pkgSnap.exists) {
        const pkgName = pkgSnap.data()?.name as
          | {en?: string; ar?: string}
          | undefined;
        packageLabel = String(pkgName?.en || pkgName?.ar || packageId);
      }
    }

    await enqueueNotice({
      kind: "registration",
      toEmail: email,
      toName: name,
      requestId,
      packageId,
      dedupeKey: `registration:${requestId}`,
      // Customer email / inbox copy
      subject: bilingual(
        `We received ${name}'s request`,
        `استلمنا طلب ${name}`,
      ),
      detail: bilingual(
        "Your registration request was received. The coaching team will review it shortly.",
        "تم استلام طلب التسجيل. سيراجعه فريق التدريب قريباً.",
      ),
      // Staff browser / FCM alarm — explicit contact-form lead signal
      staffSubject: bilingual(
        fromContact
          ? `New contact form · ${name}`
          : `New registration · ${name}`,
        fromContact
          ? `طلب تواصل جديد · ${name}`
          : `طلب تسجيل جديد · ${name}`,
      ),
      staffDetail: bilingual(
        [
          fromContact
            ? "A visitor submitted the website contact form."
            : "A new registration request was created.",
          phone ? `Phone: ${phone}.` : "",
          packageLabel ? `Package: ${packageLabel}.` : "",
          `Email: ${email}.`,
          messageSnippet ? `Message: ${messageSnippet}` : "",
        ]
          .filter(Boolean)
          .join(" "),
        [
          fromContact
            ? "زائر أرسل نموذج التواصل من الموقع."
            : "تم إنشاء طلب تسجيل جديد.",
          phone ? `الهاتف: ${phone}.` : "",
          packageLabel ? `الباقة: ${packageLabel}.` : "",
          `البريد: ${email}.`,
          messageSnippet ? `الرسالة: ${messageSnippet}` : "",
        ]
          .filter(Boolean)
          .join(" "),
      ),
      alarmStaff: true,
    });
  },
);

/** Subscription becomes active → activation notice (deduped per subscription). */
export const onSubscriptionWritten = onDocumentWritten(
  `${COLLECTIONS.subscriptions}/{subscriptionId}`,
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return;

    const prevStatus = before ? String(before.status ?? "") : "";
    const nextStatus = String(after.status ?? "");
    if (nextStatus !== "active" || prevStatus === "active") return;

    const email = String(after.subscriberEmail ?? "").trim().toLowerCase();
    const subscriberId = String(after.subscriberId ?? "");
    let toEmail = email;
    let toName = String(after.subscriberName ?? "");

    if ((!toEmail || !toName) && subscriberId) {
      const subSnap = await db
        .collection(COLLECTIONS.subscribers)
        .doc(subscriberId)
        .get();
      if (subSnap.exists) {
        const sub = subSnap.data() ?? {};
        toEmail = toEmail || String(sub.email ?? "").trim().toLowerCase();
        toName = toName || String(sub.displayName ?? toEmail);
      }
    }
    if (!toEmail) return;

    const packageId = String(after.packageId ?? "");
    let packageName = packageId;
    if (packageId) {
      const pkgSnap = await db.collection(COLLECTIONS.packages).doc(packageId).get();
      if (pkgSnap.exists) {
        const name = pkgSnap.data()?.name as {en?: string} | undefined;
        packageName = String(name?.en ?? packageId);
      }
    }

    const subscriptionId = event.params.subscriptionId;
    await enqueueNotice({
      kind: "activation",
      toEmail,
      toName: toName || toEmail,
      subscriberId: subscriberId || undefined,
      packageId: packageId || undefined,
      subscriptionId,
      dedupeKey: `activation:${subscriptionId}`,
      subject: bilingual(
        `${toName || "Your"} ${packageName} is active`,
        `تم تفعيل باقة ${packageName}`,
      ),
      detail: bilingual(
        `Your subscription is now active. Open the subscriber panel to start your programs.`,
        `اشتراكك أصبح نشطاً. افتح لوحة المشترك للبدء في برامجك.`,
      ),
      alarmStaff: true,
    });
  },
);

function daysUntil(endsAt: string, now: Date) {
  return Math.ceil(
    (new Date(endsAt).getTime() - now.getTime()) / 86_400_000,
  );
}

/** Daily scan — queue 14-day and 7-day expiration reminders. */
export const scanExpiringSubscriptions = onSchedule(
  {
    schedule: "every day 07:00",
    timeZone: "Africa/Cairo",
  },
  async () => {
    const now = new Date();
    const snap = await db
      .collection(COLLECTIONS.subscriptions)
      .where("status", "==", "active")
      .get();

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const endsAt = data.endsAt ? String(data.endsAt) : "";
      if (!endsAt) continue;
      const days = daysUntil(endsAt, now);
      if (days !== 14 && days !== 7) continue;

      const subscriberId = String(data.subscriberId ?? "");
      let toEmail = String(data.subscriberEmail ?? "").trim().toLowerCase();
      let toName = String(data.subscriberName ?? "");
      if ((!toEmail || !toName) && subscriberId) {
        const subSnap = await db
          .collection(COLLECTIONS.subscribers)
          .doc(subscriberId)
          .get();
        if (subSnap.exists) {
          const sub = subSnap.data() ?? {};
          toEmail = toEmail || String(sub.email ?? "").trim().toLowerCase();
          toName = toName || String(sub.displayName ?? toEmail);
        }
      }
      if (!toEmail) continue;

      const packageId = String(data.packageId ?? "");
      let packageName = packageId;
      if (packageId) {
        const pkgSnap = await db
          .collection(COLLECTIONS.packages)
          .doc(packageId)
          .get();
        if (pkgSnap.exists) {
          const name = pkgSnap.data()?.name as {en?: string} | undefined;
          packageName = String(name?.en ?? packageId);
        }
      }

      await enqueueNotice({
        kind: "expiration",
        toEmail,
        toName: toName || toEmail,
        subscriberId: subscriberId || undefined,
        packageId: packageId || undefined,
        subscriptionId: docSnap.id,
        dedupeKey: `expiration:${docSnap.id}:${days}d`,
        subject: bilingual(
          `${packageName} ends in ${days} days`,
          `باقة ${packageName} تنتهي خلال ${days} يوماً`,
        ),
        detail: bilingual(
          `Renew before ${endsAt.slice(0, 10)} so assigned programs stay live.`,
          `جدّد قبل ${endsAt.slice(0, 10)} حتى تبقى البرامج المعيّنة نشطة.`,
        ),
        alarmStaff: true,
      });
    }
  },
);
