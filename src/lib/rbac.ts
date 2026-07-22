import type { RoleName } from "@prisma/client";

/**
 * Permission keys used for server-side authorization.
 * Keep keys stable — they are seeded and referenced in code.
 */
export const PERMISSIONS = {
  ADMIN_ACCESS: "admin.access",
  USERS_MANAGE: "users.manage",
  BUSINESSES_MANAGE: "businesses.manage",
  BUSINESSES_REVIEW: "businesses.review",
  SERVICES_MANAGE: "services.manage",
  LOCATIONS_MANAGE: "locations.manage",
  CONTENT_MANAGE: "content.manage",
  CONTENT_PUBLISH: "content.publish",
  AI_GENERATE: "ai.generate",
  AI_REVIEW: "ai.review",
  LEADS_MANAGE: "leads.manage",
  LEADS_ASSIGN: "leads.assign",
  SETTINGS_MANAGE: "settings.manage",
  AUDIT_VIEW: "audit.view",
  ANALYTICS_VIEW: "analytics.view",
  PLANS_MANAGE: "plans.manage",
  BUSINESS_PROFILE_EDIT: "business.profile.edit",
  BUSINESS_LEADS_VIEW: "business.leads.view",
  HOMEOWNER_TOOLS: "homeowner.tools",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSION_MAP: Record<RoleName, PermissionKey[]> = {
  HOMEOWNER: [PERMISSIONS.HOMEOWNER_TOOLS],
  BUSINESS_OWNER: [
    PERMISSIONS.BUSINESS_PROFILE_EDIT,
    PERMISSIONS.BUSINESS_LEADS_VIEW,
  ],
  EDITOR: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.CONTENT_PUBLISH,
    PERMISSIONS.AI_GENERATE,
    PERMISSIONS.AI_REVIEW,
    PERMISSIONS.BUSINESSES_REVIEW,
    PERMISSIONS.SERVICES_MANAGE,
    PERMISSIONS.LOCATIONS_MANAGE,
  ],
  ADMINISTRATOR: Object.values(PERMISSIONS),
};

export function hasPermission(
  userPermissions: readonly string[],
  required: PermissionKey | PermissionKey[],
): boolean {
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((key) => userPermissions.includes(key));
}

export function hasAnyPermission(
  userPermissions: readonly string[],
  required: PermissionKey[],
): boolean {
  return required.some((key) => userPermissions.includes(key));
}

export function hasRole(
  userRoles: readonly RoleName[],
  required: RoleName | RoleName[],
): boolean {
  const needed = Array.isArray(required) ? required : [required];
  return needed.some((role) => userRoles.includes(role));
}
