import { useTranslation } from "react-i18next"
import { AboutClosingBannerSection } from "@/components/public/AboutClosingBannerSection"
import { AboutHeroSection } from "@/components/public/AboutHeroSection"
import { AboutHowICoachSection } from "@/components/public/AboutHowICoachSection"
import { AboutMyStorySection } from "@/components/public/AboutMyStorySection"
import { AboutWhoIHelpCertsSection } from "@/components/public/AboutWhoIHelpCertsSection"
import { TransformationsSection } from "@/components/public/TransformationsSection"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"

export function AboutPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("pages.about"))

  return (
    <div className="w-full bg-white">
      <AboutHeroSection />
      <AboutMyStorySection />
      <AboutHowICoachSection />
      <AboutWhoIHelpCertsSection />
      <AboutClosingBannerSection />
      <TransformationsSection />
    </div>
  )
}
