import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function StaffPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.staff"))
  return <PagePlaceholder titleKey="nav.staff" />
}
