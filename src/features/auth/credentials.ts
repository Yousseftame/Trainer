const CREDENTIALS_KEY = "derpyfit_credentials_v1"

export function getStoredPasswords(): Record<string, string> {
  if (typeof window === "undefined" || !window.localStorage) return {}
  try {
    const raw = window.localStorage.getItem(CREDENTIALS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

export function saveStoredPassword(email: string, password: string): void {
  if (typeof window === "undefined" || !window.localStorage) return
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) return
  try {
    const current = getStoredPasswords()
    current[cleanEmail] = password.trim()
    window.localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(current))
  } catch {
    // Ignore quota errors
  }
}

