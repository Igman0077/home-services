import {
  AssignFreePlanButton,
  BillingPortalButton,
  CheckoutButton,
} from "@/components/billing/checkout-buttons";
import { Badge } from "@/components/ui/badge";
import {
  formatPlanPrice,
  humanizeEntitlementKey,
  parsePlanEntitlements,
} from "@/lib/billing";
import { requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { completeMockCheckoutAction } from "@/server/actions/billing";
import { resolveManagedBusiness } from "@/server/services/business-context";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    checkout?: string;
    plan?: string;
    session_id?: string;
    provider?: string;
  }>;
};

export default async function BusinessPlansPage({ searchParams }: Props) {
  const session = await requireSession();
  const business = await resolveManagedBusiness(session.user.id);
  const params = await searchParams;

  let checkoutMessage: string | null = null;
  if (
    params.checkout === "success" &&
    params.provider === "mock" &&
    params.plan &&
    params.session_id &&
    business
  ) {
    const result = await completeMockCheckoutAction(
      params.plan,
      params.session_id,
    );
    checkoutMessage = result.ok
      ? `Plan upgraded to ${params.plan}. Featured/sponsored placement updated from entitlements.`
      : result.error ?? "Checkout could not be completed.";
  } else if (params.checkout === "success") {
    checkoutMessage =
      "Checkout completed. If Stripe webhooks are configured, your plan will sync automatically.";
  } else if (params.checkout === "cancel") {
    checkoutMessage = "Checkout canceled — no changes were made.";
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const subscription = business
    ? await prisma.subscription.findFirst({
        where: { businessId: business.id },
        orderBy: { createdAt: "desc" },
        include: { plan: true },
      })
    : null;

  const provider = process.env.PAYMENT_PROVIDER ?? "mock";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold text-primary">
            Subscription plans
          </h2>
          <p className="mt-2 text-muted-foreground">
            Paid plans unlock lead eligibility and placement entitlements.
            Featured and Sponsored badges only appear when the plan (or an admin
            override) grants them — never invent prominence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Billing: {provider}</Badge>
          {business ? <BillingPortalButton /> : null}
        </div>
      </div>

      {checkoutMessage ? (
        <p
          className="rounded-lg border border-border bg-card p-4 text-sm"
          role="status"
        >
          {checkoutMessage}
        </p>
      ) : null}

      {business ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <p>
            Current plan for <strong>{business.name}</strong>:{" "}
            <Badge variant="success">
              {business.subscriptionPlan?.name ?? "None assigned"}
            </Badge>
          </p>
          <p className="mt-2 text-muted-foreground">
            Placement:{" "}
            {business.isFeatured ? "Featured" : "Not featured"}
            {" · "}
            {business.isSponsored ? "Sponsored" : "Not sponsored"}
            {subscription?.status ? ` · Subscription ${subscription.status}` : ""}
          </p>
          <div className="mt-3">
            <AssignFreePlanButton />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Link a business before upgrading.
        </p>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const entitlements = parsePlanEntitlements(plan.entitlements);
          const isCurrent = business?.subscriptionPlanId === plan.id;
          return (
            <li
              key={plan.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <Badge variant="outline">
                  {formatPlanPrice(plan.priceCents, plan.interval)}
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
                    {humanizeEntitlementKey(key)}: {String(value)}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {!business ? (
                  <p className="text-xs text-muted-foreground">
                    Link a business to upgrade.
                  </p>
                ) : isCurrent ? (
                  <Badge variant="secondary">Current plan</Badge>
                ) : plan.priceCents <= 0 ? (
                  <AssignFreePlanButton />
                ) : (
                  <CheckoutButton planId={plan.id} label={`Upgrade to ${plan.name}`} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
