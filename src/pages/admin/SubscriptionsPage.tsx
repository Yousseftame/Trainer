import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function SubscriptionsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.subscriptions"))
  return <PagePlaceholder titleKey="nav.subscriptions" />
}
