import Link from "next/link";

import { ReviewClaimForm } from "@/components/business/review-claim-form";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  const claims = await prisma.businessClaim.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      business: { select: { name: true, slug: true } },
      user: { select: { email: true, name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Business claims
        </h2>
        <p className="mt-2 text-muted-foreground">
          Approve ownership only when verification evidence is adequate. All
          decisions are audit-logged.
        </p>
      </div>
      {claims.length === 0 ? (
        <p className="text-muted-foreground">No claims submitted yet.</p>
      ) : (
        <ul className="space-y-4">
          {claims.map((claim) => (
            <li
              key={claim.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    <Link
                      href={`/businesses/${claim.business.slug}`}
                      className="hover:text-accent"
                    >
                      {claim.business.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {claim.user.name ?? claim.user.email} ·{" "}
                    {claim.createdAt.toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{claim.status}</Badge>
              </div>
              <p className="mt-3 text-sm">
                Method: {claim.verificationMethod ?? "n/a"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {claim.evidenceNotes}
              </p>
              {claim.status === "PENDING" ||
              claim.status === "MORE_INFO_REQUIRED" ? (
                <div className="mt-4">
                  <ReviewClaimForm claimId={claim.id} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
