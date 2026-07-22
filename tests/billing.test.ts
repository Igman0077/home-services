import { describe, expect, it } from "vitest";

import { MockPaymentProvider } from "@/integrations/payments/mock";
import {
  formatPlanPrice,
  humanizeEntitlementKey,
  parsePlanEntitlements,
  placementFromEntitlements,
} from "@/lib/billing";

describe("plan entitlements", () => {
  it("maps featured/sponsored from entitlements honestly", () => {
    expect(
      placementFromEntitlements(
        parsePlanEntitlements({ featured: true, sponsored: false }),
      ),
    ).toEqual({ isFeatured: true, isSponsored: false });

    expect(
      placementFromEntitlements(
        parsePlanEntitlements({ featured: true, sponsored: true }),
      ),
    ).toEqual({ isFeatured: true, isSponsored: true });

    expect(placementFromEntitlements({})).toEqual({
      isFeatured: false,
      isSponsored: false,
    });
  });

  it("formats prices and entitlement labels", () => {
    expect(formatPlanPrice(0, "month")).toBe("Free");
    expect(formatPlanPrice(9900, "month")).toBe("$99/month");
    expect(humanizeEntitlementKey("featured")).toMatch(/Featured/i);
  });
});

describe("mock payment provider", () => {
  it("returns a success redirect with session id", async () => {
    const provider = new MockPaymentProvider();
    const result = await provider.createCheckoutSession({
      businessId: "biz_1",
      planId: "plan_1",
      planSlug: "premium",
      customerEmail: "owner@example.com",
      successUrl: "http://localhost:3000/business/plans",
      cancelUrl: "http://localhost:3000/business/plans?checkout=cancel",
    });
    expect(result.provider).toBe("mock");
    expect(result.url).toContain("checkout=success");
    expect(result.url).toContain("plan=premium");
    expect(result.sessionId).toMatch(/^mock_cs_/);
  });
});
