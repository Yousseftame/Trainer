import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function SubscribersPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.subscribers"))
  return <PagePlaceholder titleKey="nav.subscribers" />
}
