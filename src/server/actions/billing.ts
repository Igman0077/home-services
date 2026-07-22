"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getPaymentProvider } from "@/integrations/payments";
import { requirePermission, requireSession } from "@/lib/auth-guards";
import { absoluteUrl } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/server/services/audit";
import {
  applyPlanToBusiness,
  downgradeBusinessToFree,
} from "@/server/services/billing";
import { requireBusinessMembership } from "@/server/services/business-access";

export type BillingActionResult = {
  ok: boolean;
  error?: string;
  url?: string;
};

export async function startPlanCheckoutAction(
  planId: string,
): Promise<BillingActionResult> {
  try {
    const session = await requireSession();
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id: planId, isActive: true },
    });
    if (!plan) return { ok: false, error: "Plan not found." };
    if (plan.priceCents <= 0) {
      return { ok: false, error: "Use Switch to Free for $0 plans." };
    }

    const membership = await prisma.businessMember.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) {
      return { ok: false, error: "Link a business before upgrading." };
    }
    await requireBusinessMembership(membership.businessId);

    const provider = getPaymentProvider();
    const successUrl = absoluteUrl(
      `/business/plans?checkout=success&plan=${plan.slug}`,
    );
    const cancelUrl = absoluteUrl("/business/plans?checkout=cancel");

    const sessionResult = await provider.createCheckoutSession({
      businessId: membership.businessId,
      planId: plan.id,
      planSlug: plan.slug,
      stripePriceId: plan.stripePriceId,
      customerEmail: session.user.email,
      successUrl,
      cancelUrl,
      metadata: { userId: session.user.id },
    });

    if (provider.name === "mock" && sessionResult.sessionId) {
      await prisma.paymentEvent.create({
        data: {
          provider: "mock",
          eventId: sessionResult.sessionId,
          type: "checkout.session.created",
          payload: {
            businessId: membership.businessId,
            planId: plan.id,
            planSlug: plan.slug,
          },
        },
      });
    }

    await writeAuditLog({
      actorId: session.user.id,
      action: "billing.checkout_started",
      entityType: "Business",
      entityId: membership.businessId,
      metadata: {
        planId: plan.id,
        provider: provider.name,
        sessionId: sessionResult.sessionId,
      },
    });

    if (sessionResult.url) {
      redirect(sessionResult.url);
    }
    return { ok: false, error: "No checkout URL returned." };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to start checkout.",
    };
  }
}

export async function completeMockCheckoutAction(
  planSlug: string,
  sessionId: string,
): Promise<BillingActionResult> {
  try {
    const session = await requireSession();
    const membership = await prisma.businessMember.findFirst({
      where: { userId: session.user.id },
    });
    if (!membership) return { ok: false, error: "No business linked." };

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { slug: planSlug },
    });
    if (!plan) return { ok: false, error: "Plan not found." };

    const event = await prisma.paymentEvent.findUnique({
      where: { eventId: sessionId },
    });
    if (!event) {
      return { ok: false, error: "Unknown checkout session." };
    }
    if (event.processedAt) {
      return { ok: true };
    }

    const payload = event.payload as {
      businessId?: string;
      planId?: string;
    };
    if (payload.businessId !== membership.businessId) {
      return { ok: false, error: "Checkout session mismatch." };
    }

    await applyPlanToBusiness({
      businessId: membership.businessId,
      planId: plan.id,
      status: "ACTIVE",
      stripeCustomerId: `mock_cus_${membership.businessId.slice(0, 8)}`,
      stripeSubId: `mock_sub_${sessionId.slice(0, 18)}`,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await prisma.paymentEvent.update({
      where: { id: event.id },
      data: {
        processedAt: new Date(),
        type: "checkout.session.completed",
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "billing.mock_checkout_completed",
      entityType: "Business",
      entityId: membership.businessId,
      metadata: { planSlug, sessionId },
    });

    revalidatePath("/business/plans");
    revalidatePath("/business/dashboard");
    revalidatePath("/businesses");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to complete mock checkout." };
  }
}

export async function openBillingPortalAction(): Promise<BillingActionResult> {
  try {
    const session = await requireSession();
    const membership = await prisma.businessMember.findFirst({
      where: { userId: session.user.id },
    });
    if (!membership) return { ok: false, error: "No business linked." };

    const sub = await prisma.subscription.findFirst({
      where: {
        businessId: membership.businessId,
        stripeCustomerId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!sub?.stripeCustomerId) {
      return {
        ok: false,
        error: "No billing customer yet. Upgrade a plan first.",
      };
    }

    const provider = getPaymentProvider();
    const portal = await provider.createPortalSession({
      stripeCustomerId: sub.stripeCustomerId,
      returnUrl: absoluteUrl("/business/plans"),
    });

    redirect(portal.url);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return { ok: false, error: "Unable to open billing portal." };
  }
}

export async function assignFreePlanAction(): Promise<BillingActionResult> {
  try {
    const session = await requireSession();
    const membership = await prisma.businessMember.findFirst({
      where: { userId: session.user.id },
    });
    if (!membership) return { ok: false, error: "No business linked." };
    await downgradeBusinessToFree(membership.businessId);
    await writeAuditLog({
      actorId: session.user.id,
      action: "billing.assigned_free",
      entityType: "Business",
      entityId: membership.businessId,
    });
    revalidatePath("/business/plans");
    revalidatePath("/businesses");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to assign free plan." };
  }
}

export async function adminAssignPlanAction(
  businessId: string,
  planId: string,
): Promise<BillingActionResult> {
  try {
    const session = await requirePermission("plans.manage");
    await applyPlanToBusiness({
      businessId,
      planId,
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await writeAuditLog({
      actorId: session.user.id,
      action: "billing.admin_assign_plan",
      entityType: "Business",
      entityId: businessId,
      metadata: { planId },
    });
    revalidatePath("/admin/billing");
    revalidatePath("/admin/businesses");
    revalidatePath("/businesses");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to assign plan." };
  }
}

export async function adminSetPlacementAction(
  businessId: string,
  flags: { isFeatured?: boolean; isSponsored?: boolean },
): Promise<BillingActionResult> {
  try {
    const session = await requirePermission("plans.manage");
    await prisma.business.update({
      where: { id: businessId },
      data: {
        ...(flags.isFeatured !== undefined
          ? { isFeatured: flags.isFeatured }
          : {}),
        ...(flags.isSponsored !== undefined
          ? { isSponsored: flags.isSponsored }
          : {}),
      },
    });
    await writeAuditLog({
      actorId: session.user.id,
      action: "billing.placement_updated",
      entityType: "Business",
      entityId: businessId,
      metadata: flags,
    });
    revalidatePath("/admin/billing");
    revalidatePath("/businesses");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to update placement." };
  }
}
