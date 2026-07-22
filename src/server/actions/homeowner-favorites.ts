"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import type { HomeownerActionResult } from "@/server/services/homeowner-access";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";

export async function toggleFavoriteBusinessAction(
  businessId: string,
): Promise<HomeownerActionResult & { favorited?: boolean }> {
  try {
    const session = await requireHomeownerSession();
    const business = await prisma.business.findFirst({
      where: { id: businessId, deletedAt: null, publishStatus: "PUBLISHED" },
      select: { id: true, slug: true },
    });
    if (!business) return { ok: false, error: "Business not found." };

    const existing = await prisma.favoriteBusiness.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId: business.id,
        },
      },
    });

    if (existing) {
      await prisma.favoriteBusiness.delete({
        where: {
          userId_businessId: {
            userId: session.user.id,
            businessId: business.id,
          },
        },
      });
      revalidatePath("/homeowner/favorites");
      revalidatePath(`/businesses/${business.slug}`);
      return { ok: true, favorited: false, id: business.id };
    }

    await prisma.favoriteBusiness.create({
      data: { userId: session.user.id, businessId: business.id },
    });
    revalidatePath("/homeowner/favorites");
    revalidatePath(`/businesses/${business.slug}`);
    return { ok: true, favorited: true, id: business.id };
  } catch {
    return { ok: false, error: "Unable to update favorite." };
  }
}
