import { prisma } from "@/lib/db";

export async function resolveManagedBusiness(
  userId: string,
  preferredBusinessId?: string | null,
) {
  const memberships = await prisma.businessMember.findMany({
    where: { userId },
    include: {
      business: {
        include: {
          leadPreferences: true,
          subscriptionPlan: true,
          services: { include: { service: true } },
          serviceAreas: { include: { location: true } },
          hours: true,
          _count: {
            select: {
              leadAssignments: true,
              services: true,
              serviceAreas: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) return null;

  if (preferredBusinessId) {
    const match = memberships.find((m) => m.businessId === preferredBusinessId);
    if (match) return match.business;
  }

  const primary = memberships.find((m) => m.isPrimary);
  return (primary ?? memberships[0]).business;
}
