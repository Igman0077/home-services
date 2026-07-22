import Link from "next/link";

import { GuideEditorForm } from "@/components/admin/guide-editor-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  const guides = await prisma.guide.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { _count: { select: { faqs: true, revisions: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Guides CMS
        </h2>
        <p className="mt-2 text-muted-foreground">
          Draft → review → approve → publish. AI drafts enter as DRAFT only after
          human approval in the AI queue.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">FAQs</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {guides.map((guide) => (
              <tr key={guide.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{guide.title}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{guide.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {guide._count.faqs}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {guide.updatedAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/guides/${guide.id}`}>Edit</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {guides.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No guides yet.</p>
        ) : null}
      </div>

      <section className="max-w-xl rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Create draft guide</h3>
        <div className="mt-4">
          <GuideEditorForm />
        </div>
      </section>
    </div>
  );
}
