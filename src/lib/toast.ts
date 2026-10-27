import toast, { type ToastOptions } from "react-hot-toast"
import type { CSSProperties } from "react"

const baseStyle: CSSProperties = {
  background: "#1a1a1a",
  color: "#f5f5f5",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: 600,
  letterSpacing: "0.01em",
  maxWidth: "min(420px, calc(100vw - 32px))",
}

const baseOptions: ToastOptions = {
  duration: 3600,
  position: "top-center",
  style: baseStyle,
}

/** Shared toast API — same dark design for success / error / info across the app. */
export const appToast = {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      ...baseOptions,
      ...options,
      style: { ...baseStyle, ...options?.style },
      iconTheme: {
        primary: "#b8fe22",
        secondary: "#111111",
        ...options?.iconTheme,
      },
    })
  },

  error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      ...baseOptions,
      duration: 4200,
      ...options,
      style: { ...baseStyle, ...options?.style },
      iconTheme: {
        primary: "#ef4444",
        secondary: "#ffffff",
        ...options?.iconTheme,
      },
    })
  },

  info(message: string, options?: ToastOptions) {
    return toast(message, {
      ...baseOptions,
      ...options,
      style: { ...baseStyle, ...options?.style },
    })
  },

  dismiss: toast.dismiss,
  remove: toast.remove,
}

export { toast }
