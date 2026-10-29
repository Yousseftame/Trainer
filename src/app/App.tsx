import { Suspense } from "react"
import { RouterProvider } from "react-router-dom"
import { AppProviders } from "@/app/providers/AppProviders"
import { router } from "@/app/router"
import { FullPageSpinner } from "@/components/feedback/FullPageSpinner"
import { SplashScreen } from "@/components/feedback/SplashScreen"

export function App() {
  return (
    <AppProviders>
      <SplashScreen />
      <Suspense fallback={<FullPageSpinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  )
}
