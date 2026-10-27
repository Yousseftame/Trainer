import { Link } from "react-router-dom"
import { APP_ROUTES } from "@/config/constants"

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-sm text-muted-foreground">Page not found.</p>
      <Link to={APP_ROUTES.public.home} className="text-sm font-medium underline underline-offset-4">
        Go home
      </Link>
    </section>
  )
}
