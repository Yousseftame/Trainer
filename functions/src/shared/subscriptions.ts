import {db} from "../config/firebase.js";
import {COLLECTIONS} from "../config/collections.js";
import type {UserStatus} from "../lib/types.js";
import {stripUndefined} from "../lib/utils.js";
import {normalizeEntitlements} from "./contentAccess.js";

export async function syncSubscriptionForStatus(
  subscriberId: string,
  status: UserStatus,
  adminName: string,
  notes?: string,
): Promise<void> {
  const snap = await db
    .collection(COLLECTIONS.subscriptions)
    .where("subscriberId", "==", subscriberId)
    .get();

  if (snap.empty) return;

  const now = new Date().toISOString();
  const batch = db.batch();

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const current = String(data.status ?? "");
    if (
      (status === "suspended" || status === "rejected") &&
      current === "active"
    ) {
      batch.update(docSnap.ref, {
        status: status === "rejected" ? "cancelled" : "suspended",
        updatedAt: now,
        notes:
          notes ??
          (status === "rejected"
            ? "Account deactivated by admin"
            : "Account suspended by admin"),
        activatedBy: adminName,
      });
    } else if (status === "active" && current === "suspended") {
      batch.update(docSnap.ref, {
        status: "active",
        updatedAt: now,
        notes: notes ?? "Account reactivated by admin",
        activatedBy: adminName,
      });
    }
  }

  await batch.commit();
}

export async function createInitialSubscription(input: {
  subscriberId: string;
  subscriberName: string;
  subscriberEmail: string;
  packageId: string;
  status: "active" | "pending";
  startsAt?: string | null;
  endsAt?: string | null;
  activatedBy: string;
  notes?: string;
}): Promise<void> {
  const pkgSnap = await db.collection(COLLECTIONS.packages).doc(input.packageId).get();
  const pkg = pkgSnap.exists ? pkgSnap.data() : undefined;
  const now = new Date().toISOString();
  const startsAt = input.startsAt || now;
  let endsAt = input.endsAt || null;
  if (!endsAt && pkg?.durationDays) {
    const start = new Date(startsAt);
    start.setUTCDate(start.getUTCDate() + Number(pkg.durationDays));
    endsAt = start.toISOString();
  }

  const subId = db.collection(COLLECTIONS.subscriptions).doc().id;
  const open = await db
    .collection(COLLECTIONS.subscriptions)
    .where("subscriberId", "==", input.subscriberId)
    .get();

  const batch = db.batch();
  for (const docSnap of open.docs) {
    const st = String(docSnap.data().status ?? "");
    if (st === "active" || st === "pending" || st === "suspended") {
      batch.update(docSnap.ref, {
        status: "cancelled",
        updatedAt: now,
        notes: "Replaced by new assignment",
      });
    }
  }

  batch.set(
    db.collection(COLLECTIONS.subscriptions).doc(subId),
    stripUndefined({
      id: subId,
      subscriberId: input.subscriberId,
      subscriberName: input.subscriberName,
      subscriberEmail: input.subscriberEmail,
      packageId: input.packageId,
      packageName: pkg?.name ?? {en: input.packageId, ar: input.packageId},
      entitlementsSnapshot: normalizeEntitlements(
        (pkg?.entitlements as Record<string, boolean> | undefined) ?? null,
      ),
      status: input.status,
      startsAt,
      endsAt,
      activatedBy: input.activatedBy,
      notes: input.notes ?? "Initial onboarding subscription",
      createdAt: now,
      updatedAt: now,
    }),
  );

  await batch.commit();
}
