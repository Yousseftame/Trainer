import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function AboutPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("pages.about"))
  return <PagePlaceholder titleKey="pages.about" />
}
