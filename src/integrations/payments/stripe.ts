import Stripe from "stripe";

import type {
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentProvider,
  PortalSessionInput,
  PortalSessionResult,
} from "./types";

export class StripePaymentProvider implements PaymentProvider {
  name = "stripe" as const;
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2026-06-24.dahlia",
    });
  }

  async createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    if (!input.stripePriceId) {
      throw new Error(
        `Plan ${input.planSlug} is missing stripePriceId. Set it in admin/seed or use PAYMENT_PROVIDER=mock.`,
      );
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: input.customerEmail,
      line_items: [{ price: input.stripePriceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        businessId: input.businessId,
        planId: input.planId,
        planSlug: input.planSlug,
        ...input.metadata,
      },
      subscription_data: {
        metadata: {
          businessId: input.businessId,
          planId: input.planId,
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return {
      provider: "stripe",
      mode: "redirect",
      url: session.url,
      sessionId: session.id,
    };
  }

  async createPortalSession(
    input: PortalSessionInput,
  ): Promise<PortalSessionResult> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: input.stripeCustomerId,
      return_url: input.returnUrl,
    });
    return { url: session.url };
  }

  async constructWebhookEvent(rawBody: string, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
    }
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      secret,
    );
    return { id: event.id, type: event.type, data: event.data };
  }
}
