import {auth} from "../config/firebase.js";
import type {Bilingual, Locale, UserStatus} from "../lib/types.js";
import {normalizeBilingual, stripUndefined} from "../lib/utils.js";

export async function setSubscriberClaims(
  uid: string,
  status: UserStatus,
): Promise<void> {
  await auth.setCustomUserClaims(uid, {
    role: "subscriber",
    status,
    permissions: [],
  });
}

export async function applyAuthAccess(
  uid: string,
  status: UserStatus,
): Promise<void> {
  const disabled = status === "suspended" || status === "rejected";
  try {
    await auth.updateUser(uid, {disabled});
  } catch (err) {
    const code = (err as {code?: string})?.code;
    if (code !== "auth/user-not-found") throw err;
  }
  try {
    await setSubscriberClaims(uid, status);
  } catch (err) {
    const code = (err as {code?: string})?.code;
    if (code !== "auth/user-not-found") throw err;
  }
}

export function buildSubscriberRecord(input: {
  id: string;
  displayName: string;
  name?: Bilingual;
  email: string;
  phone: string;
  status: UserStatus;
  locale: Locale;
  sex?: "male" | "female";
  age?: number;
  heightCm?: number;
  startingWeightKg?: number;
  targetWeightKg?: number;
  goal?: Bilingual;
  healthNotes?: Bilingual;
  coachNotes?: Bilingual;
  preferredPackageId?: string;
  registrationRequestId?: string;
  createdAt?: string;
}): Record<string, unknown> {
  const now = new Date().toISOString();
  const name = input.name ?? {en: input.displayName, ar: input.displayName};
  return stripUndefined({
    id: input.id,
    displayName: input.displayName,
    name,
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    status: input.status,
    locale: input.locale,
    sex: input.sex,
    age: input.age,
    heightCm: input.heightCm,
    startingWeightKg: input.startingWeightKg,
    targetWeightKg: input.targetWeightKg,
    goal: input.goal,
    healthNotes: input.healthNotes,
    coachNotes: input.coachNotes,
    preferredPackageId: input.preferredPackageId,
    registrationRequestId: input.registrationRequestId,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  });
}

export function parseLocale(raw: unknown): Locale {
  return raw === "en" ? "en" : "ar";
}

export function parseStatus(raw: unknown, fallback: UserStatus = "active"): UserStatus {
  return raw === "pending" ||
    raw === "active" ||
    raw === "suspended" ||
    raw === "rejected"
    ? raw
    : fallback;
}

export function parseSex(raw: unknown): "male" | "female" | undefined {
  return raw === "male" || raw === "female" ? raw : undefined;
}

export {normalizeBilingual};
