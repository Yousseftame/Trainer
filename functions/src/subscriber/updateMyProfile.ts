import {getAuth} from "firebase-admin/auth";
import {FieldValue} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {COLLECTIONS} from "../config/collections.js";
import {db} from "../config/firebase.js";
import {assertSubscriberCaller} from "../lib/authz.js";
import {normalizeBilingual, stripUndefined} from "../lib/utils.js";

function asOptionalString(value: unknown, max = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function asOptionalLocale(value: unknown): "en" | "ar" | undefined {
  return value === "en" || value === "ar" ? value : undefined;
}

function asOptionalSex(value: unknown): "male" | "female" | undefined {
  return value === "male" || value === "female" ? value : undefined;
}

function asOptionalPositive(
  value: unknown,
  min: number,
  max: number,
): number | null | undefined {
  if (value === null) return null;
  if (value === undefined || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new HttpsError("invalid-argument", "Invalid numeric profile field.");
  }
  if (n <= 0) return null;
  if (n < min || n > max) {
    throw new HttpsError(
      "invalid-argument",
      `Value must be between ${min} and ${max}.`,
    );
  }
  return n;
}

function mergeLocaleText(
  existing: {en?: string; ar?: string} | undefined,
  locale: "en" | "ar",
  text: string | undefined,
  clear: boolean,
): {en: string; ar: string} | null | undefined {
  if (clear) return null;
  if (text === undefined) return undefined;
  const next = {
    en: existing?.en ?? "",
    ar: existing?.ar ?? "",
  };
  next[locale] = text;
  if (!next.en && !next.ar) return null;
  if (!next.en) next.en = next.ar;
  if (!next.ar) next.ar = next.en;
  return next;
}

/**
 * Subscriber-only: update permitted soft-profile fields on own document.
 * Never touches email, status, coachNotes, package prefs, or entitlements.
 */
export const updateMySubscriberProfile = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  const data = (request.data ?? {}) as Record<string, unknown>;

  const ref = db.collection(COLLECTIONS.subscribers).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Subscriber profile not found.");
  }

  const existing = snap.data() as Record<string, unknown>;
  const accountStatus = String(existing.status ?? "pending");
  if (accountStatus !== "active") {
    throw new HttpsError(
      "permission-denied",
      "Only active subscriber accounts can update profile details.",
    );
  }
  const locale =
    asOptionalLocale(data.locale) ||
    (existing.locale === "en" ? "en" : "ar");

  const displayName = asOptionalString(data.displayName, 80);
  if (data.displayName !== undefined && !displayName) {
    throw new HttpsError("invalid-argument", "displayName is required.");
  }

  const phoneRaw = data.phone;
  const phone =
    phoneRaw === undefined
      ? undefined
      : asOptionalString(phoneRaw, 40) || "";

  const sex =
    data.sex === null || data.sex === ""
      ? null
      : data.sex === undefined
        ? undefined
        : asOptionalSex(data.sex);

  const age = asOptionalPositive(data.age, 10, 100);
  const heightCm = asOptionalPositive(data.heightCm, 100, 250);
  const startingWeightKg = asOptionalPositive(data.startingWeightKg, 30, 400);
  const targetWeightKg = asOptionalPositive(data.targetWeightKg, 30, 400);

  const goalText =
    data.goalText === undefined
      ? undefined
      : asOptionalString(data.goalText, 500) || "";
  const healthText =
    data.healthNotesText === undefined
      ? undefined
      : asOptionalString(data.healthNotesText, 2000) || "";

  const existingGoal = normalizeBilingual(existing.goal);
  const existingHealth = normalizeBilingual(existing.healthNotes);
  const existingName = normalizeBilingual(existing.name, String(existing.displayName ?? ""));

  const nextDisplayName = displayName || String(existing.displayName ?? "");
  const nextName =
    displayName !== undefined
      ? {
          en:
            locale === "en"
              ? displayName
              : existingName?.en || displayName,
          ar:
            locale === "ar"
              ? displayName
              : existingName?.ar || displayName,
        }
      : undefined;

  const nextGoal = mergeLocaleText(
    existingGoal,
    locale,
    goalText === "" ? undefined : goalText,
    goalText === "",
  );
  const nextHealth = mergeLocaleText(
    existingHealth,
    locale,
    healthText === "" ? undefined : healthText,
    healthText === "",
  );

  const patch = stripUndefined({
    displayName: displayName,
    name: nextName,
    phone,
    locale,
    sex: sex === null ? FieldValue.delete() : sex,
    age:
      age === null
        ? FieldValue.delete()
        : age === undefined
          ? undefined
          : Math.round(age),
    heightCm:
      heightCm === null
        ? FieldValue.delete()
        : heightCm === undefined
          ? undefined
          : Math.round(heightCm),
    startingWeightKg:
      startingWeightKg === null
        ? FieldValue.delete()
        : startingWeightKg === undefined
          ? undefined
          : Number(startingWeightKg),
    targetWeightKg:
      targetWeightKg === null
        ? FieldValue.delete()
        : targetWeightKg === undefined
          ? undefined
          : Number(targetWeightKg),
    goal: nextGoal === null ? FieldValue.delete() : nextGoal,
    healthNotes: nextHealth === null ? FieldValue.delete() : nextHealth,
    updatedAt: new Date().toISOString(),
  });

  if (Object.keys(patch).length <= 1 && patch.updatedAt) {
    // locale-only or empty — still allow locale + updatedAt
  }

  await ref.set(patch, {merge: true});

  if (displayName && displayName !== String(existing.displayName ?? "")) {
    try {
      await getAuth().updateUser(uid, {displayName: nextDisplayName});
    } catch (err) {
      console.warn("[updateMySubscriberProfile] Auth displayName sync failed:", err);
    }
  }

  const fresh = await ref.get();
  return {
    ok: true,
    subscriber: {id: uid, ...(fresh.data() ?? {})},
  };
});
