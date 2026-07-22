import { prisma } from "@/lib/db";
import {
  applyPlanToBusiness,
  downgradeBusinessToFree,
} from "@/server/services/billing";

type StripeLikeObject = {
  id?: string;
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
  metadata?: Record<string, string>;
  amount_paid?: number;
  status?: string;
  hosted_invoice_url?: string | null;
  current_period_end?: number;
  items?: {
    data?: { price?: { id?: string } }[];
  };
};

function customerId(value: StripeLikeObject["customer"]): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

function subscriptionId(
  value: StripeLikeObject["subscription"],
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

export async function processPaymentWebhookEvent(input: {
  provider: string;
  eventId: string;
  type: string;
  payload: unknown;
}) {
  const existing = await prisma.paymentEvent.findUnique({
    where: { eventId: input.eventId },
  });
  if (existing?.processedAt) {
    return { ok: true, duplicate: true };
  }

  const eventRow =
    existing ??
    (await prisma.paymentEvent.create({
      data: {
        provider: input.provider,
        eventId: input.eventId,
        type: input.type,
        payload: input.payload as object,
      },
    }));

  const payloadRecord = input.payload as Record<string, unknown> | null;
  const dataObject = (
    payloadRecord &&
    typeof payloadRecord === "object" &&
    payloadRecord.object &&
    typeof payloadRecord.object === "object"
      ? (payloadRecord.object as StripeLikeObject)
      : (input.payload as StripeLikeObject)
  );

  try {
    switch (input.type) {
      case "checkout.session.completed": {
        const businessId = dataObject.metadata?.businessId;
        const planId = dataObject.metadata?.planId;
        if (businessId && planId) {
          await applyPlanToBusiness({
            businessId,
            planId,
            status: "ACTIVE",
            stripeCustomerId: customerId(dataObject.customer),
            stripeSubId: subscriptionId(dataObject.subscription),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const businessId = dataObject.metadata?.businessId;
        const planId = dataObject.metadata?.planId;
        if (businessId && planId) {
          const status =
            dataObject.status === "active"
              ? "ACTIVE"
              : dataObject.status === "past_due"
                ? "PAST_DUE"
                : dataObject.status === "trialing"
                  ? "TRIALING"
                  : dataObject.status === "canceled"
                    ? "CANCELED"
                    : "INCOMPLETE";
          await applyPlanToBusiness({
            businessId,
            planId,
            status,
            stripeCustomerId: customerId(dataObject.customer),
            stripeSubId: dataObject.id ?? null,
            currentPeriodEnd: dataObject.current_period_end
              ? new Date(dataObject.current_period_end * 1000)
              : null,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const businessId = dataObject.metadata?.businessId;
        if (businessId) {
          await downgradeBusinessToFree(businessId);
        }
        break;
      }
      case "invoice.paid": {
        const stripeSubId = subscriptionId(dataObject.subscription);
        if (stripeSubId) {
          const sub = await prisma.subscription.findFirst({
            where: { stripeSubId },
          });
          if (sub) {
            await prisma.invoice.upsert({
              where: {
                stripeInvoiceId: dataObject.id ?? `inv_${eventRow.id}`,
              },
              create: {
                subscriptionId: sub.id,
                stripeInvoiceId: dataObject.id ?? `inv_${eventRow.id}`,
                amountCents: dataObject.amount_paid ?? 0,
                status: dataObject.status ?? "paid",
                hostedUrl: dataObject.hosted_invoice_url ?? null,
              },
              update: {
                amountCents: dataObject.amount_paid ?? 0,
                status: dataObject.status ?? "paid",
                hostedUrl: dataObject.hosted_invoice_url ?? null,
              },
            });
          }
        }
        break;
      }
      default:
        break;
    }

    await prisma.paymentEvent.update({
      where: { id: eventRow.id },
      data: { processedAt: new Date(), type: input.type },
    });
    return { ok: true, duplicate: false };
  } catch (error) {
    await prisma.paymentEvent.update({
      where: { id: eventRow.id },
      data: {
        payload: {
          ...(typeof eventRow.payload === "object" && eventRow.payload
            ? (eventRow.payload as object)
            : {}),
          processingError:
            error instanceof Error ? error.message : "Unknown error",
        },
      },
    });
    throw error;
  }
}
