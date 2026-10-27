import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function WorkoutPlanPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.workout"))
  return <PagePlaceholder titleKey="nav.workout" />
}
