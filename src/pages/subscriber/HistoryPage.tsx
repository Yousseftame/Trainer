import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function HistoryPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.history"))
  return <PagePlaceholder titleKey="nav.history" />
}
