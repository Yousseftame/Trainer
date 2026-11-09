import {FieldValue} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import {COLLECTIONS} from "../config/collections.js";
import {db} from "../config/firebase.js";
import {stripUndefined} from "../lib/utils.js";

export type NoticeKind =
  | "registration"
  | "approval"
  | "activation"
  | "expiration";

export type NoticeStatus = "queued" | "sent" | "failed";

export type NoticeInput = {
  kind: NoticeKind;
  toEmail: string;
  toName?: string;
  subject: {en: string; ar: string};
  detail: {en: string; ar: string};
  /** Optional staff-facing push copy (defaults to subject/detail). */
  staffSubject?: {en: string; ar: string};
  staffDetail?: {en: string; ar: string};
  subscriberId?: string;
  requestId?: string;
  packageId?: string;
  subscriptionId?: string;
  dedupeKey?: string;
  scheduledAt?: string;
  channel?: "email" | "push" | "email+push";
  alarmStaff?: boolean;
};

function noticeRef() {
  return db.collection(COLLECTIONS.notices).doc();
}

async function findByDedupeKey(dedupeKey: string) {
  const snap = await db
    .collection(COLLECTIONS.notices)
    .where("dedupeKey", "==", dedupeKey)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0];
}

/** Queue email via Trigger Email extension–compatible `mail` collection. */
async function queueMailDoc(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  noticeId: string;
}) {
  const ref = db.collection(COLLECTIONS.mail).doc();
  await ref.set({
    to: [input.to],
    message: {
      subject: input.subject,
      text: input.text,
      html: input.html,
    },
    noticeId: input.noticeId,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

async function staffFcmTokens(): Promise<string[]> {
  const staffSnap = await db.collection(COLLECTIONS.staff).get();
  const staffIds = new Set(staffSnap.docs.map((d) => d.id));
  if (!staffIds.size) return [];

  const tokensSnap = await db.collection(COLLECTIONS.fcmTokens).get();
  const tokens: string[] = [];
  for (const docSnap of tokensSnap.docs) {
    const data = docSnap.data();
    const uid = String(data.uid ?? "");
    const token = String(data.token ?? "");
    if (token && staffIds.has(uid)) tokens.push(token);
  }
  return [...new Set(tokens)];
}

export async function sendStaffAlarm(input: {
  title: string;
  body: string;
  titleEn?: string;
  titleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
  noticeId?: string;
  kind?: string;
}): Promise<number> {
  const tokens = await staffFcmTokens();
  if (!tokens.length) return 0;

  const messaging = getMessaging();
  const titleEn = input.titleEn ?? input.title;
  const titleAr = input.titleAr ?? input.title;
  const bodyEn = input.bodyEn ?? input.body;
  const bodyAr = input.bodyAr ?? input.body;
  // Data-only web push so the service worker always controls display
  // (avoids double notifications from auto + onBackgroundMessage).
  const res = await messaging.sendEachForMulticast({
    tokens,
    data: {
      title: titleEn,
      body: bodyEn,
      title_en: titleEn,
      title_ar: titleAr,
      body_en: bodyEn,
      body_ar: bodyAr,
      noticeId: input.noticeId ?? "",
      kind: input.kind ?? "",
      url: "/admin/reports",
    },
    webpush: {
      headers: {
        Urgency: "high",
      },
      fcmOptions: {
        link: "/admin/reports",
      },
    },
  });

  // Drop invalid tokens
  const stale: string[] = [];
  res.responses.forEach((r, idx) => {
    if (
      !r.success &&
      (r.error?.code === "messaging/registration-token-not-registered" ||
        r.error?.code === "messaging/invalid-registration-token")
    ) {
      stale.push(tokens[idx]);
    }
  });
  if (stale.length) {
    const all = await db.collection(COLLECTIONS.fcmTokens).get();
    const batch = db.batch();
    for (const docSnap of all.docs) {
      if (stale.includes(String(docSnap.data().token ?? ""))) {
        batch.delete(docSnap.ref);
      }
    }
    await batch.commit();
  }

  return res.successCount;
}

/**
 * Create (or reuse) an ops notice, queue mail, and optionally FCM-alarm staff.
 */
export async function enqueueNotice(input: NoticeInput): Promise<{
  id: string;
  reused: boolean;
}> {
  if (input.dedupeKey) {
    const existing = await findByDedupeKey(input.dedupeKey);
    if (existing) {
      return {id: existing.id, reused: true};
    }
  }

  const ref = noticeRef();
  const now = new Date().toISOString();
  const channel = input.channel ?? "email+push";

  const staffSubject = input.staffSubject ?? input.subject;
  const staffDetail = input.staffDetail ?? input.detail;

  const record = stripUndefined({
    id: ref.id,
    kind: input.kind,
    status: "queued" as NoticeStatus,
    channel,
    subscriberId: input.subscriberId,
    requestId: input.requestId,
    packageId: input.packageId,
    subscriptionId: input.subscriptionId,
    toEmail: input.toEmail.trim().toLowerCase(),
    toName: input.toName,
    subject: input.subject,
    detail: input.detail,
    // Staff UI / browser alert copy (may differ from customer email)
    staffSubject,
    staffDetail,
    createdAt: now,
    updatedAt: now,
    scheduledAt: input.scheduledAt ?? now,
    dedupeKey: input.dedupeKey,
    mailQueued: false,
    fcmSent: false,
    unread: true,
  });

  await ref.set(record);

  let mailQueued = false;
  let fcmSent = false;
  let status: NoticeStatus = "queued";
  let lastError: string | undefined;
  let sentAt: string | undefined;

  try {
    await queueMailDoc({
      to: input.toEmail.trim().toLowerCase(),
      subject: input.subject.en,
      text: input.detail.en,
      html: `<p>${input.detail.en}</p><p dir="rtl">${input.detail.ar}</p>`,
      noticeId: ref.id,
    });
    mailQueued = true;
    // Mail is handed to the Trigger Email extension (or equivalent).
    // Mark sent once queued — bounce handling can flip to failed later.
    status = "sent";
    sentAt = now;
  } catch (err) {
    status = "failed";
    lastError = err instanceof Error ? err.message : "mail_queue_failed";
  }

  if (input.alarmStaff !== false) {
    try {
      const count = await sendStaffAlarm({
        title: staffSubject.en,
        body: staffDetail.en,
        titleEn: staffSubject.en,
        titleAr: staffSubject.ar,
        bodyEn: staffDetail.en,
        bodyAr: staffDetail.ar,
        noticeId: ref.id,
        kind: input.kind,
      });
      fcmSent = count > 0;
    } catch (err) {
      lastError =
        lastError ||
        (err instanceof Error ? err.message : "fcm_alarm_failed");
    }
  }

  await ref.set(
    stripUndefined({
      status,
      mailQueued,
      fcmSent,
      lastError,
      sentAt,
      updatedAt: new Date().toISOString(),
    }),
    {merge: true},
  );

  return {id: ref.id, reused: false};
}

export async function dispatchExistingNotice(noticeId: string): Promise<{
  id: string;
  status: NoticeStatus;
}> {
  const ref = db.collection(COLLECTIONS.notices).doc(noticeId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Notice not found");
  }
  const data = snap.data() ?? {};
  const toEmail = String(data.toEmail ?? "").trim().toLowerCase();
  if (!toEmail) throw new Error("Notice has no recipient email");

  const subject = (data.subject ?? {}) as {en?: string; ar?: string};
  const detail = (data.detail ?? {}) as {en?: string; ar?: string};
  const now = new Date().toISOString();

  try {
    await queueMailDoc({
      to: toEmail,
      subject: String(subject.en ?? "Derpy Fit"),
      text: String(detail.en ?? ""),
      html: `<p>${String(detail.en ?? "")}</p><p dir="rtl">${String(detail.ar ?? "")}</p>`,
      noticeId,
    });
    await sendStaffAlarm({
      title: String(subject.en ?? "Derpy Fit"),
      body: String(detail.en ?? ""),
      noticeId,
      kind: String(data.kind ?? ""),
    });
    await ref.set(
      {
        status: "sent",
        mailQueued: true,
        fcmSent: true,
        sentAt: now,
        updatedAt: now,
        lastError: FieldValue.delete(),
      },
      {merge: true},
    );
    return {id: noticeId, status: "sent"};
  } catch (err) {
    const message = err instanceof Error ? err.message : "dispatch_failed";
    await ref.set(
      {
        status: "failed",
        lastError: message,
        updatedAt: now,
      },
      {merge: true},
    );
    throw err;
  }
}
