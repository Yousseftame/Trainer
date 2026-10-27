import { useTranslation } from "react-i18next"
import { FitnessDreamSection } from "@/components/public/FitnessDreamSection"
import { HeroSection } from "@/components/public/HeroSection"
import { MissionBannerSection } from "@/components/public/MissionBannerSection"
import { SecondHeroSection } from "@/components/public/SecondHeroSection"
import { TestimonialsSection } from "@/components/public/TestimonialsSection"
import { TrustSection } from "@/components/public/TrustSection"
import { WhoIAmSection } from "@/components/public/WhoIAmSection"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"

export function HomePage() {
  const { t } = useTranslation()
  useDocumentTitle(t("pages.home"))

  return (
    <>
      <HeroSection />
      <TrustSection />
      <FitnessDreamSection />
      <SecondHeroSection />
      <WhoIAmSection />
      <MissionBannerSection />
      <TestimonialsSection />
    </>
  )
}
