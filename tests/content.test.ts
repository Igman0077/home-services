import { describe, expect, it } from "vitest";

import { MockAiProvider } from "@/integrations/ai/mock";
import { canTransitionGuideStatus } from "@/lib/content";
import {
  estimateRoofReplacement,
  formatUsdFromCents,
} from "@/lib/calculators/roof";

describe("guide status transitions", () => {
  it("allows draft → review → approve → publish", () => {
    expect(canTransitionGuideStatus("DRAFT", "IN_REVIEW")).toBe(true);
    expect(canTransitionGuideStatus("IN_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionGuideStatus("APPROVED", "PUBLISHED")).toBe(true);
    expect(canTransitionGuideStatus("DRAFT", "PUBLISHED")).toBe(false);
  });
});

describe("roof calculator", () => {
  it("returns a coherent low/high range", () => {
    const result = estimateRoofReplacement({
      squares: 20,
      pitch: "medium",
      material: "asphalt",
    });
    expect(result.highCents).toBeGreaterThan(result.lowCents);
    expect(result.disclaimer.toLowerCase()).toContain("estimate");
    expect(formatUsdFromCents(result.lowCents)).toMatch(/\$/);
  });
});

describe("mock AI guide drafts", () => {
  it("produces reviewable educational output without auto-publish claims", async () => {
    const provider = new MockAiProvider();
    const result = await provider.generateGuideDraft({
      type: "guide_draft",
      topic: "Frozen pipe prevention",
      serviceName: "Plumbing",
      locationName: "Potsdam",
    });
    expect(result.output.title).toMatch(/Frozen pipe/i);
    expect(result.output.faqs.length).toBeGreaterThan(0);
    expect(result.output.disclaimer.toLowerCase()).toContain("human-reviewed");
    expect(result.output.contentBlocks.body.length).toBeGreaterThan(40);
  });
});
