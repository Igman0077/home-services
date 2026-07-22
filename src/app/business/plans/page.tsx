import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { resolveManagedBusiness } from "@/server/services/business-context";

export const dynamic = "force-dynamic";

export default async function BusinessPlansPage() {
  const session = await requireSession();
  const business = await resolveManagedBusiness(session.user.id);
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Subscription plans
        </h2>
        <p className="mt-2 text-muted-foreground">
          Plan entitlements are data-driven. Stripe billing integration ships in
          Phase 7 — this page shows current assignment and available plans only.
        </p>
      </div>

      {business ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm">
          Current plan for <strong>{business.name}</strong>:{" "}
          <Badge variant="success">
            {business.subscriptionPlan?.name ?? "None assigned"}
          </Badge>
        </p>
      ) : (
        <Button asChild>
          <Link href="/business/onboard">Link a business first</Link>
        </Button>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const entitlements = plan.entitlements as Record<string, unknown>;
          return (
            <li
              key={plan.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <Badge variant="outline">
                  {plan.priceCents === 0
                    ? "Free"
                    : `$${(plan.priceCents / 100).toFixed(0)}/${plan.interval}`}
                </Badge>
              </div>
              {plan.description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              ) : null}
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {Object.entries(entitlements).map(([key, value]) => (
                  <li key={key}>
                    {key}: {String(value)}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Self-serve upgrades unavailable until billing is connected.
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
