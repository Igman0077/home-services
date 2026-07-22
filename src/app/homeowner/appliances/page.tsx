import Link from "next/link";

import { DeleteApplianceButton } from "@/components/homeowner/action-buttons";
import { ApplianceForm } from "@/components/homeowner/appliance-form";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";

export const dynamic = "force-dynamic";

export default async function HomeownerAppliancesPage() {
  const session = await requireHomeownerSession();
  const properties = await prisma.homeownerProperty.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true },
  });

  const appliances = await prisma.appliance.findMany({
    where: {
      property: { userId: session.user.id, deletedAt: null },
    },
    orderBy: { name: "asc" },
    include: {
      property: { select: { id: true, nickname: true } },
      warranties: true,
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Appliances & warranties
        </h2>
        <p className="mt-2 text-muted-foreground">
          Keep model numbers and warranty dates available when you request
          service.
        </p>
      </div>

      {properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/homeowner/properties" className="text-accent hover:underline">
            Add a property
          </Link>{" "}
          before tracking appliances.
        </p>
      ) : appliances.length === 0 ? (
        <p className="text-sm text-muted-foreground">No appliances yet.</p>
      ) : (
        <ul className="space-y-2">
          {appliances.map((appliance) => (
            <li
              key={appliance.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium">{appliance.name}</p>
                <p className="text-sm text-muted-foreground">
                  <Link
                    href={`/homeowner/properties/${appliance.property.id}`}
                    className="hover:text-accent"
                  >
                    {appliance.property.nickname}
                  </Link>
                  {[appliance.manufacturer, appliance.model]
                    .filter(Boolean)
                    .map((part) => ` · ${part}`)
                    .join("")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {appliance.warrantyExpires ? (
                    <Badge variant="outline">
                      Warranty {appliance.warrantyExpires.toLocaleDateString()}
                    </Badge>
                  ) : null}
                  {appliance.warranties[0]?.provider ? (
                    <Badge variant="secondary">
                      {appliance.warranties[0].provider}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <DeleteApplianceButton applianceId={appliance.id} />
            </li>
          ))}
        </ul>
      )}

      {properties.length > 0 ? (
        <section className="max-w-xl rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-semibold">Add appliance</h3>
          <div className="mt-4">
            <ApplianceForm properties={properties} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
