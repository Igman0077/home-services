import Link from "next/link";

import { ReviewVerificationForm } from "@/components/business/review-verification-form";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const rows = await prisma.businessVerification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      business: { select: { name: true, slug: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Verification requests
        </h2>
        <p className="mt-2 text-muted-foreground">
          Platform verification is stricter than business-provided confirmation.
          Never mark verified without supporting evidence.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">No verification requests yet.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    <Link
                      href={`/businesses/${row.business.slug}`}
                      className="hover:text-accent"
                    >
                      {row.business.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {row.method} · {row.createdAt.toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{row.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{row.notes}</p>
              {row.status === "PENDING" ? (
                <div className="mt-4">
                  <ReviewVerificationForm verificationId={row.id} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
