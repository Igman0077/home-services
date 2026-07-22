import { Badge } from "@/components/ui/badge";
import { CreateLocationForm } from "@/components/admin/create-location-form";
import { prisma } from "@/lib/db";

export default async function AdminLocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: { parent: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Locations
        </h2>
        <p className="mt-2 text-muted-foreground">
          Hierarchical geography stored in the database — not hardcoded to
          Northern New York.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Full slug</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{location.name}</div>
                    {location.parent ? (
                      <div className="text-xs text-muted-foreground">
                        Under {location.parent.name}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{location.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {location.fullSlug}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{location.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CreateLocationForm
          parents={locations.map((l) => ({
            id: l.id,
            name: l.name,
            fullSlug: l.fullSlug,
            type: l.type,
          }))}
        />
      </div>
    </div>
  );
}
