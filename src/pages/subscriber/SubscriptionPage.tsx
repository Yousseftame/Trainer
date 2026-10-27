import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function SubscriptionPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.subscription"))
  return <PagePlaceholder titleKey="nav.subscription" />
}
