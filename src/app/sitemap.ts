import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CONFIG.url;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/locations`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/businesses`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/guides`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/calculators`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/request-a-quote`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
