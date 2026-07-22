"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission, requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/server/services/audit";
import { refreshProfileCompleteness } from "@/server/services/business-access";

export type BusinessActionResult = {
  ok: boolean;
  error?: string;
  businessId?: string;
  claimId?: string;
};

const claimSchema = z.object({
  businessId: z.string().cuid(),
  verificationMethod: z.enum([
    "business_email",
    "phone",
    "documentation",
    "manual",
  ]),
  evidenceNotes: z.string().trim().min(10).max(4000),
});

export async function submitBusinessClaimAction(
  _prev: BusinessActionResult,
  formData: FormData,
): Promise<BusinessActionResult> {
  try {
    const session = await requireSession();
    const parsed = claimSchema.safeParse({
      businessId: formData.get("businessId"),
      verificationMethod: formData.get("verificationMethod"),
      evidenceNotes: formData.get("evidenceNotes"),
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: "Provide a verification method and at least 10 characters of evidence.",
      };
    }

    const business = await prisma.business.findFirst({
      where: {
        id: parsed.data.businessId,
        deletedAt: null,
      },
    });
    if (!business) return { ok: false, error: "Business not found." };

    if (business.claimStatus === "APPROVED") {
      return { ok: false, error: "This business is already claimed." };
    }

    const existingPending = await prisma.businessClaim.findFirst({
      where: {
        businessId: business.id,
        status: { in: ["PENDING", "MORE_INFO_REQUIRED"] },
      },
    });
    if (
      existingPending &&
      existingPending.userId !== session.user.id
    ) {
      return {
        ok: false,
        error: "A claim is already pending review for this business.",
      };
    }
    if (existingPending?.userId === session.user.id && existingPending.status === "PENDING") {
      return {
        ok: false,
        error: "Your claim is already awaiting review.",
      };
    }

    // Ensure BUSINESS_OWNER role exists on user
    const role = await prisma.role.findUnique({
      where: { name: "BUSINESS_OWNER" },
    });
    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: { userId: session.user.id, roleId: role.id },
        },
        create: { userId: session.user.id, roleId: role.id },
        update: {},
      });
    }

    const claim =
      existingPending?.userId === session.user.id
        ? await prisma.businessClaim.update({
            where: { id: existingPending.id },
            data: {
              status: "PENDING",
              verificationMethod: parsed.data.verificationMethod,
              evidenceNotes: parsed.data.evidenceNotes,
            },
          })
        : await prisma.businessClaim.create({
            data: {
              businessId: business.id,
              userId: session.user.id,
              status: "PENDING",
              verificationMethod: parsed.data.verificationMethod,
              evidenceNotes: parsed.data.evidenceNotes,
            },
          });

    await prisma.business.update({
      where: { id: business.id },
      data: { claimStatus: "PENDING" },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "business.claim_submitted",
      entityType: "BusinessClaim",
      entityId: claim.id,
      metadata: {
        businessId: business.id,
        method: parsed.data.verificationMethod,
      },
    });

    revalidatePath(`/businesses/${business.slug}`);
    revalidatePath("/admin/claims");
    return { ok: true, claimId: claim.id, businessId: business.id };
  } catch {
    return { ok: false, error: "Unable to submit claim. Sign in and try again." };
  }
}

const reviewClaimSchema = z.object({
  claimId: z.string().cuid(),
  decision: z.enum(["APPROVED", "REJECTED", "MORE_INFO_REQUIRED"]),
  adminNotes: z.string().trim().max(4000).optional(),
});

export async function reviewBusinessClaimAction(
  _prev: BusinessActionResult,
  formData: FormData,
): Promise<BusinessActionResult> {
  try {
    const session = await requirePermission("businesses.manage");
    const parsed = reviewClaimSchema.safeParse({
      claimId: formData.get("claimId"),
      decision: formData.get("decision"),
      adminNotes: String(formData.get("adminNotes") ?? "") || undefined,
    });
    if (!parsed.success) {
      return { ok: false, error: "Invalid claim review." };
    }

    const claim = await prisma.businessClaim.findUnique({
      where: { id: parsed.data.claimId },
      include: { business: true },
    });
    if (!claim) return { ok: false, error: "Claim not found." };

    await prisma.businessClaim.update({
      where: { id: claim.id },
      data: {
        status: parsed.data.decision,
        adminNotes: parsed.data.adminNotes,
        reviewedAt: new Date(),
        reviewedById: session.user.id,
      },
    });

    if (parsed.data.decision === "APPROVED") {
      await prisma.business.update({
        where: { id: claim.businessId },
        data: { claimStatus: "APPROVED" },
      });
      await prisma.businessMember.upsert({
        where: {
          businessId_userId: {
            businessId: claim.businessId,
            userId: claim.userId,
          },
        },
        create: {
          businessId: claim.businessId,
          userId: claim.userId,
          title: "Owner",
          isPrimary: true,
        },
        update: { isPrimary: true },
      });
      const role = await prisma.role.findUnique({
        where: { name: "BUSINESS_OWNER" },
      });
      if (role) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: { userId: claim.userId, roleId: role.id },
          },
          create: { userId: claim.userId, roleId: role.id },
          update: {},
        });
      }
    } else {
      await prisma.business.update({
        where: { id: claim.businessId },
        data: {
          claimStatus:
            parsed.data.decision === "REJECTED" ? "REJECTED" : "PENDING",
        },
      });
    }

    await writeAuditLog({
      actorId: session.user.id,
      action: "business.claim_reviewed",
      entityType: "BusinessClaim",
      entityId: claim.id,
      metadata: {
        decision: parsed.data.decision,
        businessId: claim.businessId,
      },
    });

    revalidatePath("/admin/claims");
    revalidatePath("/business/dashboard");
    revalidatePath(`/businesses/${claim.business.slug}`);
    return { ok: true, claimId: claim.id, businessId: claim.businessId };
  } catch {
    return { ok: false, error: "Unable to review claim." };
  }
}

const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(40).max(5000),
  phone: z.string().trim().min(10).max(30),
  email: z.string().trim().email().max(255),
  website: z.string().trim().url().optional().or(z.literal("")),
  city: z.string().trim().min(2).max(120),
  stateCode: z.string().trim().min(2).max(8).default("NY"),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  isServiceAreaBusiness: z.enum(["true", "false"]).default("true"),
});

export async function createBusinessProfileAction(
  _prev: BusinessActionResult,
  formData: FormData,
): Promise<BusinessActionResult> {
  try {
    const session = await requireSession();
    const parsed = createBusinessSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      website: formData.get("website") || "",
      city: formData.get("city"),
      stateCode: formData.get("stateCode") || "NY",
      postalCode: formData.get("postalCode") || "",
      isServiceAreaBusiness: formData.get("isServiceAreaBusiness") ?? "true",
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: "Check required fields (name, description, phone, email, city).",
      };
    }

    let slug = slugify(parsed.data.name);
    const existing = await prisma.business.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const freePlan = await prisma.subscriptionPlan.findUnique({
      where: { slug: "free" },
    });

    const business = await prisma.business.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        phone: parsed.data.phone,
        email: parsed.data.email.toLowerCase(),
        website: parsed.data.website || null,
        city: parsed.data.city,
        stateCode: parsed.data.stateCode,
        postalCode: parsed.data.postalCode || null,
        isServiceAreaBusiness: parsed.data.isServiceAreaBusiness === "true",
        claimStatus: "APPROVED",
        verificationStatus: "UNVERIFIED",
        publishStatus: "PENDING_REVIEW",
        isSampleData: false,
        subscriptionPlanId: freePlan?.id,
        members: {
          create: {
            userId: session.user.id,
            title: "Owner",
            isPrimary: true,
          },
        },
        leadPreferences: {
          create: {
            acceptsLeads: true,
            pauseLeads: false,
            notifyEmail: true,
            notifyInApp: true,
          },
        },
      },
    });

    const role = await prisma.role.findUnique({
      where: { name: "BUSINESS_OWNER" },
    });
    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: { userId: session.user.id, roleId: role.id },
        },
        create: { userId: session.user.id, roleId: role.id },
        update: {},
      });
    }

    await refreshProfileCompleteness(business.id);

    await writeAuditLog({
      actorId: session.user.id,
      action: "business.created",
      entityType: "Business",
      entityId: business.id,
      metadata: { slug: business.slug },
    });

    revalidatePath("/business/dashboard");
    revalidatePath("/admin/businesses");
    return { ok: true, businessId: business.id };
  } catch {
    return { ok: false, error: "Unable to create business profile." };
  }
}
