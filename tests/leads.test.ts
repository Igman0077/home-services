import { describe, expect, it } from "vitest";

import { quoteRequestSchema } from "@/lib/validations/quote";
import { leadFingerprint } from "@/server/services/lead-spam";

describe("quote request validation", () => {
  it("accepts a complete valid payload", () => {
    const result = quoteRequestSchema.safeParse({
      serviceId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      locationId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
      zipCode: "",
      projectDescription: "Need roof inspection after heavy snow damage on south side.",
      desiredTimeline: "This month",
      propertyType: "SINGLE_FAMILY",
      contactName: "Alex Homeowner",
      contactEmail: "alex@example.com",
      contactPhone: "3155550100",
      preferredContact: "EITHER",
      consent: true,
      companyWebsite: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing consent and short descriptions", () => {
    const result = quoteRequestSchema.safeParse({
      serviceId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      projectDescription: "Too short",
      contactName: "A",
      contactEmail: "not-an-email",
      preferredContact: "EMAIL",
      consent: false,
      companyWebsite: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects honeypot fills at schema level when non-empty constrained", () => {
    const result = quoteRequestSchema.safeParse({
      serviceId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      locationId: "",
      zipCode: "13676",
      projectDescription: "Need a plumber for a frozen pipe in the basement crawlspace.",
      contactName: "Alex Homeowner",
      contactEmail: "alex@example.com",
      contactPhone: "",
      preferredContact: "EMAIL",
      consent: true,
      companyWebsite: "https://spam.example",
    });
    expect(result.success).toBe(false);
  });
});

describe("lead fingerprint", () => {
  it("is stable for the same identity inputs", () => {
    const a = leadFingerprint({
      email: "Alex@Example.com",
      serviceId: "svc1",
      phone: "(315) 555-0100",
    });
    const b = leadFingerprint({
      email: "alex@example.com",
      serviceId: "svc1",
      phone: "3155550100",
    });
    expect(a).toBe(b);
  });
});
