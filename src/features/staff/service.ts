import { collection, getDocs } from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import {
  callCreateStaffMember,
  callDeleteStaffMember,
  callPurgeDemoStaffData,
  callSetStaffAccountStatus,
  callUpdateStaffMember,
} from "@/lib/firebase/callables"
import { PERMISSIONS, type Permission } from "@/lib/permissions/permissions"
import type { StaffMember, StaffRole, StaffStatus } from "@/types/staff"

const STAFF_COLLECTION = "staff"

/** Firebase Auth UIDs are alphanumeric 28+ chars without hyphens. */
function isFirebaseUid(id: string) {
  return /^[A-Za-z0-9]{20,128}$/.test(id) && !id.includes("-") && !id.includes("_")
}

const DEMO_STAFF_EMAILS = new Set([
  "youssef@derpyfit.com",
  "ziad@derpyfit.com",
  "nour@derpyfit.com",
  "tarek@derpyfit.com",
  "salma@derpyfit.com",
])

function asBilingual(raw: unknown): { en: string; ar: string } | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const obj = raw as Record<string, unknown>
  const en = typeof obj.en === "string" ? obj.en : ""
  const ar = typeof obj.ar === "string" ? obj.ar : ""
  if (!en && !ar) return undefined
  return { en: en || ar, ar: ar || en }
}

function normalizeStaffDoc(
  id: string,
  raw: Record<string, unknown>,
): StaffMember {
  const role = (raw.role as StaffRole) || "assistant"
  const permissions = Array.isArray(raw.permissions)
    ? (raw.permissions.filter(
        (item): item is Permission =>
          typeof item === "string" &&
          (PERMISSIONS as readonly string[]).includes(item),
      ) as Permission[])
    : []

  return {
    id,
    displayName: String(raw.displayName ?? ""),
    email: String(raw.email ?? "").toLowerCase(),
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
    role,
    status: raw.status === "suspended" ? "suspended" : "active",
    permissions: role === "head_coach" ? [...PERMISSIONS] : permissions,
    customTitle: asBilingual(raw.customTitle),
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl : undefined,
    lastLoginAt:
      typeof raw.lastLoginAt === "string" ? raw.lastLoginAt : null,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
  }
}

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  const db = getDb()
  const snap = await getDocs(collection(db, STAFF_COLLECTION))
  return snap.docs
    .map((docSnap) =>
      normalizeStaffDoc(docSnap.id, docSnap.data() as Record<string, unknown>),
    )
    .filter((member) => {
      if (!isFirebaseUid(member.id) || member.id.startsWith("staff-")) {
        return false
      }
      if (DEMO_STAFF_EMAILS.has(member.email.toLowerCase())) return false
      return true
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** One-shot cleanup of client-seeded fake staff rows in Firestore. */
export async function purgeDemoStaffMembers(): Promise<number> {
  const result = await callPurgeDemoStaffData()
  return result.deleted
}

export type SaveStaffInput = {
  id?: string
  displayName: string
  email: string
  password?: string
  phone?: string
  role: StaffRole
  status: StaffStatus
  permissions: Permission[]
  customTitle?: {
    en: string
    ar: string
  }
  notes?: string
}

function callableErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object") {
    const code = "code" in err ? String((err as { code?: string }).code) : ""
    const message =
      "message" in err ? String((err as { message?: string }).message) : ""
    if (message) {
      // Firebase callable prefixes: "functions/already-exists: ..."
      const cleaned = message.replace(/^Firebase:\s*/i, "").replace(
        /^[a-z/-]+:\s*/i,
        "",
      )
      return cleaned || fallback
    }
    if (code) return `${fallback} (${code})`
  }
  return fallback
}

export async function saveStaffMember(
  input: SaveStaffInput,
): Promise<StaffMember> {
  try {
    if (input.id) {
      const result = await callUpdateStaffMember({
        staffId: input.id,
        displayName: input.displayName,
        phone: input.phone,
        role: input.role,
        status: input.status,
        permissions: input.permissions,
        customTitle: input.customTitle,
        notes: input.notes,
        password: input.password,
      })
      return normalizeStaffDoc(
        result.staff.id,
        result.staff as unknown as Record<string, unknown>,
      )
    }

    const result = await callCreateStaffMember({
      displayName: input.displayName,
      email: input.email,
      password: input.password,
      phone: input.phone,
      role: input.role,
      status: input.status,
      permissions: input.permissions,
      customTitle: input.customTitle,
      notes: input.notes,
    })
    return normalizeStaffDoc(
      result.staff.id,
      result.staff as unknown as Record<string, unknown>,
    )
  } catch (err) {
    throw new Error(
      callableErrorMessage(
        err,
        input.id
          ? "Failed to update staff member"
          : "Failed to create staff member",
      ),
    )
  }
}

export async function toggleStaffStatus(id: string): Promise<StaffMember> {
  const members = await fetchStaffMembers()
  const member = members.find((item) => item.id === id)
  if (!member) {
    throw new Error("Staff member not found")
  }
  if (member.role === "head_coach") {
    throw new Error("The Head Coach account cannot be suspended.")
  }

  const nextStatus: StaffStatus =
    member.status === "active" ? "suspended" : "active"

  try {
    const result = await callSetStaffAccountStatus({
      staffId: id,
      status: nextStatus,
    })
    return normalizeStaffDoc(
      result.staff.id,
      result.staff as unknown as Record<string, unknown>,
    )
  } catch (err) {
    throw new Error(
      callableErrorMessage(err, "Failed to update staff account status"),
    )
  }
}

export async function deleteStaffMember(id: string): Promise<void> {
  try {
    await callDeleteStaffMember(id)
  } catch (err) {
    throw new Error(callableErrorMessage(err, "Failed to delete staff account"))
  }
}
