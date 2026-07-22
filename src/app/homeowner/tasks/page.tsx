import {
  CompleteTaskButton,
  DeleteTaskButton,
} from "@/components/homeowner/action-buttons";
import { SeasonalSuggestionsButton } from "@/components/homeowner/seasonal-suggestions-button";
import { TaskForm } from "@/components/homeowner/task-form";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ property?: string }> };

export default async function HomeownerTasksPage({ searchParams }: Props) {
  const session = await requireHomeownerSession();
  const { property: propertyFilter } = await searchParams;

  const properties = await prisma.homeownerProperty.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true },
  });

  const tasks = await prisma.maintenanceTask.findMany({
    where: {
      userId: session.user.id,
      ...(propertyFilter ? { propertyId: propertyFilter } : {}),
    },
    orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }],
    include: { property: { select: { nickname: true } } },
  });

  const open = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => t.completedAt);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold text-primary">
            Maintenance tasks
          </h2>
          <p className="mt-2 text-muted-foreground">
            Track one-time and recurring work. Seasonal suggestions are
            educational — not a substitute for a licensed inspection.
          </p>
        </div>
        <SeasonalSuggestionsButton propertyId={propertyFilter} />
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Open ({open.length})</h3>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open tasks.</p>
        ) : (
          <ul className="space-y-2">
            {open.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  {task.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {task.property?.nickname ?? "General"}
                    {task.dueDate
                      ? ` · due ${task.dueDate.toLocaleDateString()}`
                      : ""}
                    {task.recurrence ? ` · ${task.recurrence}` : ""}
                  </p>
                  <div className="mt-2 flex gap-1">
                    {task.isSeasonalSuggestion ? (
                      <Badge variant="outline">Seasonal</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <CompleteTaskButton taskId={task.id} />
                  <DeleteTaskButton taskId={task.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Completed</h3>
          <ul className="space-y-2">
            {done.slice(0, 10).map((task) => (
              <li
                key={task.id}
                className="rounded-lg border border-border/70 px-4 py-3 text-sm text-muted-foreground"
              >
                {task.title}
                {task.completedAt
                  ? ` · ${task.completedAt.toLocaleDateString()}`
                  : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="max-w-xl rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Add a task</h3>
        <div className="mt-4">
          <TaskForm properties={properties} />
        </div>
      </section>
    </div>
  );
}
