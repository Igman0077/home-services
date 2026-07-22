import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/site-config";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_CONFIG.url;
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/locations`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/businesses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/guides`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/calculators`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/request-a-quote`, changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const [services, locations, businesses, localPages] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true, status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.location.findMany({
        where: { isActive: true, status: "PUBLISHED" },
        select: { fullSlug: true, updatedAt: true },
      }),
      prisma.business.findMany({
        where: { deletedAt: null, publishStatus: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.localServicePage.findMany({
        where: {
          isIndexable: true,
          indexDirective: "INDEX",
          status: "PUBLISHED",
        },
        select: { slugPath: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticEntries,
      ...services.map((s) => ({
        url: `${base}/services/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...locations.map((l) => ({
        url: `${base}/locations/${l.fullSlug}`,
        lastModified: l.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...businesses.map((b) => ({
        url: `${base}/businesses/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...localPages.map((p) => ({
        url: `${base}/${p.slugPath}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
