import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";

export default async function AdminOverviewPage() {
  const [roles, flags, recentAudit] = await Promise.all([
    prisma.role.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.featureFlag.findMany({ orderBy: { key: "asc" } }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { email: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Overview
        </h2>
        <p className="mt-2 text-muted-foreground">
          Phase 1 foundation: authentication, roles, services, locations, and
          site settings. Directory and lead features arrive in later phases.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Assigned users per role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{role.name}</span>
                <span className="text-muted-foreground">
                  {role._count.users} users
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature flags</CardTitle>
            <CardDescription>Runtime toggles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {flags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No flags seeded yet.</p>
            ) : (
              flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{flag.key}</span>
                  <span className="text-muted-foreground">
                    {flag.enabled ? "On" : "Off"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent audit activity</CardTitle>
          <CardDescription>Important administrative actions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentAudit.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{entry.action}</span>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={entry.createdAt.toISOString()}
                    >
                      {entry.createdAt.toLocaleString()}
                    </time>
                  </div>
                  <p className="text-muted-foreground">
                    {entry.entityType}
                    {entry.entityId ? ` · ${entry.entityId}` : ""}
                    {entry.actor?.email ? ` · ${entry.actor.email}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
