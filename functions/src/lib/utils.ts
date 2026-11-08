import type {Bilingual} from "./types.js";

export function isFirebaseUid(id: string): boolean {
  return /^[A-Za-z0-9]{20,128}$/.test(id) && !id.includes("-") && !id.includes("_");
}

export function stripUndefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export function normalizeBilingual(
  raw: unknown,
  fallback = "",
): Bilingual | undefined {
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t && !fallback) return undefined;
    const value = t || fallback;
    return {en: value, ar: value};
  }
  if (!raw || typeof raw !== "object") {
    if (!fallback) return undefined;
    return {en: fallback, ar: fallback};
  }
  const obj = raw as Record<string, unknown>;
  const en = typeof obj.en === "string" ? obj.en.trim() : "";
  const ar = typeof obj.ar === "string" ? obj.ar.trim() : "";
  if (!en && !ar && !fallback) return undefined;
  return {
    en: en || ar || fallback,
    ar: ar || en || fallback,
  };
}
