import Link from "next/link";

import { AdminAssignLeadForm } from "@/components/leads/admin-assign-lead-form";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = first(params.status);
  const q = first(params.q);

  const [leads, businesses, services] = await Promise.all([
    prisma.lead.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(q
          ? {
              OR: [
                { contactName: { contains: q, mode: "insensitive" } },
                { contactEmail: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        service: true,
        location: true,
        assignments: {
          include: { business: { select: { name: true, slug: true } } },
        },
        consents: { take: 1, orderBy: { createdAt: "desc" } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    prisma.business.findMany({
      where: { deletedAt: null, publishStatus: "PUBLISHED" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.service.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Leads
        </h2>
        <p className="mt-2 text-muted-foreground">
          Review submissions, routing history, consent records, and manual
          assignments.
        </p>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name or email"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {[
            "NEW",
            "VALIDATING",
            "QUALIFIED",
            "UNQUALIFIED",
            "AVAILABLE",
            "ASSIGNED",
            "ACCEPTED",
            "CONTACTED",
            "WON",
            "LOST",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Filter
        </button>
      </form>

      <div className="space-y-4">
        {leads.map((lead) => (
          <article
            key={lead.id}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  {lead.service.name}
                  {lead.location ? ` · ${lead.location.name}` : ""}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lead.contactName} · {lead.contactEmail} ·{" "}
                  {lead.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">{lead.status}</Badge>
                <Badge variant="secondary">{lead.mode}</Badge>
                {lead.isDuplicateSuspected ? (
                  <Badge variant="warning">Duplicate warning</Badge>
                ) : null}
                {lead.spamScore > 0 ? (
                  <Badge variant="outline">Spam {lead.spamScore}</Badge>
                ) : null}
              </div>
            </div>

            <p className="mt-3 text-sm">{lead.projectDescription}</p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold">Assignments</h4>
                {lead.assignments.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    None yet
                  </p>
                ) : (
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {lead.assignments.map((a) => (
                      <li key={a.id}>
                        {a.business.name} · {a.status}
                        {a.isExclusive ? " · exclusive" : ""}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3">
                  <AdminAssignLeadForm
                    leadId={lead.id}
                    businesses={businesses}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold">Consent</h4>
                {lead.consents[0] ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Version {lead.consents[0].consentVersion} ·{" "}
                    {lead.consents[0].createdAt.toLocaleString()}
                    {lead.consents[0].ipAddress
                      ? ` · IP ${lead.consents[0].ipAddress}`
                      : ""}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No consent record
                  </p>
                )}
                <h4 className="mt-3 text-sm font-semibold">Status history</h4>
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  {lead.statusHistory.map((h) => (
                    <li key={h.id}>
                      {h.toStatus}
                      {h.note ? ` — ${h.note}` : ""} ·{" "}
                      {h.createdAt.toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="text-muted-foreground">No leads match this filter.</p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Services available for context: {services.map((s) => s.name).join(", ")}.{" "}
        <Link href="/request-a-quote" className="text-accent hover:underline">
          Open public quote form
        </Link>
      </p>
    </div>
  );
}
