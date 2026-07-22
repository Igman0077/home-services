import { prisma } from "@/lib/db";
import { requireSession, AuthError } from "@/lib/auth-guards";
import { computeProfileCompleteness } from "@/lib/business-profile";
import { hasPermission } from "@/lib/rbac";
import type { Session } from "next-auth";

export { computeProfileCompleteness } from "@/lib/business-profile";

export async function getSessionBusinessIds(userId: string): Promise<string[]> {
  const memberships = await prisma.businessMember.findMany({
    where: { userId },
    select: { businessId: true },
  });
  return memberships.map((m) => m.businessId);
}

export async function requireBusinessMembership(businessId: string): Promise<{
  session: Session;
  isAdmin: boolean;
}> {
  const session = await requireSession();
  const isAdmin =
    hasPermission(session.user.permissions, "businesses.manage") ||
    hasPermission(session.user.permissions, "leads.manage");

  if (isAdmin) {
    return { session, isAdmin: true };
  }

  const membership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: { businessId, userId: session.user.id },
    },
  });

  if (!membership) {
    throw new AuthError("You do not manage this business.");
  }

  return { session, isAdmin: false };
}

export async function refreshProfileCompleteness(businessId: string) {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: {
      _count: {
        select: { services: true, serviceAreas: true, hours: true },
      },
    },
  });

  const profileCompleteness = computeProfileCompleteness({
    name: business.name,
    description: business.description,
    phone: business.phone,
    email: business.email,
    website: business.website,
    city: business.city,
    serviceCount: business._count.services,
    areaCount: business._count.serviceAreas,
    hoursCount: business._count.hours,
  });

  return prisma.business.update({
    where: { id: businessId },
    data: { profileCompleteness },
  });
}
