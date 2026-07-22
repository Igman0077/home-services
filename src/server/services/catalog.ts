import { prisma } from "@/lib/db";
import {
  buildBusinessWhere,
  type BusinessSearchFilters,
} from "@/server/services/directory";

export async function listPublishedBusinesses(
  filters: BusinessSearchFilters = {},
  options: { take?: number; skip?: number } = {},
) {
  try {
    return await prisma.business.findMany({
      where: buildBusinessWhere(filters),
      orderBy: [
        { isSponsored: "desc" },
        { isFeatured: "desc" },
        { name: "asc" },
      ],
      take: options.take ?? 24,
      skip: options.skip ?? 0,
      include: {
        services: { include: { service: true } },
        serviceAreas: { include: { location: true } },
      },
    });
  } catch {
    return [];
  }
}

export async function getBusinessBySlug(slug: string) {
  try {
    return await prisma.business.findFirst({
      where: {
        slug,
        deletedAt: null,
        publishStatus: "PUBLISHED",
      },
      include: {
        services: { include: { service: true } },
        serviceAreas: {
          include: { location: true },
          orderBy: { location: { name: "asc" } },
        },
        hours: { orderBy: { dayOfWeek: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
  } catch {
    return null;
  }
}

export async function listLaunchServices() {
  try {
    return await prisma.service.findMany({
      where: {
        isActive: true,
        parentId: null,
        OR: [{ isLaunchFocus: true }, { status: "PUBLISHED" }],
      },
      orderBy: [{ isLaunchFocus: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      take: 12,
    });
  } catch {
    return [];
  }
}

export async function listCityLocations() {
  try {
    return await prisma.location.findMany({
      where: { type: "CITY", isActive: true, status: "PUBLISHED" },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getLocalServicePage(
  stateSlug: string,
  citySlug: string,
  serviceSlug: string,
) {
  const slugPath = `${stateSlug}/${citySlug}/${serviceSlug}`;
  try {
    return await prisma.localServicePage.findUnique({
      where: { slugPath },
      include: {
        service: true,
        location: { include: { parent: true } },
        faqs: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  } catch {
    return null;
  }
}

export async function listBusinessesForLocalPage(
  serviceId: string,
  locationId: string,
) {
  try {
    return await prisma.business.findMany({
      where: {
        deletedAt: null,
        publishStatus: "PUBLISHED",
        services: { some: { serviceId } },
        serviceAreas: { some: { locationId } },
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      take: 12,
    });
  } catch {
    return [];
  }
}

export async function searchCatalog(query: string) {
  const q = query.trim();
  if (!q) {
    return { services: [], locations: [], businesses: [] };
  }

  try {
    const [services, locations, businesses] = await Promise.all([
      prisma.service.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { shortDescription: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        orderBy: { name: "asc" },
      }),
      prisma.location.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { fullSlug: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        orderBy: { name: "asc" },
      }),
      prisma.business.findMany({
        where: buildBusinessWhere({ q }),
        take: 8,
        orderBy: { name: "asc" },
      }),
    ]);
    return { services, locations, businesses };
  } catch {
    return { services: [], locations: [], businesses: [] };
  }
}
