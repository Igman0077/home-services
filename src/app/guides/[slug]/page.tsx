import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs, JsonLdScript } from "@/components/seo/structured-data";
import { guideBodyToParagraphs, parseGuideBlocks } from "@/lib/content";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
} from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { getPublishedGuideBySlug } from "@/server/services/content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPublishedGuideBySlug(slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.seoTitle || guide.title,
    description: guide.seoDescription || guide.excerpt || undefined,
    alternates: { canonical: `/guides/${guide.slug}` },
  };
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const guide = await getPublishedGuideBySlug(slug);
  if (!guide) notFound();

  const blocks = parseGuideBlocks(guide.contentBlocks);
  const pageUrl = absoluteUrl(`/guides/${guide.slug}`);
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Guides", href: "/guides" },
    { name: guide.title },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", url: absoluteUrl("/") },
          { name: "Guides", url: absoluteUrl("/guides") },
          { name: guide.title, url: pageUrl },
        ])}
      />
      <JsonLdScript
        data={articleJsonLd({
          title: guide.title,
          description: guide.excerpt,
          url: pageUrl,
          datePublished: guide.publishedAt,
          dateModified: guide.updatedAt,
          authorName: guide.authorName,
        })}
      />
      <JsonLdScript
        data={faqJsonLd(
          guide.faqs.map((f) => ({ question: f.question, answer: f.answer })),
        )}
      />
      <Breadcrumbs items={crumbs} />

      <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
        {guide.title}
      </h1>
      {guide.excerpt ? (
        <p className="mt-4 text-lg text-muted-foreground">{guide.excerpt}</p>
      ) : null}
      <p className="mt-3 text-sm text-muted-foreground">
        {guide.authorName ? `${guide.authorName} · ` : ""}
        Updated {guide.updatedAt.toLocaleDateString()}
      </p>

      <div className="prose-north mt-8 space-y-4 text-base leading-relaxed text-foreground/90">
        {guideBodyToParagraphs(blocks.body).map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
        {(blocks.sections ?? []).map((section) => (
          <section key={section.heading} className="pt-4">
            <h2 className="font-display text-2xl font-semibold text-primary">
              {section.heading}
            </h2>
            {guideBodyToParagraphs(section.body).map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="mt-3">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      {guide.faqs.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-primary">
            FAQs
          </h2>
          <dl className="mt-4 space-y-4">
            {guide.faqs.map((faq) => (
              <div key={faq.id}>
                <dt className="font-semibold">{faq.question}</dt>
                <dd className="mt-1 text-muted-foreground">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <p className="mt-10 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Educational content only. For active leaks, structural concerns, gas, or
        electrical work,{" "}
        <Link href="/request-a-quote" className="text-accent hover:underline">
          request local quotes
        </Link>
        .
      </p>
    </article>
  );
}
