import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteApplianceButton, DeletePropertyButton } from "@/components/homeowner/action-buttons";
import { ApplianceForm } from "@/components/homeowner/appliance-form";
import { PropertyForm } from "@/components/homeowner/property-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function HomeownerPropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireHomeownerSession();
  const property = await prisma.homeownerProperty.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: {
      appliances: {
        orderBy: { name: "asc" },
        include: { warranties: true },
      },
    },
  });
  if (!property) notFound();

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/homeowner/properties" className="hover:text-accent">
              Properties
            </Link>
          </p>
          <h2 className="font-display text-3xl font-semibold text-primary">
            {property.nickname}
          </h2>
          <Badge variant="outline" className="mt-2">
            {property.propertyType}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/homeowner/tasks?property=${property.id}`}>Tasks</Link>
          </Button>
          <DeletePropertyButton propertyId={property.id} />
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Details</h3>
        <div className="mt-4">
          <PropertyForm property={property} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Appliances</h3>
        {property.appliances.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appliances yet.</p>
        ) : (
          <ul className="space-y-2">
            {property.appliances.map((appliance) => (
              <li
                key={appliance.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{appliance.name}</p>
                  <p className="text-muted-foreground">
                    {[appliance.manufacturer, appliance.model]
                      .filter(Boolean)
                      .join(" · ") || "No model details"}
                    {appliance.warrantyExpires
                      ? ` · warranty to ${appliance.warrantyExpires.toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <DeleteApplianceButton applianceId={appliance.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="max-w-xl rounded-lg border border-border bg-card p-5">
          <h4 className="font-medium">Add appliance</h4>
          <div className="mt-3">
            <ApplianceForm
              propertyId={property.id}
              properties={[{ id: property.id, nickname: property.nickname }]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
