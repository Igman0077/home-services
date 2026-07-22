"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { SITE_SETTING_KEYS } from "@/lib/site-config";
import { writeAuditLog } from "@/server/services/audit";
import { upsertSiteSetting } from "@/server/services/site-settings";

const settingsSchema = z.object({
  siteName: z.string().trim().min(2).max(120),
  siteTagline: z.string().trim().min(2).max(280),
  supportEmail: z.string().trim().email().max(255),
  reviewsEnabled: z.enum(["true", "false"]),
});

export type ActionResult = {
  ok: boolean;
  error?: string;
};

export async function updateSiteSettingsAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requirePermission("settings.manage");
    const parsed = settingsSchema.safeParse({
      siteName: formData.get("siteName"),
      siteTagline: formData.get("siteTagline"),
      supportEmail: formData.get("supportEmail"),
      reviewsEnabled: formData.get("reviewsEnabled"),
    });

    if (!parsed.success) {
      return { ok: false, error: "Please check the form fields and try again." };
    }

    const reviewsEnabled = parsed.data.reviewsEnabled === "true";

    await Promise.all([
      upsertSiteSetting(
        SITE_SETTING_KEYS.SITE_NAME,
        parsed.data.siteName,
        "Public site name",
        session.user.id,
      ),
      upsertSiteSetting(
        SITE_SETTING_KEYS.SITE_TAGLINE,
        parsed.data.siteTagline,
        "Public site tagline",
        session.user.id,
      ),
      upsertSiteSetting(
        SITE_SETTING_KEYS.SUPPORT_EMAIL,
        parsed.data.supportEmail,
        "Public support email",
        session.user.id,
      ),
      upsertSiteSetting(
        SITE_SETTING_KEYS.REVIEWS_ENABLED,
        reviewsEnabled,
        "Enable public reviews",
        session.user.id,
      ),
      prisma.featureFlag.upsert({
        where: { key: "reviews.enabled" },
        create: {
          key: "reviews.enabled",
          enabled: reviewsEnabled,
          description: "Public review submission and display",
        },
        update: { enabled: reviewsEnabled },
      }),
    ]);

    await writeAuditLog({
      actorId: session.user.id,
      action: "settings.updated",
      entityType: "SiteSetting",
      metadata: {
        siteName: parsed.data.siteName,
        siteTagline: parsed.data.siteTagline,
        supportEmail: parsed.data.supportEmail,
        reviewsEnabled: parsed.data.reviewsEnabled,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to save settings." };
  }
}

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().max(500).optional(),
  isLaunchFocus: z.enum(["true", "false"]).optional(),
});

export async function createServiceAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requirePermission("services.manage");
    const parsed = serviceSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      shortDescription: formData.get("shortDescription") || undefined,
      isLaunchFocus: formData.get("isLaunchFocus") ?? "false",
    });

    if (!parsed.success) {
      return {
        ok: false,
        error: "Name and URL-friendly slug are required.",
      };
    }

    const existing = await prisma.service.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return { ok: false, error: "That service slug is already in use." };
    }

    const service = await prisma.service.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        shortDescription: parsed.data.shortDescription,
        isLaunchFocus: parsed.data.isLaunchFocus === "true",
        status: "DRAFT",
        isActive: true,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "service.created",
      entityType: "Service",
      entityId: service.id,
      metadata: { slug: service.slug },
    });

    revalidatePath("/admin/services");
    revalidatePath("/services");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to create service." };
  }
}

const locationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.enum(["COUNTRY", "STATE", "COUNTY", "CITY", "ZIP", "NEIGHBORHOOD"]),
  parentId: z.string().cuid().optional().or(z.literal("")),
  stateCode: z.string().trim().max(8).optional(),
  shortDescription: z.string().trim().max(500).optional(),
});

export async function createLocationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requirePermission("locations.manage");
    const parsed = locationSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      type: formData.get("type"),
      parentId: formData.get("parentId") || "",
      stateCode: formData.get("stateCode") || undefined,
      shortDescription: formData.get("shortDescription") || undefined,
    });

    if (!parsed.success) {
      return { ok: false, error: "Please provide valid location fields." };
    }

    const parentId = parsed.data.parentId || null;
    let fullSlug = parsed.data.slug;

    if (parentId) {
      const parent = await prisma.location.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return { ok: false, error: "Parent location not found." };
      }
      fullSlug = `${parent.fullSlug}/${parsed.data.slug}`;
    }

    const location = await prisma.location.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        fullSlug,
        type: parsed.data.type,
        parentId,
        stateCode: parsed.data.stateCode,
        shortDescription: parsed.data.shortDescription,
        status: "DRAFT",
        isActive: true,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "location.created",
      entityType: "Location",
      entityId: location.id,
      metadata: { fullSlug: location.fullSlug },
    });

    revalidatePath("/admin/locations");
    revalidatePath("/locations");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to create location." };
  }
}
