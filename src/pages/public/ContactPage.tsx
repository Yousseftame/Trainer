import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function ContactPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("pages.contact"))
  return <PagePlaceholder titleKey="pages.contact" />
}
