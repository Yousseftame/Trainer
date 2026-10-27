import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function ReportsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.reports"))
  return <PagePlaceholder titleKey="nav.reports" />
}
