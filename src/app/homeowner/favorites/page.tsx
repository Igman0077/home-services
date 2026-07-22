import Link from "next/link";

import { BusinessCard } from "@/components/directory/business-card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";

export const dynamic = "force-dynamic";

export default async function HomeownerFavoritesPage() {
  const session = await requireHomeownerSession();
  const favorites = await prisma.favoriteBusiness.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { business: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Saved businesses
        </h2>
        <p className="mt-2 text-muted-foreground">
          Bookmarks for contractors you may want to contact later. Saving a
          listing does not notify the business.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No saved businesses yet.
          </p>
          <Button asChild>
            <Link href="/businesses">Browse directory</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {favorites.map((fav) => (
            <li key={`${fav.userId}-${fav.businessId}`}>
              <BusinessCard business={fav.business} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
