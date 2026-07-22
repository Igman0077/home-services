"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_SETTING_KEYS } from "@/lib/site-config";
import { quoteRequestSchema } from "@/lib/validations/quote";
import { writeAuditLog } from "@/server/services/audit";
import { routeLead } from "@/server/services/lead-routing";
import { evaluateLeadSpam } from "@/server/services/lead-spam";
import { getSiteSetting } from "@/server/services/site-settings";

export type QuoteActionResult = {
  ok: boolean;
  error?: string;
  leadId?: string;
  warnings?: string[];
};

export async function submitQuoteRequestAction(
  _prev: QuoteActionResult,
  formData: FormData,
): Promise<QuoteActionResult> {
  const raw = {
    serviceId: String(formData.get("serviceId") ?? ""),
    locationId: String(formData.get("locationId") ?? ""),
    zipCode: String(formData.get("zipCode") ?? ""),
    projectDescription: String(formData.get("projectDescription") ?? ""),
    desiredTimeline: String(formData.get("desiredTimeline") ?? ""),
    propertyType: String(formData.get("propertyType") ?? "") || undefined,
    contactName: String(formData.get("contactName") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? ""),
    preferredContact: String(formData.get("preferredContact") ?? "EITHER"),
    consent: formData.get("consent") === "on" || formData.get("consent") === "true",
    companyWebsite: String(formData.get("companyWebsite") ?? ""),
    businessSlug: String(formData.get("businessSlug") ?? "") || undefined,
    formStartedAt: String(formData.get("formStartedAt") ?? "") || undefined,
  };

  const parsed = quoteRequestSchema.safeParse({
    ...raw,
    consent: raw.consent ? true : false,
    locationId: raw.locationId || "",
    zipCode: raw.zipCode || "",
    desiredTimeline: raw.desiredTimeline || "",
    contactPhone: raw.contactPhone || "",
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check the form.";
    return { ok: false, error: message };
  }

  const data = parsed.data;
  if (!data.locationId && !data.zipCode) {
    return {
      ok: false,
      error: "Provide a location or ZIP code so we can route your request.",
    };
  }

  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, isActive: true },
  });
  if (!service) {
    return { ok: false, error: "Selected service is not available." };
  }

  const locationId = data.locationId || null;
  if (locationId) {
    const location = await prisma.location.findFirst({
      where: { id: locationId, isActive: true },
    });
    if (!location) {
      return { ok: false, error: "Selected location is not available." };
    }
  }

  const headerStore = await headers();
  const ipAddress =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent");

  const spam = await evaluateLeadSpam({
    email: data.contactEmail,
    phone: data.contactPhone,
    serviceId: data.serviceId,
    ipAddress,
    honeypot: data.companyWebsite,
    formStartedAt: data.formStartedAt,
    userAgent,
  });

  if (spam.blocked) {
    await writeAuditLog({
      action: "lead.blocked_spam",
      entityType: "Lead",
      metadata: { reasons: spam.reasons, email: data.contactEmail },
      ipAddress,
      userAgent,
    });
    return {
      ok: false,
      error:
        "We could not accept this request right now. Please wait and try again, or contact support.",
    };
  }

  const session = await auth();
  const consentVersion = await getSiteSetting(
    SITE_SETTING_KEYS.LEAD_CONSENT_VERSION,
    "2026-07-01",
  );
  const consentText = await getSiteSetting(
    SITE_SETTING_KEYS.LEAD_CONSENT_TEXT,
    "DRAFT: By submitting this form you consent to be contacted about your project by matching service professionals. Attorney review required.",
  );

  const lead = await prisma.lead.create({
    data: {
      serviceId: data.serviceId,
      locationId,
      submitterId: session?.user?.id,
      status: "VALIDATING",
      mode: "SHARED",
      projectDescription: data.projectDescription,
      desiredTimeline: data.desiredTimeline || null,
      propertyType: data.propertyType,
      contactName: data.contactName,
      contactEmail: data.contactEmail.toLowerCase(),
      contactPhone: data.contactPhone || null,
      preferredContact: data.preferredContact,
      zipCode: data.zipCode || null,
      spamScore: spam.spamScore,
      isDuplicateSuspected: spam.isDuplicateSuspected,
      isSampleData: false,
      statusHistory: {
        create: {
          toStatus: "VALIDATING",
          note: spam.reasons.length
            ? `Spam signals: ${spam.reasons.join("; ")}`
            : "Accepted for validation",
        },
      },
      consents: {
        create: {
          userId: session?.user?.id,
          consentVersion,
          consentText,
          formKey: "request-a-quote",
          ipAddress,
          userAgent,
        },
      },
    },
  });

  // Qualify unless duplicate-heavy
  const nextStatus =
    spam.isDuplicateSuspected && spam.spamScore >= 50
      ? "UNQUALIFIED"
      : "QUALIFIED";

  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: nextStatus },
  });
  await prisma.leadStatusHistory.create({
    data: {
      leadId: lead.id,
      fromStatus: "VALIDATING",
      toStatus: nextStatus,
      note:
        nextStatus === "QUALIFIED"
          ? "Passed validation"
          : "Flagged as likely duplicate — held for admin review",
    },
  });

  const warnings = [...spam.reasons];

  if (nextStatus === "QUALIFIED") {
    const routing = await routeLead({
      leadId: lead.id,
      serviceId: data.serviceId,
      locationId,
      actorId: session?.user?.id,
    });
    if (routing.businessIds.length === 0) {
      warnings.push(
        "No matching businesses were available immediately. An administrator can assign your request manually.",
      );
    }
  }

  await writeAuditLog({
    actorId: session?.user?.id,
    action: "lead.submitted",
    entityType: "Lead",
    entityId: lead.id,
    metadata: { serviceId: data.serviceId, locationId, status: nextStatus },
    ipAddress,
    userAgent,
  });

  return {
    ok: true,
    leadId: lead.id,
    warnings: warnings.length ? warnings : undefined,
  };
}

const assignSchema = z.object({
  leadId: z.string().cuid(),
  businessId: z.string().cuid(),
});

export async function adminAssignLeadAction(
  _prev: QuoteActionResult,
  formData: FormData,
): Promise<QuoteActionResult> {
  const { requirePermission } = await import("@/lib/auth-guards");
  try {
    const session = await requirePermission("leads.assign");
    const parsed = assignSchema.safeParse({
      leadId: formData.get("leadId"),
      businessId: formData.get("businessId"),
    });
    if (!parsed.success) {
      return { ok: false, error: "Invalid lead or business." };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: parsed.data.leadId },
    });
    const business = await prisma.business.findFirst({
      where: {
        id: parsed.data.businessId,
        deletedAt: null,
        publishStatus: "PUBLISHED",
      },
    });
    if (!lead || !business) {
      return { ok: false, error: "Lead or business not found." };
    }

    await prisma.leadAssignment.create({
      data: {
        leadId: lead.id,
        businessId: business.id,
        status: "ASSIGNED",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isExclusive: false,
        routingNotes: "Manual admin assignment",
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "ASSIGNED", mode: "MANUAL" },
    });
    await prisma.leadStatusHistory.create({
      data: {
        leadId: lead.id,
        fromStatus: lead.status,
        toStatus: "ASSIGNED",
        note: `Manually assigned to ${business.name}`,
        actorId: session.user.id,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "lead.manual_assigned",
      entityType: "Lead",
      entityId: lead.id,
      metadata: { businessId: business.id },
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/leads");
    revalidatePath("/business/leads");

    return { ok: true, leadId: lead.id };
  } catch {
    return { ok: false, error: "Unable to assign lead." };
  }
}

export async function adminMarkLeadUnqualifiedAction(
  leadId: string,
): Promise<QuoteActionResult> {
  const { requirePermission } = await import("@/lib/auth-guards");
  try {
    const session = await requirePermission("leads.manage");
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { ok: false, error: "Lead not found." };

    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "UNQUALIFIED" },
    });
    await prisma.leadStatusHistory.create({
      data: {
        leadId,
        fromStatus: lead.status,
        toStatus: "UNQUALIFIED",
        note: "Marked unqualified by administrator",
        actorId: session.user.id,
      },
    });
    return { ok: true, leadId };
  } catch {
    return { ok: false, error: "Unable to update lead." };
  }
}
