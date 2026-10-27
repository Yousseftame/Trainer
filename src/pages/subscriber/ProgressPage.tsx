import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function ProgressPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.progress"))
  return <PagePlaceholder titleKey="nav.progress" />
}
