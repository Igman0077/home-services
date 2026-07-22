"use server";

import { revalidatePath } from "next/cache";

import { requirePermission, requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/server/services/audit";

export type BusinessLeadActionResult = {
  ok: boolean;
  error?: string;
};

async function requireBusinessAccess(businessId: string) {
  const session = await requireSession();
  const isAdmin = session.user.permissions.includes("leads.manage");
  if (isAdmin) return session;

  const membership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: { businessId, userId: session.user.id },
    },
  });
  if (!membership) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function acceptLeadAssignmentAction(
  assignmentId: string,
): Promise<BusinessLeadActionResult> {
  try {
    const assignment = await prisma.leadAssignment.findUnique({
      where: { id: assignmentId },
      include: { lead: true },
    });
    if (!assignment) return { ok: false, error: "Assignment not found." };

    const session = await requireBusinessAccess(assignment.businessId);

    if (assignment.expiresAt && assignment.expiresAt < new Date()) {
      await prisma.leadAssignment.update({
        where: { id: assignmentId },
        data: { status: "ARCHIVED" },
      });
      return { ok: false, error: "This lead offer has expired." };
    }

    if (assignment.status !== "ASSIGNED") {
      return { ok: false, error: "This lead is no longer available to accept." };
    }

    await prisma.leadAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    await prisma.lead.update({
      where: { id: assignment.leadId },
      data: { status: "ACCEPTED" },
    });

    await prisma.leadStatusHistory.create({
      data: {
        leadId: assignment.leadId,
        fromStatus: assignment.lead.status,
        toStatus: "ACCEPTED",
        note: "Business accepted lead — contact details unlocked",
        actorId: session.user.id,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "lead.accepted",
      entityType: "LeadAssignment",
      entityId: assignmentId,
      metadata: { leadId: assignment.leadId, businessId: assignment.businessId },
    });

    revalidatePath("/business/leads");
    revalidatePath("/admin/leads");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to accept lead." };
  }
}

export async function updateLeadAssignmentStatusAction(
  assignmentId: string,
  status: "CONTACTED" | "APPOINTMENT_SCHEDULED" | "WON" | "LOST",
): Promise<BusinessLeadActionResult> {
  try {
    const assignment = await prisma.leadAssignment.findUnique({
      where: { id: assignmentId },
      include: { lead: true },
    });
    if (!assignment) return { ok: false, error: "Assignment not found." };

    const session = await requireBusinessAccess(assignment.businessId);

    if (
      assignment.status !== "ACCEPTED" &&
      assignment.status !== "CONTACTED" &&
      assignment.status !== "APPOINTMENT_SCHEDULED"
    ) {
      return {
        ok: false,
        error: "Accept the lead before updating its progress status.",
      };
    }

    await prisma.leadAssignment.update({
      where: { id: assignmentId },
      data: {
        status,
        contactedAt:
          status === "CONTACTED" ? new Date() : assignment.contactedAt,
      },
    });

    await prisma.lead.update({
      where: { id: assignment.leadId },
      data: { status },
    });

    await prisma.leadStatusHistory.create({
      data: {
        leadId: assignment.leadId,
        fromStatus: assignment.lead.status,
        toStatus: status,
        note: `Business updated status to ${status}`,
        actorId: session.user.id,
      },
    });

    revalidatePath("/business/leads");
    revalidatePath("/admin/leads");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to update lead status." };
  }
}

export async function declineLeadAssignmentAction(
  assignmentId: string,
): Promise<BusinessLeadActionResult> {
  try {
    const assignment = await prisma.leadAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) return { ok: false, error: "Assignment not found." };
    await requireBusinessAccess(assignment.businessId);

    if (assignment.status !== "ASSIGNED") {
      return { ok: false, error: "Only newly assigned leads can be declined." };
    }

    await prisma.leadAssignment.update({
      where: { id: assignmentId },
      data: { status: "LOST" },
    });

    revalidatePath("/business/leads");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to decline lead." };
  }
}

/** Ensure admin lead manage still works when no business membership */
export async function requireLeadsManage() {
  return requirePermission("leads.manage");
}
