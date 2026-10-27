import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function NutritionPlanPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.nutrition"))
  return <PagePlaceholder titleKey="nav.nutrition" />
}
