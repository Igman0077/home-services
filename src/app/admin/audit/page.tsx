import { prisma } from "@/lib/db";

export default async function AdminAuditPage() {
  const entries = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { email: true, name: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Audit log
        </h2>
        <p className="mt-2 text-muted-foreground">
          Important administrative and security-relevant actions.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Entity</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted-foreground">
                  <time dateTime={entry.createdAt.toISOString()}>
                    {entry.createdAt.toLocaleString()}
                  </time>
                </td>
                <td className="px-4 py-3 font-medium">{entry.action}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {entry.entityType}
                  {entry.entityId ? ` · ${entry.entityId}` : ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {entry.actor?.email ?? "system"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
