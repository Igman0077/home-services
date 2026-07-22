"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/server/services/audit";
import {
  refreshProfileCompleteness,
  requireBusinessMembership,
} from "@/server/services/business-access";
import type { BusinessActionResult } from "@/server/actions/business-claims";

const profileSchema = z.object({
  businessId: z.string().cuid(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  addressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  stateCode: z.string().trim().max(8).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  yearEstablished: z.coerce.number().int().min(1800).max(2100).optional().or(z.nan()),
  offersEmergency: z.enum(["true", "false"]).optional(),
  offersFreeEstimate: z.enum(["true", "false"]).optional(),
  offersFinancing: z.enum(["true", "false"]).optional(),
  isServiceAreaBusiness: z.enum(["true", "false"]).optional(),
  licenseDetails: z.string().trim().max(2000).optional().or(z.literal("")),
  insuranceDetails: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function updateBusinessProfileAction(
  _prev: BusinessActionResult,
  formData: FormData,
): Promise<BusinessActionResult> {
  try {
    const yearRaw = formData.get("yearEstablished");
    const parsed = profileSchema.safeParse({
      businessId: formData.get("businessId"),
      name: formData.get("name"),
      description: formData.get("description") || "",
      phone: formData.get("phone") || "",
      email: formData.get("email") || "",
      website: formData.get("website") || "",
      addressLine1: formData.get("addressLine1") || "",
      city: formData.get("city") || "",
      stateCode: formData.get("stateCode") || "",
      postalCode: formData.get("postalCode") || "",
      yearEstablished: yearRaw ? Number(yearRaw) : undefined,
      offersEmergency: formData.get("offersEmergency") ?? "false",
      offersFreeEstimate: formData.get("offersFreeEstimate") ?? "false",
      offersFinancing: formData.get("offersFinancing") ?? "false",
      isServiceAreaBusiness: formData.get("isServiceAreaBusiness") ?? "true",
      licenseDetails: formData.get("licenseDetails") || "",
      insuranceDetails: formData.get("insuranceDetails") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: "Please check the profile fields." };
    }

    const { session } = await requireBusinessMembership(parsed.data.businessId);
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: parsed.data.businessId },
    });

    // Claimed owners can edit; pending_review stays until admin publishes
    await prisma.business.update({
      where: { id: business.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email ? parsed.data.email.toLowerCase() : null,
        website: parsed.data.website || null,
        addressLine1: parsed.data.addressLine1 || null,
        city: parsed.data.city || null,
        stateCode: parsed.data.stateCode || null,
        postalCode: parsed.data.postalCode || null,
        yearEstablished: Number.isFinite(parsed.data.yearEstablished)
          ? parsed.data.yearEstablished
          : null,
        offersEmergency: parsed.data.offersEmergency === "true",
        offersFreeEstimate: parsed.data.offersFreeEstimate === "true",
        offersFinancing: parsed.data.offersFinancing === "true",
        isServiceAreaBusiness: parsed.data.isServiceAreaBusiness === "true",
        licenseDetails: parsed.data.licenseDetails || null,
        insuranceDetails: parsed.data.insuranceDetails || null,
      },
    });

    await refreshProfileCompleteness(business.id);

    await writeAuditLog({
      actorId: session.user.id,
      action: "business.profile_updated",
      entityType: "Business",
      entityId: business.id,
    });

    revalidatePath(`/businesses/${business.slug}`);
    revalidatePath("/business/profile");
    return { ok: true, businessId: business.id };
  } catch {
    return { ok: false, error: "Unable to update profile." };
  }
}

export async function updateBusinessServicesAction(
  _prev: BusinessActionResult,
  formData: FormData,
): Promise<BusinessActionResult> {
  try {
    const businessId = String(formData.get("businessId") ?? "");
    if (!businessId) return { ok: false, error: "Missing business." };
    const { session } = await requireBusinessMembership(businessId);
    const serviceIds = formData.getAll("serviceIds").map(String);

    await prisma.businessService.deleteMany({ where: { businessId } });
    if (serviceIds.length > 0) {
      await prisma.businessService.createMany({
        data: serviceIds.map((serviceId) => ({ businessId, serviceId })),
        skipDuplicates: true,
      });
    }

    await refreshProfileCompleteness(businessId);
    await writeAuditLog({
      actorId: session.user.id,
      action: "business.services_updated",
      entityType: "Business",
      entityId: businessId,
      metadata: { serviceIds },
    });

    revalidatePath("/business/profile");
    return { ok: true, businessId };
  } catch {
    return { ok: false, error: "Unable to update services." };
  }
}

export async function updateBusinessAreasAction(
  _prev: BusinessActionResult,
  formData: FormData,
): Promise<BusinessActionResult> {
  try {
    const businessId = String(formData.get("businessId") ?? "");
    if (!businessId) return { ok: false, error: "Missing business." };
    const { session } = await requireBusinessMembership(businessId);
    const locationIds = formData.getAll("locationIds").map(String);

    await prisma.businessServiceArea.deleteMany({ where: { businessId } });
    if (locationIds.length > 0) {
      await prisma.businessServiceArea.createMany({
        data: locationIds.map((locationId) => ({ businessId, locationId })),
        skipDuplicates: true,
      });
    }

    await refreshProfileCompleteness(businessId);
    await writeAuditLog({
      actorId: session.user.id,
      action: "business.areas_updated",
      entityType: "Business",
      entityId: businessId,
      metadata: { locationIds },
    });

    revalidatePath("/business/profile");
    return { ok: true, businessId };
  } catch {
    return { ok: false, error: "Unable to update service areas." };
  }
}

const prefsSchema = z.object({
  businessId: z.string().cuid(),
  acceptsLeads: z.enum(["true", "false"]),
  pauseLeads: z.enum(["true", "false"]),
  dailyCap: z.coerce.number().int().min(0).max(1000).optional().or(z.nan()),
  monthlyCap: z.coerce.number().int().min(0).max(10000).optional().or(z.nan()),
  notifyEmail: z.enum(["true", "false"]),
  notifySms: z.enum(["true", "false"]),
  notifyInApp: z.enum(["true", "false"]),
});

export async function updateLeadPreferencesAction(
  _prev: BusinessActionResult,
  formData: FormData,
): Promise<BusinessActionResult> {
  try {
    const parsed = prefsSchema.safeParse({
      businessId: formData.get("businessId"),
      acceptsLeads: formData.get("acceptsLeads") ?? "false",
      pauseLeads: formData.get("pauseLeads") ?? "false",
      dailyCap: formData.get("dailyCap")
        ? Number(formData.get("dailyCap"))
        : undefined,
      monthlyCap: formData.get("monthlyCap")
        ? Number(formData.get("monthlyCap"))
        : undefined,
      notifyEmail: formData.get("notifyEmail") ?? "false",
      notifySms: formData.get("notifySms") ?? "false",
      notifyInApp: formData.get("notifyInApp") ?? "false",
    });
    if (!parsed.success) {
      return { ok: false, error: "Invalid lead preference values." };
    }

    const { session } = await requireBusinessMembership(parsed.data.businessId);

    await prisma.businessLeadPreference.upsert({
      where: { businessId: parsed.data.businessId },
      create: {
        businessId: parsed.data.businessId,
        acceptsLeads: parsed.data.acceptsLeads === "true",
        pauseLeads: parsed.data.pauseLeads === "true",
        dailyCap: Number.isFinite(parsed.data.dailyCap)
          ? parsed.data.dailyCap
          : null,
        monthlyCap: Number.isFinite(parsed.data.monthlyCap)
          ? parsed.data.monthlyCap
          : null,
        notifyEmail: parsed.data.notifyEmail === "true",
        notifySms: parsed.data.notifySms === "true",
        notifyInApp: parsed.data.notifyInApp === "true",
      },
      update: {
        acceptsLeads: parsed.data.acceptsLeads === "true",
        pauseLeads: parsed.data.pauseLeads === "true",
        dailyCap: Number.isFinite(parsed.data.dailyCap)
          ? parsed.data.dailyCap
          : null,
        monthlyCap: Number.isFinite(parsed.data.monthlyCap)
          ? parsed.data.monthlyCap
          : null,
        notifyEmail: parsed.data.notifyEmail === "true",
        notifySms: parsed.data.notifySms === "true",
        notifyInApp: parsed.data.notifyInApp === "true",
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "business.lead_prefs_updated",
      entityType: "Business",
      entityId: parsed.data.businessId,
    });

    revalidatePath("/business/preferences");
    return { ok: true, businessId: parsed.data.businessId };
  } catch {
    return { ok: false, error: "Unable to update lead preferences." };
  }
}

export async function requestBusinessVerificationAction(
  _prev: BusinessActionResult,
  formData: FormData,
): Promise<BusinessActionResult> {
  try {
    const businessId = String(formData.get("businessId") ?? "");
    const method = String(formData.get("method") ?? "manual");
    const notes = String(formData.get("notes") ?? "").trim();
    if (!businessId || notes.length < 10) {
      return {
        ok: false,
        error: "Provide verification details (at least 10 characters).",
      };
    }

    const { session } = await requireBusinessMembership(businessId);

    await prisma.businessVerification.create({
      data: {
        businessId,
        method,
        status: "PENDING",
        notes,
        evidence: { submittedBy: session.user.id },
      },
    });

    await prisma.business.update({
      where: { id: businessId },
      data: { verificationStatus: "PENDING" },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "business.verification_requested",
      entityType: "Business",
      entityId: businessId,
      metadata: { method },
    });

    revalidatePath("/business/profile");
    revalidatePath("/admin/verifications");
    return { ok: true, businessId };
  } catch {
    return { ok: false, error: "Unable to request verification." };
  }
}

export async function reviewVerificationAction(
  _prev: BusinessActionResult,
  formData: FormData,
): Promise<BusinessActionResult> {
  try {
    const session = await requirePermission("businesses.manage");
    const verificationId = String(formData.get("verificationId") ?? "");
    const decision = String(formData.get("decision") ?? "");
    const notes = String(formData.get("notes") ?? "");

    if (
      !verificationId ||
      !["BUSINESS_VERIFIED", "PLATFORM_VERIFIED", "REJECTED"].includes(decision)
    ) {
      return { ok: false, error: "Invalid verification review." };
    }

    const verification = await prisma.businessVerification.findUnique({
      where: { id: verificationId },
      include: { business: true },
    });
    if (!verification) return { ok: false, error: "Verification not found." };

    await prisma.businessVerification.update({
      where: { id: verificationId },
      data: {
        status: decision as "BUSINESS_VERIFIED" | "PLATFORM_VERIFIED" | "REJECTED",
        notes: notes || verification.notes,
      },
    });

    await prisma.business.update({
      where: { id: verification.businessId },
      data: {
        verificationStatus:
          decision === "REJECTED"
            ? "REJECTED"
            : (decision as "BUSINESS_VERIFIED" | "PLATFORM_VERIFIED"),
        lastVerifiedAt: decision === "REJECTED" ? null : new Date(),
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "business.verification_reviewed",
      entityType: "BusinessVerification",
      entityId: verificationId,
      metadata: { decision },
    });

    revalidatePath("/admin/verifications");
    revalidatePath(`/businesses/${verification.business.slug}`);
    return { ok: true, businessId: verification.businessId };
  } catch {
    return { ok: false, error: "Unable to review verification." };
  }
}

export async function adminPublishBusinessAction(
  businessId: string,
): Promise<BusinessActionResult> {
  try {
    const session = await requirePermission("businesses.manage");
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { publishStatus: "PUBLISHED" },
    });
    await writeAuditLog({
      actorId: session.user.id,
      action: "business.published",
      entityType: "Business",
      entityId: businessId,
    });
    revalidatePath("/businesses");
    revalidatePath(`/businesses/${business.slug}`);
    revalidatePath("/admin/businesses");
    return { ok: true, businessId };
  } catch {
    return { ok: false, error: "Unable to publish business." };
  }
}

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export async function updateBusinessHoursAction(
  _prev: BusinessActionResult,
  formData: FormData,
): Promise<BusinessActionResult> {
  try {
    const businessId = String(formData.get("businessId") ?? "");
    if (!businessId) return { ok: false, error: "Missing business." };
    const { session } = await requireBusinessMembership(businessId);

    await prisma.businessHours.deleteMany({ where: { businessId } });

    const rows = DAYS.map((day) => {
      const isClosed = formData.get(`closed_${day}`) === "true";
      const openTime = String(formData.get(`open_${day}`) ?? "").trim() || null;
      const closeTime =
        String(formData.get(`close_${day}`) ?? "").trim() || null;
      return {
        businessId,
        dayOfWeek: day,
        isClosed,
        openTime: isClosed ? null : openTime,
        closeTime: isClosed ? null : closeTime,
      };
    }).filter((row) => row.isClosed || row.openTime || row.closeTime);

    if (rows.length > 0) {
      await prisma.businessHours.createMany({ data: rows });
    }

    await refreshProfileCompleteness(businessId);
    await writeAuditLog({
      actorId: session.user.id,
      action: "business.hours_updated",
      entityType: "Business",
      entityId: businessId,
    });

    revalidatePath("/business/profile");
    return { ok: true, businessId };
  } catch {
    return { ok: false, error: "Unable to update hours." };
  }
}
