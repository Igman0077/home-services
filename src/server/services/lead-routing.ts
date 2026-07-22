import type { LeadMode, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/integrations/email";
import { writeAuditLog } from "@/server/services/audit";

export type RoutingResult = {
  mode: LeadMode;
  assignmentIds: string[];
  businessIds: string[];
  notes: string[];
};

type RouteLeadInput = {
  leadId: string;
  serviceId: string;
  locationId?: string | null;
  actorId?: string | null;
};

/**
 * Matches businesses by service + service area, respects pause/caps/plan eligibility,
 * then assigns exclusive or shared leads. Contact details stay masked until accept.
 */
export async function routeLead(input: RouteLeadInput): Promise<RoutingResult> {
  const notes: string[] = [];

  const rules = await prisma.leadRoutingRule.findMany({
    where: {
      isActive: true,
      OR: [
        { serviceId: input.serviceId },
        { serviceId: null },
      ],
    },
    orderBy: { priority: "asc" },
  });

  const matchingRule =
    rules.find(
      (r) =>
        (!r.serviceId || r.serviceId === input.serviceId) &&
        (!r.locationId || r.locationId === input.locationId),
    ) ??
    rules.find((r) => !r.serviceId && !r.locationId) ??
    null;

  const mode: LeadMode = matchingRule?.mode ?? "SHARED";
  const maxRecipients = matchingRule?.maxRecipients ?? (mode === "EXCLUSIVE" ? 1 : 3);
  const acceptanceMins = matchingRule?.acceptanceMins ?? 60;

  const candidates = await prisma.business.findMany({
    where: {
      deletedAt: null,
      publishStatus: "PUBLISHED",
      services: { some: { serviceId: input.serviceId } },
      ...(input.locationId
        ? { serviceAreas: { some: { locationId: input.locationId } } }
        : {}),
      leadPreferences: {
        is: {
          acceptsLeads: true,
          pauseLeads: false,
        },
      },
    },
    include: {
      leadPreferences: true,
      subscriptionPlan: true,
      leadAssignments: {
        where: {
          assignedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      },
    },
    orderBy: [
      { isFeatured: "desc" },
      { profileCompleteness: "desc" },
      { name: "asc" },
    ],
    take: 50,
  });

  const eligible = candidates.filter((business) => {
    const prefs = business.leadPreferences;
    if (!prefs) return false;

    const entitlements = (business.subscriptionPlan?.entitlements ??
      {}) as Record<string, unknown>;
    const leadEligible =
      entitlements.leadEligible === true ||
      business.subscriptionPlan?.slug === "standard" ||
      business.subscriptionPlan?.slug === "premium" ||
      business.subscriptionPlan?.slug === "exclusive-territory" ||
      // Allow sample businesses in development to receive leads for testing
      business.isSampleData;

    if (!leadEligible) {
      notes.push(`Skipped ${business.slug}: plan not lead-eligible`);
      return false;
    }

    if (mode === "EXCLUSIVE" && !prefs.exclusiveEligible && !business.isSampleData) {
      notes.push(`Skipped ${business.slug}: not exclusive-eligible`);
      return false;
    }

    if (prefs.dailyCap != null && business.leadAssignments.length >= prefs.dailyCap) {
      notes.push(`Skipped ${business.slug}: daily cap reached`);
      return false;
    }

    return true;
  });

  if (eligible.length === 0) {
    notes.push("No eligible businesses matched service/location rules");
    await prisma.lead.update({
      where: { id: input.leadId },
      data: { status: "AVAILABLE", mode },
    });
    await prisma.leadStatusHistory.create({
      data: {
        leadId: input.leadId,
        fromStatus: "QUALIFIED",
        toStatus: "AVAILABLE",
        note: "Queued — no eligible recipients at routing time",
        actorId: input.actorId ?? undefined,
      },
    });
    return { mode, assignmentIds: [], businessIds: [], notes };
  }

  const selected = eligible.slice(0, Math.max(1, maxRecipients));
  const expiresAt = new Date(Date.now() + acceptanceMins * 60 * 1000);

  const pricing = await prisma.leadPricingRule.findFirst({
    where: {
      isActive: true,
      mode,
      OR: [
        { serviceId: input.serviceId, locationId: input.locationId ?? undefined },
        { serviceId: input.serviceId, locationId: null },
        { serviceId: null, locationId: null },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });

  const assignmentIds: string[] = [];
  const businessIds: string[] = [];
  const email = getEmailProvider();

  for (const business of selected) {
    const assignment = await prisma.leadAssignment.create({
      data: {
        leadId: input.leadId,
        businessId: business.id,
        status: "ASSIGNED",
        expiresAt,
        isExclusive: mode === "EXCLUSIVE",
        priceCents: pricing?.priceCents,
        routingNotes: matchingRule
          ? `Rule: ${matchingRule.name}`
          : "Default shared routing",
      },
    });
    assignmentIds.push(assignment.id);
    businessIds.push(business.id);

    if (business.email || business.leadPreferences?.notifyEmail) {
      const notifyTo = business.email;
      if (notifyTo) {
        await email.send({
          to: notifyTo,
          subject: "New lead available — accept to view contact details",
          text: `A new lead was assigned to ${business.name}. Sign in to your business dashboard to review project details. Contact information is revealed after you accept.`,
          html: `<p>A new lead was assigned to <strong>${business.name}</strong>.</p><p>Sign in to your business dashboard to review project details. Contact information is revealed after you accept.</p>`,
        });
      }
    }

    if (business.leadPreferences?.notifyInApp) {
      const members = await prisma.businessMember.findMany({
        where: { businessId: business.id },
      });
      for (const member of members) {
        await prisma.notification.create({
          data: {
            userId: member.userId,
            channel: "IN_APP",
            title: "New lead assigned",
            body: "A new lead is waiting. Accept it to view homeowner contact details.",
            link: "/business/leads",
          },
        });
      }
    }
  }

  await prisma.lead.update({
    where: { id: input.leadId },
    data: { status: "ASSIGNED", mode },
  });

  await prisma.leadStatusHistory.create({
    data: {
      leadId: input.leadId,
      fromStatus: "QUALIFIED",
      toStatus: "ASSIGNED",
      note: `Assigned to ${selected.length} business(es) via ${mode}`,
      actorId: input.actorId ?? undefined,
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "lead.routed",
    entityType: "Lead",
    entityId: input.leadId,
    metadata: {
      mode,
      businessIds,
      ruleId: matchingRule?.id ?? null,
      notes,
    },
  });

  notes.push(`Assigned to: ${selected.map((b) => b.slug).join(", ")}`);
  return { mode, assignmentIds, businessIds, notes };
}

export async function findMatchingBusinessCount(
  serviceId: string,
  locationId?: string | null,
): Promise<number> {
  return prisma.business.count({
    where: {
      deletedAt: null,
      publishStatus: "PUBLISHED",
      services: { some: { serviceId } },
      ...(locationId
        ? { serviceAreas: { some: { locationId } } }
        : {}),
    },
  });
}

export type LeadListFilters = {
  status?: string;
  serviceId?: string;
  q?: string;
};

export function buildAdminLeadWhere(
  filters: LeadListFilters,
): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  if (filters.status) {
    where.status = filters.status as Prisma.EnumLeadStatusFilter["equals"];
  }
  if (filters.serviceId) where.serviceId = filters.serviceId;
  if (filters.q?.trim()) {
    where.OR = [
      { contactName: { contains: filters.q.trim(), mode: "insensitive" } },
      { contactEmail: { contains: filters.q.trim(), mode: "insensitive" } },
      { projectDescription: { contains: filters.q.trim(), mode: "insensitive" } },
    ];
  }
  return where;
}
