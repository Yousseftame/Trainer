import { WebsiteSectionStubPage } from "@/pages/admin/website/WebsiteSectionStubPage"

/** Factory for website CMS stubs — swap each export for a real editor later. */
export function createWebsiteSectionPage(titleKey: string) {
  return function WebsiteSectionPage() {
    return <WebsiteSectionStubPage titleKey={titleKey} />
  }
}
