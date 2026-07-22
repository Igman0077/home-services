import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { resolveManagedBusiness } from "@/server/services/business-context";

export const dynamic = "force-dynamic";

export default async function BusinessAnalyticsPage() {
  const session = await requireSession();
  const business = await resolveManagedBusiness(session.user.id);

  if (!business) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-3xl font-semibold text-primary">
          Analytics
        </h2>
        <Button asChild>
          <Link href="/business/onboard">Link a business first</Link>
        </Button>
      </div>
    );
  }

  const [assigned, accepted, contacted, won, lost] = await Promise.all([
    prisma.leadAssignment.count({ where: { businessId: business.id } }),
    prisma.leadAssignment.count({
      where: { businessId: business.id, status: "ACCEPTED" },
    }),
    prisma.leadAssignment.count({
      where: { businessId: business.id, status: "CONTACTED" },
    }),
    prisma.leadAssignment.count({
      where: { businessId: business.id, status: "WON" },
    }),
    prisma.leadAssignment.count({
      where: { businessId: business.id, status: "LOST" },
    }),
  ]);

  const acceptRate =
    assigned > 0 ? Math.round(((accepted + contacted + won) / assigned) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Performance
        </h2>
        <p className="mt-2 text-muted-foreground">
          Basic lead metrics for {business.name}. No fabricated traffic or rating
          statistics.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Assignments received", assigned],
          ["Accepted", accepted],
          ["Contacted", contacted],
          ["Won", won],
          ["Lost", lost],
          ["Accept-related rate", `${acceptRate}%`],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
