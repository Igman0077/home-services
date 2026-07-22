import Link from "next/link";
import { notFound } from "next/navigation";

import {
  GuideStatusButton,
} from "@/components/admin/content-actions";
import { GuideEditorForm } from "@/components/admin/guide-editor-form";
import { GuideFaqForm } from "@/components/admin/guide-faq-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseGuideBlocks } from "@/lib/content";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminGuideDetailPage({ params }: Props) {
  const { id } = await params;
  const guide = await prisma.guide.findUnique({
    where: { id },
    include: {
      faqs: { orderBy: { sortOrder: "asc" } },
      revisions: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          author: { select: { name: true, email: true } },
          reviewer: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!guide) notFound();

  const blocks = parseGuideBlocks(guide.contentBlocks);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/guides" className="hover:text-accent">
              Guides
            </Link>
          </p>
          <h2 className="font-display text-3xl font-semibold text-primary">
            {guide.title}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{guide.status}</Badge>
            <Badge variant="secondary">{guide.indexDirective}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {guide.status === "PUBLISHED" ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/guides/${guide.slug}`} target="_blank">
                View public
              </Link>
            </Button>
          ) : null}
          {guide.status === "DRAFT" ? (
            <GuideStatusButton
              guideId={guide.id}
              status="IN_REVIEW"
              label="Submit for review"
            />
          ) : null}
          {guide.status === "IN_REVIEW" ? (
            <>
              <GuideStatusButton
                guideId={guide.id}
                status="APPROVED"
                label="Approve"
              />
              <GuideStatusButton
                guideId={guide.id}
                status="DRAFT"
                label="Return to draft"
              />
            </>
          ) : null}
          {guide.status === "APPROVED" ? (
            <GuideStatusButton
              guideId={guide.id}
              status="PUBLISHED"
              label="Publish"
            />
          ) : null}
          {guide.status === "PUBLISHED" ? (
            <GuideStatusButton
              guideId={guide.id}
              status="ARCHIVED"
              label="Archive"
            />
          ) : null}
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Edit content</h3>
        <div className="mt-4">
          <GuideEditorForm
            guide={{
              id: guide.id,
              title: guide.title,
              slug: guide.slug,
              excerpt: guide.excerpt,
              body: blocks.body,
              sectionsJson: blocks.sections
                ? JSON.stringify(blocks.sections, null, 2)
                : "",
              seoTitle: guide.seoTitle,
              seoDescription: guide.seoDescription,
              authorName: guide.authorName,
            }}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-semibold">FAQs</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {guide.faqs.map((faq) => (
              <li key={faq.id}>
                <p className="font-medium">{faq.question}</p>
                <p className="text-muted-foreground">{faq.answer}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <GuideFaqForm guideId={guide.id} />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-semibold">Revision history</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {guide.revisions.map((rev) => (
              <li key={rev.id}>
                {rev.createdAt.toLocaleString()} — {rev.notes ?? "Snapshot"}
                {rev.author
                  ? ` · ${rev.author.name ?? rev.author.email}`
                  : ""}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
