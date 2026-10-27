import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function ContentLibraryPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.content"))
  return <PagePlaceholder titleKey="nav.content" />
}
