/** Normalize a phone to WhatsApp digits (country code, no + / spaces). */
export function toWhatsAppDigits(rawPhone: string): string | null {
  let digits = rawPhone.replace(/\D/g, "")
  if (!digits) return null

  // Strip international dialing prefix 00
  if (digits.startsWith("00")) digits = digits.slice(2)

  // Egypt local mobile: 01xxxxxxxxx → 201xxxxxxxxx
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = `20${digits.slice(1)}`
  }

  return digits || null
}

export function buildWhatsAppHref(rawPhone: string, prefill?: string): string | null {
  const digits = toWhatsAppDigits(rawPhone)
  if (!digits) return null
  const base = `https://wa.me/${digits}`
  if (!prefill?.trim()) return base
  return `${base}?text=${encodeURIComponent(prefill.trim())}`
}
