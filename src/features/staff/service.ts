import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions/permissions"
import { DEMO_STAFF_MEMBERS } from "@/features/staff/demo"
import { createRealFirebaseAuthAccount } from "@/lib/firebase/provisioning"
import type { StaffMember, StaffRole, StaffStatus } from "@/types/staff"
import type { Permission } from "@/lib/permissions/permissions"

const STAFF_COLLECTION = "staff"
const STAFF_CACHE_KEY = "derpyfit_staff_cache"

function readLocalCache(): StaffMember[] | null {
  try {
    const raw = localStorage.getItem(STAFF_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StaffMember[]
  } catch {
    return null
  }
}

function writeLocalCache(records: StaffMember[]): void {
  try {
    localStorage.setItem(STAFF_CACHE_KEY, JSON.stringify(records))
  } catch {
    // quota exceeded or disabled
  }
}

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, STAFF_COLLECTION))

    if (snap.empty) {
      // Seed demo staff to Firestore
      try {
        const batch = writeBatch(db)
        for (const item of DEMO_STAFF_MEMBERS) {
          batch.set(doc(db, STAFF_COLLECTION, item.id), item)
        }
        await batch.commit()
      } catch (seedErr) {
        console.warn("Could not seed staff members to Firestore:", seedErr)
      }
      writeLocalCache(DEMO_STAFF_MEMBERS)
      return DEMO_STAFF_MEMBERS
    }

    const members = snap.docs.map((d) => d.data() as StaffMember)
    writeLocalCache(members)
    return members
  } catch (err) {
    console.warn("Firestore staff read failed, falling back to cache/demo:", err)
    const cached = readLocalCache()
    if (cached && cached.length > 0) return cached
    return DEMO_STAFF_MEMBERS
  }
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

export async function saveStaffMember(input: SaveStaffInput): Promise<StaffMember> {
  const existing = await fetchStaffMembers()
  const now = new Date().toISOString()
  
  let id = input.id
  if (!id) {
    const authResult = await createRealFirebaseAuthAccount({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
    })
    id = authResult.uid || `staff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  }

  const prev = existing.find((s) => s.id === id)

  // Head coach always has all permissions
  const resolvedPermissions: Permission[] =
    input.role === "head_coach"
      ? [...PERMISSIONS]
      : input.permissions.length > 0
        ? input.permissions
        : [...ROLE_PERMISSIONS[input.role]]

  // Head coach status can never be suspended
  const resolvedStatus: StaffStatus =
    input.role === "head_coach" ? "active" : input.status

  const resolved: StaffMember = {
    id,
    displayName: input.displayName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    role: input.role,
    status: resolvedStatus,
    permissions: resolvedPermissions,
    customTitle: input.customTitle,
    notes: input.notes?.trim() || undefined,
    avatarUrl: prev?.avatarUrl,
    lastLoginAt: prev?.lastLoginAt ?? null,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  }

  const idx = existing.findIndex((s) => s.id === id)
  const nextList =
    idx >= 0
      ? existing.map((s, i) => (i === idx ? resolved : s))
      : [resolved, ...existing]

  writeLocalCache(nextList)

  try {
    const db = getDb()
    await setDoc(doc(db, STAFF_COLLECTION, id), resolved)
  } catch (err) {
    console.warn("Firestore save staff member failed, cached locally:", err)
  }

  return resolved
}

export async function toggleStaffStatus(id: string): Promise<StaffMember> {
  const existing = await fetchStaffMembers()
  const member = existing.find((s) => s.id === id)
  if (!member) {
    throw new Error(`Staff member with ID ${id} not found`)
  }

  if (member.role === "head_coach") {
    throw new Error("The Head Coach account cannot be suspended.")
  }

  const nextStatus: StaffStatus = member.status === "active" ? "suspended" : "active"
  return saveStaffMember({
    ...member,
    status: nextStatus,
  })
}

export async function deleteStaffMember(id: string): Promise<void> {
  const existing = await fetchStaffMembers()
  const member = existing.find((s) => s.id === id)
  if (!member) return

  if (member.role === "head_coach") {
    throw new Error("The Head Coach account is protected and cannot be deleted.")
  }

  const nextList = existing.filter((s) => s.id !== id)
  writeLocalCache(nextList)

  try {
    const db = getDb()
    await deleteDoc(doc(db, STAFF_COLLECTION, id))
  } catch (err) {
    console.warn("Firestore delete staff member failed, updated cache:", err)
  }
}

