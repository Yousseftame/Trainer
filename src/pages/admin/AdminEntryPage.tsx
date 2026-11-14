import { Navigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Shield } from "lucide-react"
import { FullPageSpinner } from "@/components/feedback/FullPageSpinner"
import { OverviewPage } from "@/pages/admin/OverviewPage"
import { useAuth } from "@/features/auth/auth-context"
import { resolveAdminHomePath } from "@/lib/permissions/can"
import { APP_ROUTES } from "@/config/constants"

/**
 * `/admin` entry:
 * - overview:read → overview dashboard
 * - otherwise → first permitted module
 * - zero permissions → stay in the admin shell with an empty-state panel
 */
export function AdminEntryPage() {
  const { t } = useTranslation()
  const { user, status, hasPermission } = useAuth()

  if (status === "loading" || status === "idle") {
    return <FullPageSpinner />
  }

  if (hasPermission("overview:read")) {
    return <OverviewPage />
  }

  const home = resolveAdminHomePath(user)
  if (home && home !== APP_ROUTES.admin.root) {
    return <Navigate to={home} replace />
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-[24px] bg-white px-6 py-16 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-white">
        <Shield className="size-7" strokeWidth={1.8} />
      </span>
      <h1 className="mt-5 font-heading text-[22px] font-extrabold tracking-tight text-[var(--gym-ink,#111111)] sm:text-[26px]">
        {t("admin.access.noneTitle")}
      </h1>
      <p className="mt-2 max-w-[36em] text-[14px] leading-relaxed text-[#5F6B6B]">
        {t("admin.access.noneHint")}
      </p>
    </div>
  )
}
