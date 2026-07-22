import { prisma } from "@/lib/db";

export async function listPublishedGuides() {
  try {
    return await prisma.guide.findMany({
      where: { status: "PUBLISHED", indexDirective: "INDEX" },
      orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        authorName: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getPublishedGuideBySlug(slug: string) {
  try {
    return await prisma.guide.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        faqs: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        services: { include: { service: true } },
        locations: { include: { location: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function getPublishedCalculator(slug: string) {
  try {
    return await prisma.calculator.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { configuration: true },
    });
  } catch {
    return null;
  }
}

export async function listPublishedCalculators() {
  try {
    return await prisma.calculator.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}
