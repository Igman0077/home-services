import { describe, expect, it } from "vitest";

import {
  hasAnyPermission,
  hasPermission,
  hasRole,
  PERMISSIONS,
  ROLE_PERMISSION_MAP,
} from "@/lib/rbac";
import { slugify } from "@/lib/utils";

describe("rbac", () => {
  it("grants administrators every permission", () => {
    const perms = ROLE_PERMISSION_MAP.ADMINISTRATOR;
    expect(perms).toContain(PERMISSIONS.ADMIN_ACCESS);
    expect(perms).toContain(PERMISSIONS.LEADS_MANAGE);
    expect(perms.length).toBe(Object.values(PERMISSIONS).length);
  });

  it("limits homeowners to homeowner tools", () => {
    const perms = ROLE_PERMISSION_MAP.HOMEOWNER;
    expect(perms).toEqual([PERMISSIONS.HOMEOWNER_TOOLS]);
    expect(hasPermission(perms, PERMISSIONS.ADMIN_ACCESS)).toBe(false);
  });

  it("checks required permissions", () => {
    const perms = ROLE_PERMISSION_MAP.EDITOR;
    expect(hasPermission(perms, PERMISSIONS.CONTENT_MANAGE)).toBe(true);
    expect(
      hasPermission(perms, [PERMISSIONS.CONTENT_MANAGE, PERMISSIONS.AI_REVIEW]),
    ).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.PLANS_MANAGE)).toBe(false);
    expect(
      hasAnyPermission(perms, [
        PERMISSIONS.PLANS_MANAGE,
        PERMISSIONS.CONTENT_PUBLISH,
      ]),
    ).toBe(true);
  });

  it("checks roles", () => {
    expect(hasRole(["EDITOR", "HOMEOWNER"], "EDITOR")).toBe(true);
    expect(hasRole(["HOMEOWNER"], ["ADMINISTRATOR", "EDITOR"])).toBe(false);
  });
});

describe("slugify", () => {
  it("creates URL-safe slugs", () => {
    expect(slugify("St. Lawrence County")).toBe("st-lawrence-county");
    expect(slugify("Roof Replacement")).toBe("roof-replacement");
    expect(slugify("  HVAC / Heating  ")).toBe("hvac-heating");
  });
});
