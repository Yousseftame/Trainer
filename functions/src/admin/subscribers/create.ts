import {HttpsError, onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {
  buildSubscriberRecord,
  normalizeBilingual,
  parseLocale,
  parseSex,
  parseStatus,
  setSubscriberClaims,
} from "../../shared/subscribers.js";
import {createInitialSubscription} from "../../shared/subscriptions.js";

export const createSubscriberAccount = onCall(async (request) => {
  assertStaffCaller(request.auth, "subscribers:write");
  const data = (request.data ?? {}) as Record<string, unknown>;

  const email = String(data.email ?? "").trim().toLowerCase();
  const password = String(data.password ?? "").trim() || "Member@123456";
  const displayName = String(data.displayName ?? "").trim();
  if (!email || !displayName) {
    throw new HttpsError("invalid-argument", "Email and display name are required.");
  }
  if (password.length < 6) {
    throw new HttpsError("invalid-argument", "Password must be at least 6 characters.");
  }

  const locale = parseLocale(data.locale);
  const status = parseStatus(data.status, "active");

  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password,
      displayName,
      disabled: status === "suspended" || status === "rejected",
    });
  } catch (err) {
    const code = (err as {code?: string})?.code;
    if (code === "auth/email-already-exists") {
      throw new HttpsError(
        "already-exists",
        "An account with this email already exists.",
      );
    }
    throw err;
  }

  const uid = userRecord.uid;
  await setSubscriberClaims(uid, status);

  const record = buildSubscriberRecord({
    id: uid,
    displayName,
    name: normalizeBilingual(data.name, displayName),
    email,
    phone: String(data.phone ?? ""),
    status,
    locale,
    sex: parseSex(data.sex),
    age: typeof data.age === "number" ? data.age : undefined,
    heightCm: typeof data.heightCm === "number" ? data.heightCm : undefined,
    startingWeightKg:
      typeof data.startingWeightKg === "number" ? data.startingWeightKg : undefined,
    targetWeightKg:
      typeof data.targetWeightKg === "number" ? data.targetWeightKg : undefined,
    goal: normalizeBilingual(data.goal),
    healthNotes: normalizeBilingual(data.healthNotes),
    coachNotes: normalizeBilingual(data.coachNotes),
    preferredPackageId:
      typeof data.preferredPackageId === "string"
        ? data.preferredPackageId
        : typeof (data.initialSubscription as {packageId?: string} | undefined)
            ?.packageId === "string"
          ? (data.initialSubscription as {packageId: string}).packageId
          : undefined,
  });

  await db.collection(COLLECTIONS.subscribers).doc(uid).set(record);

  const initial = data.initialSubscription as
    | {
        packageId?: string;
        status?: "active" | "pending";
        startsAt?: string | null;
        endsAt?: string | null;
        activatedBy?: string;
        notes?: string;
      }
    | undefined;

  const packageId = initial?.packageId || record.preferredPackageId;
  if (typeof packageId === "string" && packageId) {
    await createInitialSubscription({
      subscriberId: uid,
      subscriberName: displayName,
      subscriberEmail: email,
      packageId,
      status: initial?.status || "active",
      startsAt: initial?.startsAt,
      endsAt: initial?.endsAt,
      activatedBy: initial?.activatedBy || "Head Coach",
      notes: initial?.notes,
    });
  }

  return {uid, subscriber: record};
});
