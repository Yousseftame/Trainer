import {HttpsError, onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import type {Bilingual, Locale} from "../../lib/types.js";
import {isFirebaseUid, stripUndefined} from "../../lib/utils.js";
import {
  buildSubscriberRecord,
  normalizeBilingual,
  setSubscriberClaims,
} from "../../shared/subscribers.js";
import {createInitialSubscription} from "../../shared/subscriptions.js";
import {enqueueNotice} from "../../shared/notices.js";

export const approveRegistrationRequest = onCall(async (request) => {
  const caller = assertStaffCaller(request.auth, "subscribers:approve");
  const data = (request.data ?? {}) as Record<string, unknown>;
  const requestId = String(data.requestId ?? "").trim();
  if (!requestId) {
    throw new HttpsError("invalid-argument", "requestId is required.");
  }

  const reqRef = db.collection(COLLECTIONS.registrationRequests).doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) {
    throw new HttpsError("not-found", "Registration request not found.");
  }
  const existing = reqSnap.data() ?? {};
  if (String(existing.status) !== "pending") {
    throw new HttpsError("failed-precondition", "Request already reviewed.");
  }

  const password = String(data.password ?? "").trim() || "Member@123456";
  if (password.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "Password must be at least 6 characters.",
    );
  }

  const email = String(existing.email ?? "").trim().toLowerCase();
  const displayName = String(
    existing.displayName ??
      (existing.name as Bilingual | undefined)?.en ??
      email,
  ).trim();
  const locale: Locale = existing.locale === "en" ? "en" : "ar";
  const selectedPkgId =
    data.packageId !== undefined
      ? (data.packageId as string | null)
      : (existing.packageId as string | null);

  const reviewNotesLocalized = normalizeBilingual(
    data.reviewNotesLocalized ?? data.reviewNotes,
  );

  let uid: string | undefined =
    typeof existing.subscriberId === "string" &&
    isFirebaseUid(existing.subscriberId)
      ? existing.subscriberId
      : undefined;

  if (!uid) {
    try {
      const created = await auth.createUser({
        email,
        password,
        displayName,
        disabled: false,
      });
      uid = created.uid;
    } catch (err) {
      const code = (err as {code?: string})?.code;
      if (code === "auth/email-already-exists") {
        const existingUser = await auth.getUserByEmail(email);
        uid = existingUser.uid;
        await auth.updateUser(uid, {disabled: false, displayName});
        if (password) {
          await auth.updateUser(uid, {password});
        }
      } else {
        throw err;
      }
    }
  } else {
    await auth.updateUser(uid, {disabled: false, displayName});
    if (password) {
      await auth.updateUser(uid, {password});
    }
  }

  await setSubscriberClaims(uid, "active");

  const now = new Date().toISOString();
  const prevSub = await db.collection(COLLECTIONS.subscribers).doc(uid).get();
  const prev = prevSub.exists ? prevSub.data() ?? {} : {};

  const subscriber = buildSubscriberRecord({
    id: uid,
    displayName: String(prev.displayName ?? displayName),
    name: normalizeBilingual(prev.name ?? existing.name, displayName),
    email,
    phone: String(prev.phone ?? existing.phone ?? ""),
    status: "active",
    locale: (prev.locale as Locale) || locale,
    sex: prev.sex === "male" || prev.sex === "female" ? prev.sex : undefined,
    age: typeof prev.age === "number" ? prev.age : undefined,
    heightCm: typeof prev.heightCm === "number" ? prev.heightCm : undefined,
    startingWeightKg:
      typeof prev.startingWeightKg === "number" ? prev.startingWeightKg : undefined,
    targetWeightKg:
      typeof prev.targetWeightKg === "number" ? prev.targetWeightKg : undefined,
    goal: normalizeBilingual(prev.goal ?? existing.goal),
    healthNotes: normalizeBilingual(prev.healthNotes),
    coachNotes: normalizeBilingual(prev.coachNotes ?? reviewNotesLocalized),
    preferredPackageId: selectedPkgId ?? undefined,
    registrationRequestId: requestId,
    createdAt: typeof prev.createdAt === "string" ? prev.createdAt : now,
  });

  const reviewedBy = String(data.reviewedBy ?? "Head Coach");
  const updatedReq = stripUndefined({
    ...existing,
    id: requestId,
    status: "approved",
    packageId: selectedPkgId ?? existing.packageId ?? null,
    subscriberId: uid,
    reviewedBy,
    reviewNotes: reviewNotesLocalized?.en,
    reviewNotesLocalized,
    reviewedAt: now,
  });

  const batch = db.batch();
  batch.set(db.collection(COLLECTIONS.subscribers).doc(uid), subscriber);
  batch.set(reqRef, updatedReq);
  await batch.commit();

  if (data.assignPackage !== false && selectedPkgId) {
    await createInitialSubscription({
      subscriberId: uid,
      subscriberName: String(subscriber.displayName),
      subscriberEmail: email,
      packageId: selectedPkgId,
      status: (data.subscriptionStatus as "active" | "pending") || "active",
      startsAt: (data.startsAt as string | null | undefined) ?? null,
      endsAt: (data.endsAt as string | null | undefined) ?? null,
      activatedBy: reviewedBy,
      notes:
        reviewNotesLocalized?.en ||
        "Assigned upon registration request approval",
    });
  }

  await enqueueNotice({
    kind: "approval",
    toEmail: email,
    toName: displayName,
    subscriberId: uid,
    requestId,
    packageId: selectedPkgId ?? undefined,
    dedupeKey: `approval:${requestId}`,
    subject: {
      en: `${displayName}'s account is ready`,
      ar: `حساب ${displayName} جاهز`,
    },
    detail: {
      en: "Your registration was approved. Sign in to the subscriber panel to continue.",
      ar: "تمت الموافقة على طلبك. سجّل الدخول إلى لوحة المشترك للمتابعة.",
    },
    alarmStaff: true,
  });

  return {request: updatedReq, subscriber, approvedBy: caller.uid};
});
