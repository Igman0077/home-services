import { BusinessLeadActions } from "@/components/leads/business-lead-actions";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth-guards";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  return `${user.slice(0, 1)}***@${domain}`;
}

function maskPhone(phone: string | null): string {
  if (!phone) return "Hidden until accepted";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "Hidden until accepted";
  return `(***) ***-${digits.slice(-4)}`;
}

export default async function BusinessLeadsPage() {
  const session = await requireSession();
  const isAdmin = hasPermission(session.user.permissions, "leads.manage");

  const memberships = await prisma.businessMember.findMany({
    where: { userId: session.user.id },
    select: { businessId: true },
  });
  const businessIds = memberships.map((m) => m.businessId);

  const assignments = await prisma.leadAssignment.findMany({
    where: isAdmin
      ? {}
      : { businessId: { in: businessIds.length ? businessIds : ["__none__"] } },
    orderBy: { assignedAt: "desc" },
    take: 50,
    include: {
      business: { select: { name: true, slug: true } },
      lead: {
        include: {
          service: true,
          location: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Leads
        </h2>
        <p className="mt-2 text-muted-foreground">
          Accept a lead to unlock the homeowner’s full contact details. Declining
          or letting an offer expire returns capacity for other businesses when
          reassignment is configured.
        </p>
      </div>

      {assignments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-6 text-muted-foreground">
          No leads assigned yet. Submit a quote request from the public form to
          test routing with seeded sample businesses.
        </p>
      ) : (
        <ul className="space-y-4">
          {assignments.map((assignment) => {
            const unlocked =
              assignment.status === "ACCEPTED" ||
              assignment.status === "CONTACTED" ||
              assignment.status === "APPOINTMENT_SCHEDULED" ||
              assignment.status === "WON" ||
              assignment.status === "LOST";

            return (
              <li
                key={assignment.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {assignment.lead.service.name}
                      {assignment.lead.location
                        ? ` · ${assignment.lead.location.name}`
                        : ""}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {assignment.business.name} · assigned{" "}
                      {assignment.assignedAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{assignment.status}</Badge>
                    {assignment.isExclusive ? (
                      <Badge variant="secondary">Exclusive</Badge>
                    ) : (
                      <Badge variant="secondary">Shared</Badge>
                    )}
                    {assignment.lead.isDuplicateSuspected ? (
                      <Badge variant="warning">Possible duplicate</Badge>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed">
                  {assignment.lead.projectDescription}
                </p>

                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-medium">Contact name: </span>
                    {unlocked
                      ? assignment.lead.contactName
                      : `${assignment.lead.contactName.slice(0, 1)}***`}
                  </p>
                  <p>
                    <span className="font-medium">Email: </span>
                    {unlocked
                      ? assignment.lead.contactEmail
                      : maskEmail(assignment.lead.contactEmail)}
                  </p>
                  <p>
                    <span className="font-medium">Phone: </span>
                    {unlocked
                      ? assignment.lead.contactPhone ?? "Not provided"
                      : maskPhone(assignment.lead.contactPhone)}
                  </p>
                  <p>
                    <span className="font-medium">Preferred: </span>
                    {assignment.lead.preferredContact}
                  </p>
                </div>

                {!unlocked ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Full contact details are hidden until you accept this lead.
                    {assignment.expiresAt
                      ? ` Offer expires ${assignment.expiresAt.toLocaleString()}.`
                      : ""}
                  </p>
                ) : null}

                <div className="mt-4">
                  <BusinessLeadActions
                    assignmentId={assignment.id}
                    status={assignment.status}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
