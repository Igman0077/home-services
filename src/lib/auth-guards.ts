import { auth } from "@/lib/auth";
import {
  hasPermission,
  hasRole,
  type PermissionKey,
} from "@/lib/rbac";
import type { RoleName } from "@prisma/client";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("You must be signed in.", "UNAUTHENTICATED");
  }
  return session;
}

export async function requirePermission(
  permission: PermissionKey | PermissionKey[],
) {
  const session = await requireSession();
  if (!hasPermission(session.user.permissions, permission)) {
    throw new AuthError("You do not have permission to perform this action.");
  }
  return session;
}

export async function requireRole(role: RoleName | RoleName[]) {
  const session = await requireSession();
  if (!hasRole(session.user.roles, role)) {
    throw new AuthError("You do not have the required role.");
  }
  return session;
}

export async function requireAdminAccess() {
  return requirePermission("admin.access");
}
