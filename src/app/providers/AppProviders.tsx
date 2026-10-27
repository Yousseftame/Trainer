import type { ReactNode } from "react"
import { AuthProvider } from "@/app/providers/AuthProvider"
import { QueryProvider } from "@/app/providers/QueryProvider"
import { AppToaster } from "@/components/ui/AppToaster"
import "@/i18n"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <AppToaster />
      </AuthProvider>
    </QueryProvider>
  )
}
