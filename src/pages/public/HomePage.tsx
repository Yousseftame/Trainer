import { useTranslation } from "react-i18next"
import { ContactSection } from "@/components/public/ContactSection"
import { FaqSection } from "@/components/public/FaqSection"
import { FitnessDreamSection } from "@/components/public/FitnessDreamSection"
import { GoalsBannerSection } from "@/components/public/GoalsBannerSection"
import { HeroSection } from "@/components/public/HeroSection"
import { MissionBannerSection } from "@/components/public/MissionBannerSection"
import { PackagesSection } from "@/components/public/PackagesSection"
import { SecondHeroSection } from "@/components/public/SecondHeroSection"
import { TestimonialsSection } from "@/components/public/TestimonialsSection"
import { TransformationsSection } from "@/components/public/TransformationsSection"
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
      <PackagesSection />
      <GoalsBannerSection />
      <ContactSection />
      <TransformationsSection />
      <FaqSection />
    </>
  )
}
