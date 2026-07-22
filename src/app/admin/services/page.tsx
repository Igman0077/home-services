import { Badge } from "@/components/ui/badge";
import { CreateServiceForm } from "@/components/admin/create-service-form";
import { prisma } from "@/lib/db";

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      category: true,
      parent: true,
      _count: { select: { children: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Services
        </h2>
        <p className="mt-2 text-muted-foreground">
          Manage service categories without code changes. Parent/child hierarchy
          is supported.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Flags</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{service.name}</div>
                    {service.parent ? (
                      <div className="text-xs text-muted-foreground">
                        Child of {service.parent.name}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {service.slug}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{service.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {service.isLaunchFocus ? (
                        <Badge variant="success">Launch</Badge>
                      ) : null}
                      {service.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="warning">Inactive</Badge>
                      )}
                      {service._count.children > 0 ? (
                        <Badge variant="outline">
                          {service._count.children} children
                        </Badge>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CreateServiceForm />
      </div>
    </div>
  );
}
