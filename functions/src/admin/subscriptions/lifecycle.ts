import type {WriteBatch} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {COLLECTIONS} from "../../config/collections.js";
import {db} from "../../config/firebase.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {stripUndefined} from "../../lib/utils.js";
import {normalizeEntitlements} from "../../shared/contentAccess.js";

type Localized = {en: string; ar: string};

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function asLocalized(value: unknown): Localized | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  const en = asOptionalString(obj.en);
  const ar = asOptionalString(obj.ar);
  if (!en && !ar) return undefined;
  return {en: en || ar || "", ar: ar || en || ""};
}

function computeEndsAtIso(startsAtIso: string, durationDays: number): string {
  const start = new Date(startsAtIso);
  const base = Number.isNaN(start.getTime()) ? new Date() : start;
  const end = new Date(base.getTime() + Math.max(1, durationDays) * 86_400_000);
  return end.toISOString();
}

async function closeOpenSeats(
  batch: WriteBatch,
  subscriberId: string,
  exceptId: string | null,
  now: string,
) {
  const open = await db
    .collection(COLLECTIONS.subscriptions)
    .where("subscriberId", "==", subscriberId)
    .get();
  for (const docSnap of open.docs) {
    if (exceptId && docSnap.id === exceptId) continue;
    const st = String(docSnap.data().status ?? "");
    if (st === "active" || st === "pending" || st === "suspended") {
      batch.update(docSnap.ref, {
        status: "expired",
        endsAt: docSnap.data().endsAt ?? now,
        updatedAt: now,
      });
    }
  }
}

async function ensureSubscriberActive(subscriberId: string) {
  const ref = db.collection(COLLECTIONS.subscribers).doc(subscriberId);
  const snap = await ref.get();
  if (!snap.exists) return;
  if (String(snap.data()?.status ?? "") !== "active") {
    await ref.update({status: "active", updatedAt: new Date().toISOString()});
  }
}

async function createActiveAssignment(input: {
  subscriberId: string;
  subscriberName?: string;
  subscriberEmail?: string;
  packageId: string;
  pkg: Record<string, unknown>;
  startsAt: string;
  endsAt: string;
  activatedBy: string;
  notes?: string;
  notesLocalized?: Localized;
  renewedFromId?: string;
}) {
  const now = new Date().toISOString();
  const id = db.collection(COLLECTIONS.subscriptions).doc().id;
  const record = stripUndefined({
    id,
    subscriberId: input.subscriberId,
    subscriberName: input.subscriberName,
    subscriberEmail: input.subscriberEmail,
    packageId: input.packageId,
    packageName: input.pkg.name ?? {
      en: input.packageId,
      ar: input.packageId,
    },
    entitlementsSnapshot: normalizeEntitlements(
      (input.pkg.entitlements as Record<string, boolean> | undefined) ?? null,
    ),
    status: "active" as const,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    activatedBy: input.activatedBy,
    notes: input.notes,
    notesLocalized: input.notesLocalized,
    renewedFromId: input.renewedFromId,
    createdAt: now,
    updatedAt: now,
  });

  const batch = db.batch();
  await closeOpenSeats(batch, input.subscriberId, null, now);
  batch.set(db.collection(COLLECTIONS.subscriptions).doc(id), record);
  await batch.commit();
  await ensureSubscriberActive(input.subscriberId);
  return record;
}

/**
 * Staff-only: assign a package / open a new subscription cycle.
 */
export const assignSubscription = onCall(async (request) => {
  const caller = assertStaffCaller(request.auth, "subscriptions:manage");
  const subscriberId = asOptionalString(request.data?.subscriberId);
  const packageId = asOptionalString(request.data?.packageId);
  const statusRaw = asOptionalString(request.data?.status) || "active";
  if (!subscriberId || !packageId) {
    throw new HttpsError(
      "invalid-argument",
      "subscriberId and packageId are required.",
    );
  }
  if (statusRaw !== "active" && statusRaw !== "pending") {
    throw new HttpsError("invalid-argument", "status must be active or pending.");
  }

  const pkgSnap = await db.collection(COLLECTIONS.packages).doc(packageId).get();
  if (!pkgSnap.exists) {
    throw new HttpsError("not-found", "Package not found.");
  }
  const pkg = pkgSnap.data() as Record<string, unknown>;
  const durationDays = Number(pkg.durationDays) || 30;
  const now = new Date().toISOString();
  const isActivating = statusRaw === "active";
  const startsAt =
    (isActivating
      ? asOptionalString(request.data?.startsAt) || now
      : asOptionalString(request.data?.startsAt)) || null;
  const endsAt = isActivating
    ? asOptionalString(request.data?.endsAt) ||
      computeEndsAtIso(startsAt ?? now, durationDays)
    : asOptionalString(request.data?.endsAt) || null;

  const notesLocalized = asLocalized(request.data?.notesLocalized);
  const notes =
    asOptionalString(request.data?.notes) || notesLocalized?.en || undefined;
  const activatedBy =
    asOptionalString(request.data?.activatedBy) ||
    (caller.claims as {role?: string}).role ||
    caller.uid;

  if (isActivating) {
    const record = await createActiveAssignment({
      subscriberId,
      subscriberName: asOptionalString(request.data?.subscriberName),
      subscriberEmail: asOptionalString(request.data?.subscriberEmail),
      packageId,
      pkg,
      startsAt: startsAt ?? now,
      endsAt: endsAt ?? computeEndsAtIso(startsAt ?? now, durationDays),
      activatedBy,
      notes,
      notesLocalized,
      renewedFromId: asOptionalString(request.data?.renewedFromId),
    });
    return {ok: true, subscription: record};
  }

  const id = db.collection(COLLECTIONS.subscriptions).doc().id;
  const record = stripUndefined({
    id,
    subscriberId,
    subscriberName: asOptionalString(request.data?.subscriberName),
    subscriberEmail: asOptionalString(request.data?.subscriberEmail),
    packageId,
    packageName: pkg.name ?? {en: packageId, ar: packageId},
    entitlementsSnapshot: normalizeEntitlements(
      (pkg.entitlements as Record<string, boolean> | undefined) ?? null,
    ),
    status: statusRaw,
    startsAt,
    endsAt,
    notes,
    notesLocalized,
    renewedFromId: asOptionalString(request.data?.renewedFromId),
    createdAt: now,
    updatedAt: now,
  });
  await db.collection(COLLECTIONS.subscriptions).doc(id).set(record);
  return {ok: true, subscription: record};
});

/**
 * Staff-only: activate / renew / suspend / terminate / edit a subscription.
 */
export const updateSubscriptionLifecycle = onCall(async (request) => {
  const caller = assertStaffCaller(request.auth, "subscriptions:manage");
  const subscriptionId = asOptionalString(request.data?.subscriptionId);
  const action = asOptionalString(request.data?.action);
  if (!subscriptionId || !action) {
    throw new HttpsError(
      "invalid-argument",
      "subscriptionId and action are required.",
    );
  }

  const allowed = ["activate", "renew", "suspend", "terminate", "edit"] as const;
  if (!allowed.includes(action as (typeof allowed)[number])) {
    throw new HttpsError("invalid-argument", "Invalid lifecycle action.");
  }

  const existingSnap = await db
    .collection(COLLECTIONS.subscriptions)
    .doc(subscriptionId)
    .get();
  if (!existingSnap.exists) {
    throw new HttpsError("not-found", "Subscription not found.");
  }
  const existing = existingSnap.data() as Record<string, unknown>;
  const packageId =
    asOptionalString(request.data?.packageId) ||
    asOptionalString(existing.packageId);
  if (!packageId) {
    throw new HttpsError("failed-precondition", "Package id missing.");
  }

  const pkgSnap = await db.collection(COLLECTIONS.packages).doc(packageId).get();
  if (!pkgSnap.exists) {
    throw new HttpsError("not-found", "Package not found.");
  }
  const pkg = pkgSnap.data() as Record<string, unknown>;
  const durationDays = Number(pkg.durationDays) || 30;
  const now = new Date().toISOString();
  const subscriberId = String(existing.subscriberId);
  const activatedBy =
    asOptionalString(request.data?.activatedBy) ||
    asOptionalString(existing.activatedBy) ||
    caller.uid;

  if (action === "renew") {
    const startsAt = asOptionalString(request.data?.startsAt) || now;
    const endsAt =
      asOptionalString(request.data?.endsAt) ||
      computeEndsAtIso(startsAt, durationDays);
    const notesLocalized = asLocalized(request.data?.notesLocalized);
    const notes =
      asOptionalString(request.data?.notes) || notesLocalized?.en || undefined;
    const record = await createActiveAssignment({
      subscriberId,
      subscriberName:
        asOptionalString(request.data?.subscriberName) ||
        asOptionalString(existing.subscriberName),
      subscriberEmail:
        asOptionalString(request.data?.subscriberEmail) ||
        asOptionalString(existing.subscriberEmail),
      packageId,
      pkg,
      startsAt,
      endsAt,
      activatedBy,
      notes,
      notesLocalized,
      renewedFromId: subscriptionId,
    });
    return {ok: true, subscription: record};
  }

  let nextStatus = String(existing.status);
  let nextStartsAt = (existing.startsAt as string | null) ?? null;
  let nextEndsAt = (existing.endsAt as string | null) ?? null;
  let nextActivatedBy = asOptionalString(existing.activatedBy);

  if (action === "activate") {
    nextStatus = "active";
    nextStartsAt =
      asOptionalString(request.data?.startsAt) || nextStartsAt || now;
    nextEndsAt =
      asOptionalString(request.data?.endsAt) ||
      computeEndsAtIso(nextStartsAt, durationDays);
    nextActivatedBy = activatedBy;
  } else if (action === "suspend") {
    nextStatus = "suspended";
    if (request.data?.startsAt !== undefined) {
      nextStartsAt = asOptionalString(request.data?.startsAt) || null;
    }
    if (request.data?.endsAt !== undefined) {
      nextEndsAt = asOptionalString(request.data?.endsAt) || null;
    }
  } else if (action === "terminate") {
    nextStatus = "cancelled";
    nextEndsAt = asOptionalString(request.data?.endsAt) || now;
  } else if (action === "edit") {
    nextStatus = asOptionalString(request.data?.status) || nextStatus;
    if (request.data?.startsAt !== undefined) {
      nextStartsAt = asOptionalString(request.data?.startsAt) || null;
    }
    if (request.data?.endsAt !== undefined) {
      nextEndsAt = asOptionalString(request.data?.endsAt) || null;
    }
    if (nextStatus === "active" && !nextStartsAt) nextStartsAt = now;
    if (nextStatus === "active" && !nextEndsAt) {
      nextEndsAt = computeEndsAtIso(nextStartsAt ?? now, durationDays);
    }
  }

  const notesLocalized =
    asLocalized(request.data?.notesLocalized) ||
    asLocalized(existing.notesLocalized);
  const notes =
    asOptionalString(request.data?.notes) ||
    notesLocalized?.en ||
    asOptionalString(existing.notes);

  const updated = stripUndefined({
    ...existing,
    id: subscriptionId,
    packageId,
    packageName: pkg.name ?? {en: packageId, ar: packageId},
    entitlementsSnapshot: normalizeEntitlements(
      (pkg.entitlements as Record<string, boolean> | undefined) ?? null,
    ),
    status: nextStatus,
    startsAt: nextStartsAt,
    endsAt: nextEndsAt,
    activatedBy: nextActivatedBy,
    notes,
    notesLocalized,
    updatedAt: now,
  });

  const batch = db.batch();
  if (nextStatus === "active") {
    await closeOpenSeats(batch, subscriberId, subscriptionId, now);
  }
  batch.set(
    db.collection(COLLECTIONS.subscriptions).doc(subscriptionId),
    updated,
  );
  await batch.commit();

  if (nextStatus === "active") {
    await ensureSubscriberActive(subscriberId);
  }

  return {ok: true, subscription: updated};
});

/**
 * Staff-only: resolve a subscriber package-change request.
 * When decision=approved and assignNow=true, also opens an active seat.
 */
export const resolveSubscriptionChangeRequest = onCall(async (request) => {
  const caller = assertStaffCaller(request.auth, "subscriptions:manage");
  const requestId = asOptionalString(request.data?.requestId);
  const decision = asOptionalString(request.data?.decision);
  if (!requestId || (decision !== "approved" && decision !== "rejected")) {
    throw new HttpsError(
      "invalid-argument",
      "requestId and decision (approved|rejected) are required.",
    );
  }

  const ref = db
    .collection(COLLECTIONS.subscriptionChangeRequests)
    .doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Change request not found.");
  }
  const data = snap.data() as Record<string, unknown>;
  if (String(data.status) !== "pending") {
    throw new HttpsError("failed-precondition", "Request is not pending.");
  }

  const now = new Date().toISOString();
  let subscription: Record<string, unknown> | undefined;

  if (decision === "approved" && request.data?.assignNow === true) {
    const packageId = asOptionalString(data.packageId);
    if (!packageId) {
      throw new HttpsError("failed-precondition", "Request has no packageId.");
    }
    const pkgSnap = await db.collection(COLLECTIONS.packages).doc(packageId).get();
    if (!pkgSnap.exists) {
      throw new HttpsError("not-found", "Package not found.");
    }
    const pkg = pkgSnap.data() as Record<string, unknown>;
    const durationDays = Number(pkg.durationDays) || 30;
    const startsAt = now;
    const endsAt = computeEndsAtIso(startsAt, durationDays);
    subscription = await createActiveAssignment({
      subscriberId: String(data.subscriberId),
      subscriberName: asOptionalString(data.subscriberName),
      subscriberEmail: asOptionalString(data.subscriberEmail),
      packageId,
      pkg,
      startsAt,
      endsAt,
      activatedBy: caller.uid,
      notes: "Assigned from approved package change request",
      notesLocalized: {
        en: "Assigned from approved package change request",
        ar: "تم التعيين من طلب تغيير باقة معتمد",
      },
    });
  }

  const updated = stripUndefined({
    ...data,
    status: decision,
    resolvedAt: now,
    updatedAt: now,
    resolutionNote: asOptionalString(request.data?.resolutionNote),
  });
  await ref.set(updated);

  return {ok: true, request: updated, subscription};
});
