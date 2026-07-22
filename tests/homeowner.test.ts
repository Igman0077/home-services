import { describe, expect, it } from "vitest";

import {
  getSeasonalSuggestions,
  nextDueDateForSuggestion,
} from "@/lib/seasonal-tasks";

describe("seasonal maintenance suggestions", () => {
  it("returns nearby suggestions for October", () => {
    const suggestions = getSeasonalSuggestions(10);
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
    expect(suggestions.some((s) => /gutter|faucet|detector|furnace|heat/i.test(s.title))).toBe(
      true,
    );
  });

  it("falls back to a catalog slice when month has few matches", () => {
    const suggestions = getSeasonalSuggestions(7);
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it("computes next due date in the current or next year", () => {
    const from = new Date("2026-08-01T12:00:00Z");
    const due = nextDueDateForSuggestion(10, from);
    expect(due.getUTCFullYear()).toBe(2026);
    expect(due.getUTCMonth()).toBe(9);
  });
});
