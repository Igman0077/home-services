import Link from "next/link";

import { PropertyForm } from "@/components/homeowner/property-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";

export const dynamic = "force-dynamic";

export default async function HomeownerPropertiesPage() {
  const session = await requireHomeownerSession();
  const properties = await prisma.homeownerProperty.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { appliances: true, maintenanceTasks: true, documents: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Properties
        </h2>
        <p className="mt-2 text-muted-foreground">
          Keep heating, roof, and utility details handy for maintenance and
          quote requests.
        </p>
      </div>

      {properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No properties yet.</p>
      ) : (
        <ul className="space-y-3">
          {properties.map((property) => (
            <li
              key={property.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div>
                <Link
                  href={`/homeowner/properties/${property.id}`}
                  className="font-semibold hover:text-accent"
                >
                  {property.nickname}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {[property.city, property.stateCode].filter(Boolean).join(", ") ||
                    "Address not set"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline">{property.propertyType}</Badge>
                  <Badge variant="secondary">
                    {property._count.appliances} appliances
                  </Badge>
                  <Badge variant="secondary">
                    {property._count.maintenanceTasks} tasks
                  </Badge>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/homeowner/properties/${property.id}`}>Open</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <section className="max-w-xl rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Add a property</h3>
        <div className="mt-4">
          <PropertyForm />
        </div>
      </section>
    </div>
  );
}
