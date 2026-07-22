import { describe, expect, it } from "vitest";

import { computeProfileCompleteness } from "@/lib/business-profile";

describe("computeProfileCompleteness", () => {
  it("scores a minimal listing low", () => {
    const score = computeProfileCompleteness({
      name: "Acme Plumbing",
      description: null,
      phone: null,
      email: null,
      website: null,
      city: null,
      serviceCount: 0,
      areaCount: 0,
      hoursCount: 0,
    });
    expect(score).toBe(10);
  });

  it("rewards full profile fields up to 100", () => {
    const score = computeProfileCompleteness({
      name: "North Country Roofing",
      description:
        "Local roofing for lake-effect snow, ice dams, and freeze-thaw cycles across St. Lawrence County.",
      phone: "3155550100",
      email: "hello@example.com",
      website: "https://example.com",
      city: "Potsdam",
      serviceCount: 2,
      areaCount: 3,
      hoursCount: 5,
    });
    expect(score).toBe(100);
  });

  it("gives partial credit for short descriptions", () => {
    const short = computeProfileCompleteness({
      name: "Test",
      description: "Short bio",
      phone: null,
      email: null,
      website: null,
      city: null,
      serviceCount: 0,
      areaCount: 0,
      hoursCount: 0,
    });
    const long = computeProfileCompleteness({
      name: "Test",
      description: "x".repeat(80),
      phone: null,
      email: null,
      website: null,
      city: null,
      serviceCount: 0,
      areaCount: 0,
      hoursCount: 0,
    });
    expect(short).toBe(20);
    expect(long).toBe(30);
  });
});
