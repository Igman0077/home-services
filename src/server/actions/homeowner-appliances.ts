"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";
import type { HomeownerActionResult } from "@/server/services/homeowner-access";
import {
  requireHomeownerSession,
  requireOwnedProperty,
} from "@/server/services/homeowner-guard";
import { writeAuditLog } from "@/server/services/audit";

const applianceSchema = z.object({
  propertyId: z.string().cuid(),
  name: z.string().trim().min(2).max(160),
  manufacturer: z.string().trim().max(120).optional().or(z.literal("")),
  model: z.string().trim().max(120).optional().or(z.literal("")),
  serialNumber: z.string().trim().max(120).optional().or(z.literal("")),
  purchaseDate: z.string().optional().or(z.literal("")),
  warrantyExpires: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  warrantyProvider: z.string().trim().max(160).optional().or(z.literal("")),
});

function parseDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createApplianceAction(
  _prev: HomeownerActionResult,
  formData: FormData,
): Promise<HomeownerActionResult> {
  try {
    const parsed = applianceSchema.safeParse({
      propertyId: formData.get("propertyId"),
      name: formData.get("name"),
      manufacturer: formData.get("manufacturer") || "",
      model: formData.get("model") || "",
      serialNumber: formData.get("serialNumber") || "",
      purchaseDate: formData.get("purchaseDate") || "",
      warrantyExpires: formData.get("warrantyExpires") || "",
      notes: formData.get("notes") || "",
      warrantyProvider: formData.get("warrantyProvider") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: "Provide an appliance name and property." };
    }

    const { session } = await requireOwnedProperty(parsed.data.propertyId);
    const appliance = await prisma.appliance.create({
      data: {
        propertyId: parsed.data.propertyId,
        name: parsed.data.name,
        manufacturer: parsed.data.manufacturer || null,
        model: parsed.data.model || null,
        serialNumber: parsed.data.serialNumber || null,
        purchaseDate: parseDate(parsed.data.purchaseDate),
        warrantyExpires: parseDate(parsed.data.warrantyExpires),
        notes: parsed.data.notes || null,
        warranties:
          parsed.data.warrantyProvider || parsed.data.warrantyExpires
            ? {
                create: {
                  provider: parsed.data.warrantyProvider || null,
                  expiresAt: parseDate(parsed.data.warrantyExpires),
                },
              }
            : undefined,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "homeowner.appliance_created",
      entityType: "Appliance",
      entityId: appliance.id,
    });

    revalidatePath("/homeowner/appliances");
    revalidatePath(`/homeowner/properties/${parsed.data.propertyId}`);
    return { ok: true, id: appliance.id };
  } catch {
    return { ok: false, error: "Unable to add appliance." };
  }
}

export async function deleteApplianceAction(
  applianceId: string,
): Promise<HomeownerActionResult> {
  try {
    const session = await requireHomeownerSession();
    const appliance = await prisma.appliance.findFirst({
      where: {
        id: applianceId,
        property: { userId: session.user.id, deletedAt: null },
      },
    });
    if (!appliance) return { ok: false, error: "Appliance not found." };

    await prisma.appliance.delete({ where: { id: applianceId } });
    await writeAuditLog({
      actorId: session.user.id,
      action: "homeowner.appliance_deleted",
      entityType: "Appliance",
      entityId: applianceId,
    });
    revalidatePath("/homeowner/appliances");
    revalidatePath(`/homeowner/properties/${appliance.propertyId}`);
    return { ok: true, id: applianceId };
  } catch {
    return { ok: false, error: "Unable to delete appliance." };
  }
}
