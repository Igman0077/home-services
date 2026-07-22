import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPlanPrice, parsePlanEntitlements } from "@/lib/billing";
import { prisma } from "@/lib/db";
import {
  adminAssignPlanAction,
  adminSetPlacementAction,
} from "@/server/actions/billing";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const [plans, businesses, events, subscriptions] = await Promise.all([
    prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.business.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      take: 50,
      include: { subscriptionPlan: true },
    }),
    prisma.paymentEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        plan: true,
        business: { select: { name: true, slug: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Billing & placement
        </h2>
        <p className="mt-2 text-muted-foreground">
          Assign plans, audit payment events, and control Featured / Sponsored
          labels. Sponsored means paid placement — never use it as a fake trust
          signal.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Provider: {process.env.PAYMENT_PROVIDER ?? "mock"} · Webhook:{" "}
          <code>/api/billing/webhook</code>
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Plans</h3>
        <ul className="grid gap-3 md:grid-cols-2">
          {plans.map((plan) => {
            const entitlements = parsePlanEntitlements(plan.entitlements);
            return (
              <li
                key={plan.id}
                className="rounded-lg border border-border bg-card p-4 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{plan.name}</span>
                  <Badge variant="outline">
                    {formatPlanPrice(plan.priceCents, plan.interval)}
                  </Badge>
                </div>
                <p className="mt-2 text-muted-foreground">
                  featured={String(!!entitlements.featured)} · sponsored=
                  {String(!!entitlements.sponsored)} · stripePriceId=
                  {plan.stripePriceId ?? "—"}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Businesses</h3>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Business</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Placement</th>
                <th className="px-4 py-3 font-semibold">Assign</th>
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
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {business.subscriptionPlan?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await adminSetPlacementAction(business.id, {
                            isFeatured: !business.isFeatured,
                          });
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          {business.isFeatured ? "Unfeature" : "Feature"}
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await adminSetPlacementAction(business.id, {
                            isSponsored: !business.isSponsored,
                          });
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          {business.isSponsored ? "Unsponsor" : "Sponsor"}
                        </Button>
                      </form>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={async (formData) => {
                        "use server";
                        const planId = String(formData.get("planId") ?? "");
                        if (planId) {
                          await adminAssignPlanAction(business.id, planId);
                        }
                      }}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <select
                        name="planId"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        defaultValue={business.subscriptionPlanId ?? ""}
                      >
                        <option value="" disabled>
                          Select plan
                        </option>
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm">
                        Assign
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold">Recent subscriptions</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {subscriptions.length === 0 ? (
              <li className="text-muted-foreground">None yet.</li>
            ) : (
              subscriptions.map((sub) => (
                <li
                  key={sub.id}
                  className="rounded-md border border-border px-3 py-2"
                >
                  {sub.business.name} · {sub.plan.name} · {sub.status}
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Payment events</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {events.length === 0 ? (
              <li className="text-muted-foreground">None yet.</li>
            ) : (
              events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-md border border-border px-3 py-2"
                >
                  <span className="font-medium">{event.type}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {event.provider} ·{" "}
                    {event.processedAt ? "processed" : "pending"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
