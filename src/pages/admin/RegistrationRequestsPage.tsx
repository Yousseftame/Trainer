import { PagePlaceholder } from "@/components/feedback/PagePlaceholder"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useTranslation } from "react-i18next"

export function RegistrationRequestsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("nav.registrationRequests"))
  return <PagePlaceholder titleKey="nav.registrationRequests" />
}
