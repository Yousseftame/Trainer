import type {
  PackageEntitlements,
  PackageTone,
  SubscriptionPackage,
} from "@/types/subscription"

/** Full catalog package used by admin + public packages UI. */
export type CatalogPackage = SubscriptionPackage & {
  featured: boolean
  tone: PackageTone
  price: { en: string; ar: string }
  period: { en: string; ar: string }
  featureList: { en: string[]; ar: string[] }
  entitlements: PackageEntitlements
  createdAt: string
  updatedAt: string
}

/** @deprecated Use CatalogPackage */
export type DemoPackage = CatalogPackage
