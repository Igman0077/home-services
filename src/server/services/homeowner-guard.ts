import { AuthError, requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { ensureHomeownerPermission } from "@/server/services/homeowner-access";

/**
 * Homeowner tools are available to any signed-in account.
 * Ownership checks on each resource are the real ACL.
 */
export async function requireHomeownerSession() {
  const session = await requireSession();
  await ensureHomeownerPermission(session.user.id);
  return session;
}

export async function requireOwnedProperty(propertyId: string) {
  const session = await requireHomeownerSession();
  const property = await prisma.homeownerProperty.findFirst({
    where: {
      id: propertyId,
      userId: session.user.id,
      deletedAt: null,
    },
  });
  if (!property) {
    throw new AuthError("Property not found.");
  }
  return { session, property };
}
