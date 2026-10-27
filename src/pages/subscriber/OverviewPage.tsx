import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function OverviewPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("pages.subscriberOverview"))
  return <PagePlaceholder titleKey="pages.subscriberOverview" />
}
