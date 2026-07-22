import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  SITE_CONFIG,
  SITE_SETTING_KEYS,
  type SiteSettingKey,
} from "@/lib/site-config";

export async function getSiteSetting<T>(
  key: SiteSettingKey,
  fallback: T,
): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (row?.value === undefined || row.value === null) {
      return fallback;
    }
    return row.value as T;
  } catch {
    // DB may be unavailable during early bootstrap
    return fallback;
  }
}

export async function getPublicSiteConfig() {
  const [name, tagline, supportEmail, reviewsEnabled] = await Promise.all([
    getSiteSetting(SITE_SETTING_KEYS.SITE_NAME, SITE_CONFIG.name),
    getSiteSetting(SITE_SETTING_KEYS.SITE_TAGLINE, SITE_CONFIG.tagline),
    getSiteSetting(SITE_SETTING_KEYS.SUPPORT_EMAIL, SITE_CONFIG.supportEmail),
    getSiteSetting(
      SITE_SETTING_KEYS.REVIEWS_ENABLED,
      SITE_CONFIG.reviewsEnabled,
    ),
  ]);

  return {
    name,
    tagline,
    supportEmail,
    reviewsEnabled,
    url: SITE_CONFIG.url,
    showSampleDataBadges: SITE_CONFIG.showSampleDataBadges,
  };
}

export async function upsertSiteSetting(
  key: SiteSettingKey,
  value: Prisma.InputJsonValue,
  description?: string,
  updatedById?: string,
) {
  return prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, description, updatedById },
    update: { value, description, updatedById },
  });
}
