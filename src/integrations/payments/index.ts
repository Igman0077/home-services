import { MockPaymentProvider } from "@/integrations/payments/mock";
import { StripePaymentProvider } from "@/integrations/payments/stripe";
import type { PaymentProvider } from "@/integrations/payments/types";

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  const mode = process.env.PAYMENT_PROVIDER ?? "mock";
  if (mode === "stripe") {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "PAYMENT_PROVIDER=stripe requires STRIPE_SECRET_KEY. Use mock for local demos.",
      );
    }
    cached = new StripePaymentProvider(key);
    return cached;
  }

  cached = new MockPaymentProvider();
  return cached;
}

export function resetPaymentProviderCache() {
  cached = null;
}

export type {
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentProvider,
} from "@/integrations/payments/types";
