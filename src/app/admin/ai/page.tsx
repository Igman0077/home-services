import Link from "next/link";

import { AiDraftRequestForm } from "@/components/admin/ai-draft-form";
import { AiReviewButtons } from "@/components/admin/content-actions";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import type { AiGuideDraftOutput } from "@/integrations/ai";

export const dynamic = "force-dynamic";

export default async function AdminAiPage() {
  const generations = await prisma.aIGeneration.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      job: true,
      reviewer: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          AI content queue
        </h2>
        <p className="mt-2 text-muted-foreground">
          Mock provider generates educational drafts only. Nothing publishes
          without human review and a separate CMS publish step.
        </p>
      </div>

      <section className="max-w-xl rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Request guide draft</h3>
        <div className="mt-4">
          <AiDraftRequestForm />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Recent generations</h3>
        {generations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No AI jobs yet.</p>
        ) : (
          <ul className="space-y-4">
            {generations.map((gen) => {
              const output = gen.output as AiGuideDraftOutput | null;
              return (
                <li
                  key={gen.id}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">
                        {output?.title ?? "Untitled draft"}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {gen.provider}/{gen.model} · job {gen.job.status} ·{" "}
                        {gen.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">{gen.reviewStatus}</Badge>
                      {gen.qualityScore != null ? (
                        <Badge variant="secondary">
                          Quality {gen.qualityScore}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {output?.excerpt ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {output.excerpt}
                    </p>
                  ) : null}
                  {output?.disclaimer ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {output.disclaimer}
                    </p>
                  ) : null}
                  {gen.reviewStatus === "PENDING_REVIEW" ? (
                    <div className="mt-4">
                      <AiReviewButtons generationId={gen.id} />
                    </div>
                  ) : gen.reviewStatus === "APPROVED" ? (
                    <p className="mt-4 text-sm">
                      Approved.{" "}
                      <Link href="/admin/guides" className="text-accent hover:underline">
                        Open guides CMS
                      </Link>{" "}
                      to edit and publish.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
