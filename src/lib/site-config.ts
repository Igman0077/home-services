/**
 * Site branding and defaults.
 * Runtime values in SiteSetting override these when available.
 */
export const SITE_CONFIG = {
  name:
    process.env.NEXT_PUBLIC_SITE_NAME ?? "North Country Home Services",
  tagline:
    process.env.NEXT_PUBLIC_SITE_TAGLINE ??
    "Find trusted local home service professionals across Northern New York",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: "support@example.com",
  locale: "en-US",
  defaultTimezone: "America/New_York",
  reviewsEnabled: process.env.NEXT_PUBLIC_REVIEWS_ENABLED === "true",
  showSampleDataBadges:
    process.env.NEXT_PUBLIC_SHOW_SAMPLE_DATA_BADGES !== "false",
} as const;

export const SITE_SETTING_KEYS = {
  SITE_NAME: "site.name",
  SITE_TAGLINE: "site.tagline",
  SUPPORT_EMAIL: "site.supportEmail",
  LEAD_CONSENT_VERSION: "legal.leadConsentVersion",
  LEAD_CONSENT_TEXT: "legal.leadConsentText",
  REVIEWS_ENABLED: "features.reviewsEnabled",
  LOCAL_PAGE_MIN_QUALITY_SCORE: "seo.localPageMinQualityScore",
  LOCAL_PAGE_MIN_CONTENT_CHARS: "seo.localPageMinContentChars",
} as const;

export type SiteSettingKey =
  (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS];
