import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { resolveManagedBusiness } from "@/server/services/business-context";

export const dynamic = "force-dynamic";

export default async function BusinessDashboardPage() {
  const session = await requireSession();
  const business = await resolveManagedBusiness(session.user.id);

  if (!business) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-3xl font-semibold text-primary">
          Get started
        </h2>
        <p className="text-muted-foreground">
          Claim an existing listing or create a new business profile for review.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/business/onboard">Create a business</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/businesses">Browse listings to claim</Link>
          </Button>
        </div>
      </div>
    );
  }

  const openLeads = await prisma.leadAssignment.count({
    where: { businessId: business.id, status: "ASSIGNED" },
  });
  const acceptedLeads = await prisma.leadAssignment.count({
    where: {
      businessId: business.id,
      status: { in: ["ACCEPTED", "CONTACTED", "APPOINTMENT_SCHEDULED", "WON"] },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold text-primary">
            {business.name}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Profile completeness {business.profileCompleteness}% ·{" "}
            {business.publishStatus.replaceAll("_", " ").toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">{business.claimStatus}</Badge>
          <Badge variant="secondary">{business.verificationStatus}</Badge>
          {business.subscriptionPlan ? (
            <Badge variant="success">{business.subscriptionPlan.name}</Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Open lead offers</p>
          <p className="mt-1 text-3xl font-semibold">{openLeads}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active / won leads</p>
          <p className="mt-1 text-3xl font-semibold">{acceptedLeads}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Services / areas</p>
          <p className="mt-1 text-3xl font-semibold">
            {business._count.services}/{business._count.serviceAreas}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/business/leads">Manage leads</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/business/profile">Edit profile</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/businesses/${business.slug}`}>View public page</Link>
        </Button>
      </div>
    </div>
  );
}
