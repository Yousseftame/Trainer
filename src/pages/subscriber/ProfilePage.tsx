import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function ProfilePage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.profile"))
  return <PagePlaceholder titleKey="nav.profile" />
}
