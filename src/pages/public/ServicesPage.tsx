import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function ServicesPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("pages.services"))
  return <PagePlaceholder titleKey="pages.services" />
}
