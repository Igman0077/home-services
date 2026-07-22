import type { Metadata } from "next";
import Link from "next/link";

import { listPublishedGuides } from "@/server/services/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home maintenance guides",
  description:
    "Educational Northern New York home maintenance and service guides. Not a substitute for licensed inspection or quotes.",
  alternates: { canonical: "/guides" },
};

export default async function GuidesPage() {
  const guides = await listPublishedGuides();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-primary">
        Guides
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Practical home-maintenance articles for Northern New York. Content is
        educational — not a diagnosis, warranty, or contractor bid.
      </p>

      {guides.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No published guides yet. Editors can draft and publish from the CMS.
        </p>
      ) : (
        <ul className="mt-10 space-y-6">
          {guides.map((guide) => (
            <li key={guide.id} className="border-b border-border pb-6 last:border-0">
              <h2 className="text-xl font-semibold">
                <Link
                  href={`/guides/${guide.slug}`}
                  className="hover:text-accent"
                >
                  {guide.title}
                </Link>
              </h2>
              {guide.excerpt ? (
                <p className="mt-2 text-muted-foreground">{guide.excerpt}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {guide.authorName ? `${guide.authorName} · ` : ""}
                {guide.publishedAt
                  ? guide.publishedAt.toLocaleDateString()
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
