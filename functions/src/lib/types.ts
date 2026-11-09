export type UserStatus = "pending" | "active" | "suspended" | "rejected";
export type Locale = "en" | "ar";
export type Bilingual = {en: string; ar: string};

export type CallerClaims = {
  role?: string;
  status?: string;
  permissions?: string[];
};

export const ALL_STAFF_PERMISSIONS = [
  "subscribers:read",
  "subscribers:write",
  "subscribers:approve",
  "packages:manage",
  "subscriptions:manage",
  "workouts:manage",
  "nutrition:manage",
  "content:manage",
  "progress:read",
  "progress:write",
  "physicalTherapy:read",
  "physicalTherapy:manage",
  "reports:read",
  "reports:export",
  "staff:manage",
  "notifications:send",
] as const;

export const STAFF_ROLES = new Set([
  "head_coach",
  "assistant",
  "trainer",
  "nutritionist",
  "physiotherapist",
]);
