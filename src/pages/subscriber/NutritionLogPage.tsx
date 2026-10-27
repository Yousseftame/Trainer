import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function NutritionLogPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.nutritionLog"))
  return <PagePlaceholder titleKey="nav.nutritionLog" />
}
