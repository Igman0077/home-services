import Link from "next/link";

import { DeleteDocumentButton } from "@/components/homeowner/action-buttons";
import { DocumentUploadForm } from "@/components/homeowner/document-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes <= 0) return "Link";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function HomeownerDocumentsPage() {
  const session = await requireHomeownerSession();
  const properties = await prisma.homeownerProperty.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true },
  });

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { property: { select: { nickname: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Document vault
        </h2>
        <p className="mt-2 text-muted-foreground">
          Private warranties, manuals, and invoices. Downloads require your
          signed-in session.
        </p>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents yet.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium">{doc.title}</p>
                <p className="text-sm text-muted-foreground">
                  {doc.property?.nickname ?? "Unassigned"} · {doc.fileName} ·{" "}
                  {formatBytes(doc.sizeBytes)}
                </p>
                <Badge variant="outline" className="mt-2">
                  {doc.visibility}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/api/homeowner/documents/${doc.id}`}>
                    {doc.storageKey.startsWith("external:") ? "Open" : "Download"}
                  </Link>
                </Button>
                <DeleteDocumentButton documentId={doc.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="max-w-xl rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Add document</h3>
        <div className="mt-4">
          <DocumentUploadForm properties={properties} />
        </div>
      </section>
    </div>
  );
}
