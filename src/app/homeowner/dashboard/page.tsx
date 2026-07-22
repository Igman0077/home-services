import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";

export const dynamic = "force-dynamic";

export default async function HomeownerDashboardPage() {
  const session = await requireHomeownerSession();

  const [properties, openTasks, appliances, documents, favorites] =
    await Promise.all([
      prisma.homeownerProperty.count({
        where: { userId: session.user.id, deletedAt: null },
      }),
      prisma.maintenanceTask.count({
        where: { userId: session.user.id, completedAt: null },
      }),
      prisma.appliance.count({
        where: {
          property: { userId: session.user.id, deletedAt: null },
        },
      }),
      prisma.document.count({ where: { userId: session.user.id } }),
      prisma.favoriteBusiness.count({ where: { userId: session.user.id } }),
    ]);

  const upcoming = await prisma.maintenanceTask.findMany({
    where: { userId: session.user.id, completedAt: null },
    orderBy: { dueDate: "asc" },
    take: 5,
    include: { property: { select: { nickname: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Home overview
        </h2>
        <p className="mt-2 text-muted-foreground">
          Track properties, seasonal maintenance, appliances, and private
          documents in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Properties", properties, "/homeowner/properties"],
          ["Open tasks", openTasks, "/homeowner/tasks"],
          ["Appliances", appliances, "/homeowner/appliances"],
          ["Documents", documents, "/homeowner/documents"],
          ["Saved", favorites, "/homeowner/favorites"],
        ].map(([label, value, href]) => (
          <Link
            key={String(label)}
            href={String(href)}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/40"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-semibold">{value}</p>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Upcoming tasks</h3>
          <Button asChild size="sm" variant="outline">
            <Link href="/homeowner/tasks">Manage tasks</Link>
          </Button>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open tasks. Add one or load Northern NY seasonal suggestions.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-muted-foreground">
                    {task.property?.nickname ?? "General"}
                    {task.dueDate
                      ? ` · due ${task.dueDate.toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                {task.isSeasonalSuggestion ? (
                  <Badge variant="outline">Seasonal</Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {properties === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6">
          <h3 className="font-semibold">Add your first property</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Nickname a home, then attach appliances, tasks, and documents.
          </p>
          <Button asChild className="mt-4">
            <Link href="/homeowner/properties">Add property</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
