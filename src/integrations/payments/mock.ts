import { randomUUID } from "node:crypto";

import type {
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentProvider,
  PortalSessionInput,
  PortalSessionResult,
} from "./types";

/**
 * Dev/demo billing provider — activates plans without Stripe.
 * Never use in production with real money.
 */
export class MockPaymentProvider implements PaymentProvider {
  name = "mock" as const;

  async createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    const sessionId = `mock_cs_${randomUUID()}`;
    const url = new URL(input.successUrl);
    url.searchParams.set("checkout", "success");
    url.searchParams.set("plan", input.planSlug);
    url.searchParams.set("session_id", sessionId);
    url.searchParams.set("provider", "mock");
    return {
      provider: "mock",
      mode: "redirect",
      url: url.toString(),
      sessionId,
    };
  }

  async createPortalSession(
    input: PortalSessionInput,
  ): Promise<PortalSessionResult> {
    const url = new URL(input.returnUrl);
    url.searchParams.set("portal", "mock");
    return { url: url.toString() };
  }
}
