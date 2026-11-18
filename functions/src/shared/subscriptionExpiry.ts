import {COLLECTIONS} from "../config/collections.js";
import {db} from "../config/firebase.js";
import {enqueueNotice} from "./notices.js";

function bilingual(en: string, ar: string) {
  return {en, ar};
}

async function resolveRecipient(data: Record<string, unknown>): Promise<{
  toEmail: string;
  toName: string;
  subscriberId: string;
} | null> {
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
  if (!toEmail) return null;
  return {toEmail, toName: toName || toEmail, subscriberId};
}

async function resolvePackageName(packageId: string): Promise<string> {
  if (!packageId) return "package";
  const pkgSnap = await db.collection(COLLECTIONS.packages).doc(packageId).get();
  if (!pkgSnap.exists) return packageId;
  const name = pkgSnap.data()?.name as {en?: string; ar?: string} | undefined;
  return String(name?.en || name?.ar || packageId);
}

/**
 * Mark past-due active seats as expired, notify subscriber + staff,
 * and touch the subscriber profile timestamp for admin roster freshness.
 */
export async function expirePastDueSubscriptions(
  now: Date = new Date(),
): Promise<number> {
  const nowIso = now.toISOString();
  const snap = await db
    .collection(COLLECTIONS.subscriptions)
    .where("status", "==", "active")
    .get();

  let expiredCount = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const endsAt = data.endsAt ? String(data.endsAt) : "";
    if (!endsAt) continue;
    const endMs = new Date(endsAt).getTime();
    if (Number.isNaN(endMs) || endMs >= now.getTime()) continue;

    const packageId = String(data.packageId ?? "");
    const packageName = await resolvePackageName(packageId);
    const recipient = await resolveRecipient(
      data as Record<string, unknown>,
    );

    const updatePayload: Record<string, string> = {
      status: "expired",
      updatedAt: nowIso,
    };
    if (!data.notes) {
      updatePayload.notes =
        "Automatically expired when subscription duration ended";
    }
    await docSnap.ref.update(updatePayload);

    const subscriberId = String(data.subscriberId ?? "");
    if (subscriberId) {
      try {
        await db
          .collection(COLLECTIONS.subscribers)
          .doc(subscriberId)
          .set(
            {
              updatedAt: nowIso,
              lastSubscriptionStatus: "expired",
              lastSubscriptionEndsAt: endsAt,
              lastSubscriptionPackageId: packageId || null,
            },
            {merge: true},
          );
      } catch {
        // Profile touch is best-effort — expiry on the seat is authoritative.
      }
    }

    if (recipient) {
      await enqueueNotice({
        kind: "expiration",
        toEmail: recipient.toEmail,
        toName: recipient.toName,
        subscriberId: recipient.subscriberId || undefined,
        packageId: packageId || undefined,
        subscriptionId: docSnap.id,
        dedupeKey: `expired:${docSnap.id}`,
        subject: bilingual(
          `${packageName} has ended`,
          `انتهت باقة ${packageName}`,
        ),
        detail: bilingual(
          `Your ${packageName} subscription ended on ${endsAt.slice(0, 10)}. Contact your coach to renew and restore access.`,
          `انتهى اشتراك باقة ${packageName} في ${endsAt.slice(0, 10)}. تواصل مع المدرب للتجديد واستعادة الوصول.`,
        ),
        alarmStaff: true,
        actionUrl: `/admin/subscriptions?subscriber=${encodeURIComponent(subscriberId)}`,
      });
    }

    expiredCount += 1;
  }

  return expiredCount;
}

export function daysUntilEndsAt(endsAt: string, now: Date): number {
  return Math.ceil(
    (new Date(endsAt).getTime() - now.getTime()) / 86_400_000,
  );
}

/** Reminder thresholds that work for both short (12d) and long packages. */
export const EXPIRATION_REMINDER_DAYS = [14, 7, 3, 1] as const;
