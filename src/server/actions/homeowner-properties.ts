"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PropertyType } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { HomeownerActionResult } from "@/server/services/homeowner-access";
import {
  requireHomeownerSession,
  requireOwnedProperty,
} from "@/server/services/homeowner-guard";
import { writeAuditLog } from "@/server/services/audit";

const propertyTypes = [
  "SINGLE_FAMILY",
  "MULTI_FAMILY",
  "CONDO",
  "TOWNHOUSE",
  "MOBILE",
  "COMMERCIAL",
  "OTHER",
] as const satisfies readonly PropertyType[];

const propertySchema = z.object({
  nickname: z.string().trim().min(2).max(120),
  addressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  stateCode: z.string().trim().max(8).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  propertyType: z.enum(propertyTypes).default("SINGLE_FAMILY"),
  yearBuilt: z.coerce.number().int().min(1800).max(2100).optional().or(z.nan()),
  squareFootage: z.coerce.number().int().min(1).max(100000).optional().or(z.nan()),
  heatingType: z.string().trim().max(120).optional().or(z.literal("")),
  coolingType: z.string().trim().max(120).optional().or(z.literal("")),
  roofType: z.string().trim().max(120).optional().or(z.literal("")),
  roofAgeYears: z.coerce.number().int().min(0).max(200).optional().or(z.nan()),
  waterSource: z.string().trim().max(120).optional().or(z.literal("")),
  sewerType: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

function optionalNumber(value: number | undefined) {
  return Number.isFinite(value) ? value : null;
}

export async function createPropertyAction(
  _prev: HomeownerActionResult,
  formData: FormData,
): Promise<HomeownerActionResult> {
  try {
    const session = await requireHomeownerSession();
    const parsed = propertySchema.safeParse({
      nickname: formData.get("nickname"),
      addressLine1: formData.get("addressLine1") || "",
      addressLine2: formData.get("addressLine2") || "",
      city: formData.get("city") || "",
      stateCode: formData.get("stateCode") || "NY",
      postalCode: formData.get("postalCode") || "",
      propertyType: formData.get("propertyType") || "SINGLE_FAMILY",
      yearBuilt: formData.get("yearBuilt")
        ? Number(formData.get("yearBuilt"))
        : undefined,
      squareFootage: formData.get("squareFootage")
        ? Number(formData.get("squareFootage"))
        : undefined,
      heatingType: formData.get("heatingType") || "",
      coolingType: formData.get("coolingType") || "",
      roofType: formData.get("roofType") || "",
      roofAgeYears: formData.get("roofAgeYears")
        ? Number(formData.get("roofAgeYears"))
        : undefined,
      waterSource: formData.get("waterSource") || "",
      sewerType: formData.get("sewerType") || "",
      notes: formData.get("notes") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: "Check required fields (nickname at least)." };
    }

    const property = await prisma.homeownerProperty.create({
      data: {
        userId: session.user.id,
        nickname: parsed.data.nickname,
        addressLine1: parsed.data.addressLine1 || null,
        addressLine2: parsed.data.addressLine2 || null,
        city: parsed.data.city || null,
        stateCode: parsed.data.stateCode || null,
        postalCode: parsed.data.postalCode || null,
        propertyType: parsed.data.propertyType,
        yearBuilt: optionalNumber(parsed.data.yearBuilt),
        squareFootage: optionalNumber(parsed.data.squareFootage),
        heatingType: parsed.data.heatingType || null,
        coolingType: parsed.data.coolingType || null,
        roofType: parsed.data.roofType || null,
        roofAgeYears: optionalNumber(parsed.data.roofAgeYears),
        waterSource: parsed.data.waterSource || null,
        sewerType: parsed.data.sewerType || null,
        notes: parsed.data.notes || null,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "homeowner.property_created",
      entityType: "HomeownerProperty",
      entityId: property.id,
    });

    revalidatePath("/homeowner/dashboard");
    revalidatePath("/homeowner/properties");
    return { ok: true, id: property.id };
  } catch {
    return { ok: false, error: "Unable to create property." };
  }
}

export async function updatePropertyAction(
  _prev: HomeownerActionResult,
  formData: FormData,
): Promise<HomeownerActionResult> {
  try {
    const propertyId = String(formData.get("propertyId") ?? "");
    if (!propertyId) return { ok: false, error: "Missing property." };
    const { session } = await requireOwnedProperty(propertyId);

    const parsed = propertySchema.safeParse({
      nickname: formData.get("nickname"),
      addressLine1: formData.get("addressLine1") || "",
      addressLine2: formData.get("addressLine2") || "",
      city: formData.get("city") || "",
      stateCode: formData.get("stateCode") || "",
      postalCode: formData.get("postalCode") || "",
      propertyType: formData.get("propertyType") || "SINGLE_FAMILY",
      yearBuilt: formData.get("yearBuilt")
        ? Number(formData.get("yearBuilt"))
        : undefined,
      squareFootage: formData.get("squareFootage")
        ? Number(formData.get("squareFootage"))
        : undefined,
      heatingType: formData.get("heatingType") || "",
      coolingType: formData.get("coolingType") || "",
      roofType: formData.get("roofType") || "",
      roofAgeYears: formData.get("roofAgeYears")
        ? Number(formData.get("roofAgeYears"))
        : undefined,
      waterSource: formData.get("waterSource") || "",
      sewerType: formData.get("sewerType") || "",
      notes: formData.get("notes") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: "Please check the property fields." };
    }

    await prisma.homeownerProperty.update({
      where: { id: propertyId },
      data: {
        nickname: parsed.data.nickname,
        addressLine1: parsed.data.addressLine1 || null,
        addressLine2: parsed.data.addressLine2 || null,
        city: parsed.data.city || null,
        stateCode: parsed.data.stateCode || null,
        postalCode: parsed.data.postalCode || null,
        propertyType: parsed.data.propertyType,
        yearBuilt: optionalNumber(parsed.data.yearBuilt),
        squareFootage: optionalNumber(parsed.data.squareFootage),
        heatingType: parsed.data.heatingType || null,
        coolingType: parsed.data.coolingType || null,
        roofType: parsed.data.roofType || null,
        roofAgeYears: optionalNumber(parsed.data.roofAgeYears),
        waterSource: parsed.data.waterSource || null,
        sewerType: parsed.data.sewerType || null,
        notes: parsed.data.notes || null,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "homeowner.property_updated",
      entityType: "HomeownerProperty",
      entityId: propertyId,
    });

    revalidatePath("/homeowner/properties");
    revalidatePath(`/homeowner/properties/${propertyId}`);
    return { ok: true, id: propertyId };
  } catch {
    return { ok: false, error: "Unable to update property." };
  }
}

export async function deletePropertyAction(
  propertyId: string,
): Promise<HomeownerActionResult> {
  try {
    const { session } = await requireOwnedProperty(propertyId);
    await prisma.homeownerProperty.update({
      where: { id: propertyId },
      data: { deletedAt: new Date() },
    });
    await writeAuditLog({
      actorId: session.user.id,
      action: "homeowner.property_deleted",
      entityType: "HomeownerProperty",
      entityId: propertyId,
    });
    revalidatePath("/homeowner/dashboard");
    revalidatePath("/homeowner/properties");
    return { ok: true, id: propertyId };
  } catch {
    return { ok: false, error: "Unable to delete property." };
  }
}
