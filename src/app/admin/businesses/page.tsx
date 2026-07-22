import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { adminPublishBusinessAction } from "@/server/actions/business-profile";

export const dynamic = "force-dynamic";

async function PublishButton({ businessId }: { businessId: string }) {
  async function publish() {
    "use server";
    await adminPublishBusinessAction(businessId);
  }

  return (
    <form action={publish}>
      <Button type="submit" size="sm">
        Publish
      </Button>
    </form>
  );
}

export default async function AdminBusinessesPage() {
  const businesses = await prisma.business.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      subscriptionPlan: true,
      _count: { select: { members: true, claims: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Businesses
        </h2>
        <p className="mt-2 text-muted-foreground">
          Review publish status, claims, and sample-data flags.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Claim</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((business) => (
              <tr
                key={business.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/businesses/${business.slug}`}
                    className="font-medium hover:text-accent"
                  >
                    {business.name}
                  </Link>
                  {business.isSampleData ? (
                    <Badge variant="outline" className="ml-2">
                      Sample
                    </Badge>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{business.publishStatus}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{business.claimStatus}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {business.subscriptionPlan?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {business.publishStatus === "PENDING_REVIEW" ||
                  business.publishStatus === "DRAFT" ? (
                    <PublishButton businessId={business.id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {business._count.members} members
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
