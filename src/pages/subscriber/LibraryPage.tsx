import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function LibraryPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.library"))
  return <PagePlaceholder titleKey="nav.library" />
}
