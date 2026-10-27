import { Suspense } from "react"
import { RouterProvider } from "react-router-dom"
import { AppProviders } from "@/app/providers/AppProviders"
import { router } from "@/app/router"
import { FullPageSpinner } from "@/components/feedback/FullPageSpinner"

export function App() {
  return (
    <AppProviders>
      <Suspense fallback={<FullPageSpinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  )
}
