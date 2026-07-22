import { prisma } from "@/lib/db";
import {
  parsePlanEntitlements,
  placementFromEntitlements,
} from "@/lib/billing";

export async function applyPlanToBusiness(input: {
  businessId: string;
  planId: string;
  status?: "ACTIVE" | "TRIALING" | "CANCELED" | "PAST_DUE" | "INCOMPLETE";
  stripeCustomerId?: string | null;
  stripeSubId?: string | null;
  currentPeriodEnd?: Date | null;
  preserveManualSponsored?: boolean;
}) {
  const plan = await prisma.subscriptionPlan.findUniqueOrThrow({
    where: { id: input.planId },
  });
  const entitlements = parsePlanEntitlements(plan.entitlements);
  const placement = placementFromEntitlements(entitlements);

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: input.businessId },
  });

  // When downgrading, clear placement flags unless admin manually kept sponsored
  // and the new plan still allows sponsored. Featured always follows plan.
  const isSponsored = placement.isSponsored
    ? true
    : input.preserveManualSponsored
      ? business.isSponsored
      : false;

  await prisma.business.update({
    where: { id: input.businessId },
    data: {
      subscriptionPlanId: plan.id,
      isFeatured: placement.isFeatured,
      isSponsored,
    },
  });

  const existing = await prisma.subscription.findFirst({
    where: {
      businessId: input.businessId,
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE", "INCOMPLETE"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        planId: plan.id,
        status: input.status ?? "ACTIVE",
        stripeCustomerId:
          input.stripeCustomerId ?? existing.stripeCustomerId,
        stripeSubId: input.stripeSubId ?? existing.stripeSubId,
        currentPeriodEnd:
          input.currentPeriodEnd ?? existing.currentPeriodEnd,
      },
      include: { plan: true },
    });
  }

  return prisma.subscription.create({
    data: {
      businessId: input.businessId,
      planId: plan.id,
      status: input.status ?? "ACTIVE",
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubId: input.stripeSubId ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
    },
    include: { plan: true },
  });
}

export async function downgradeBusinessToFree(businessId: string) {
  const free = await prisma.subscriptionPlan.findUnique({
    where: { slug: "free" },
  });
  if (!free) {
    await prisma.business.update({
      where: { id: businessId },
      data: { isFeatured: false, isSponsored: false, subscriptionPlanId: null },
    });
    return null;
  }
  return applyPlanToBusiness({
    businessId,
    planId: free.id,
    status: "CANCELED",
    preserveManualSponsored: false,
  });
}
