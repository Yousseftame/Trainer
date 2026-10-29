import { Toaster } from "react-hot-toast"

/**
 * Shared app toaster — dark, centered, with success/error icon animations.
 * Mount once in AppProviders; call `appToast` from anywhere.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={12}
      containerClassName="app-toaster"
      containerStyle={{
        top: 18,
        zIndex: 9999,
      }}
      toastOptions={{
        className: "app-toast",
        duration: 3600,
        style: {
          background: "#1a1a1a",
          color: "#f5f5f5",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: 600,
          maxWidth: "min(420px, calc(100vw - 32px))",
        },
        success: {
          duration: 3400,
          iconTheme: {
            primary: "#fb5001",
            secondary: "#ffffff",
          },
        },
        error: {
          duration: 4200,
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },
      }}
    />
  )
}
