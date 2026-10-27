import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function PackagesPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.packages"))
  return <PagePlaceholder titleKey="nav.packages" />
}
