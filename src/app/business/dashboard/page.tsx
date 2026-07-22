import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function BusinessDashboardPage() {
  const session = await requireSession();
  const isAdmin = hasPermission(session.user.permissions, "leads.manage");

  const memberships = await prisma.businessMember.findMany({
    where: { userId: session.user.id },
    select: { businessId: true },
  });
  const businessIds = memberships.map((m) => m.businessId);

  const openLeads = businessIds.length
    ? await prisma.leadAssignment.count({
        where: {
          businessId: { in: businessIds },
          status: "ASSIGNED",
        },
      })
    : isAdmin
      ? await prisma.leadAssignment.count({ where: { status: "ASSIGNED" } })
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Overview
        </h2>
        <p className="mt-2 text-muted-foreground">
          Manage assigned leads. Contact details unlock only after you accept a
          lead.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Open lead offers</p>
        <p className="mt-1 text-3xl font-semibold">{openLeads}</p>
        <Button asChild className="mt-4">
          <Link href="/business/leads">View leads</Link>
        </Button>
      </div>
    </div>
  );
}
