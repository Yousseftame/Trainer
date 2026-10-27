import type { ReactNode } from "react"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/app/providers/AuthProvider"
import { QueryProvider } from "@/app/providers/QueryProvider"
import "@/i18n"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryProvider>
  )
}
