import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function WorkoutsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.workouts"))
  return <PagePlaceholder titleKey="nav.workouts" />
}
