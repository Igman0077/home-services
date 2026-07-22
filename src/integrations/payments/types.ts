export type CheckoutSessionInput = {
  businessId: string;
  planId: string;
  planSlug: string;
  stripePriceId?: string | null;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type CheckoutSessionResult = {
  provider: "mock" | "stripe";
  mode: "redirect" | "activated";
  url?: string;
  sessionId?: string;
};

export type PortalSessionInput = {
  stripeCustomerId: string;
  returnUrl: string;
};

export type PortalSessionResult = {
  url: string;
};

export type PaymentProvider = {
  name: "mock" | "stripe";
  createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult>;
  createPortalSession(
    input: PortalSessionInput,
  ): Promise<PortalSessionResult>;
  constructWebhookEvent?(
    rawBody: string,
    signature: string,
  ): Promise<{ id: string; type: string; data: unknown }>;
};
