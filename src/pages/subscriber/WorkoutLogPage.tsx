import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function WorkoutLogPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.workoutLog"))
  return <PagePlaceholder titleKey="nav.workoutLog" />
}
