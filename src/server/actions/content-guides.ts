"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PublishStatus } from "@prisma/client";

import { canTransitionGuideStatus, parseGuideBlocks } from "@/lib/content";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/server/services/audit";

export type ContentActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

const guideSchema = z.object({
  title: z.string().trim().min(5).max(200),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  excerpt: z.string().trim().max(1000).optional().or(z.literal("")),
  body: z.string().trim().min(40).max(50000),
  sectionsJson: z.string().optional().or(z.literal("")),
  seoTitle: z.string().trim().max(200).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  authorName: z.string().trim().max(120).optional().or(z.literal("")),
});

function parseSections(raw?: string) {
  if (!raw?.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const blocks = parseGuideBlocks({ body: "", sections: parsed });
    return blocks.sections;
  } catch {
    return undefined;
  }
}

async function uniqueGuideSlug(base: string, excludeId?: string) {
  let slug = slugify(base) || `guide-${Date.now().toString(36)}`;
  let n = 0;
  while (true) {
    const existing = await prisma.guide.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
}

export async function createGuideAction(
  _prev: ContentActionResult,
  formData: FormData,
): Promise<ContentActionResult> {
  try {
    const session = await requirePermission("content.manage");
    const parsed = guideSchema.safeParse({
      title: formData.get("title"),
      slug: formData.get("slug") || "",
      excerpt: formData.get("excerpt") || "",
      body: formData.get("body"),
      sectionsJson: formData.get("sectionsJson") || "",
      seoTitle: formData.get("seoTitle") || "",
      seoDescription: formData.get("seoDescription") || "",
      authorName: formData.get("authorName") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: "Provide a title and at least 40 characters of body." };
    }

    const slug = await uniqueGuideSlug(parsed.data.slug || parsed.data.title);
    const contentBlocks = {
      body: parsed.data.body,
      sections: parseSections(parsed.data.sectionsJson),
    };

    const guide = await prisma.guide.create({
      data: {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt || null,
        contentBlocks,
        status: "DRAFT",
        seoTitle: parsed.data.seoTitle || null,
        seoDescription: parsed.data.seoDescription || null,
        authorName: parsed.data.authorName || session.user.name || null,
        indexDirective: "NOINDEX",
      },
    });

    await prisma.contentRevision.create({
      data: {
        entityType: "Guide",
        entityId: guide.id,
        guideId: guide.id,
        authorId: session.user.id,
        snapshot: { ...guide, contentBlocks },
        notes: "Initial draft created",
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "content.guide_created",
      entityType: "Guide",
      entityId: guide.id,
    });

    revalidatePath("/admin/guides");
    revalidatePath("/guides");
    return { ok: true, id: guide.id };
  } catch {
    return { ok: false, error: "Unable to create guide." };
  }
}

export async function updateGuideAction(
  _prev: ContentActionResult,
  formData: FormData,
): Promise<ContentActionResult> {
  try {
    const session = await requirePermission("content.manage");
    const guideId = String(formData.get("guideId") ?? "");
    if (!guideId) return { ok: false, error: "Missing guide." };

    const parsed = guideSchema.safeParse({
      title: formData.get("title"),
      slug: formData.get("slug") || "",
      excerpt: formData.get("excerpt") || "",
      body: formData.get("body"),
      sectionsJson: formData.get("sectionsJson") || "",
      seoTitle: formData.get("seoTitle") || "",
      seoDescription: formData.get("seoDescription") || "",
      authorName: formData.get("authorName") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: "Check title and body fields." };
    }

    const existing = await prisma.guide.findUnique({ where: { id: guideId } });
    if (!existing) return { ok: false, error: "Guide not found." };

    const slug = await uniqueGuideSlug(
      parsed.data.slug || parsed.data.title,
      guideId,
    );
    const contentBlocks = {
      body: parsed.data.body,
      sections: parseSections(parsed.data.sectionsJson),
    };

    const guide = await prisma.guide.update({
      where: { id: guideId },
      data: {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt || null,
        contentBlocks,
        seoTitle: parsed.data.seoTitle || null,
        seoDescription: parsed.data.seoDescription || null,
        authorName: parsed.data.authorName || existing.authorName,
      },
    });

    await prisma.contentRevision.create({
      data: {
        entityType: "Guide",
        entityId: guide.id,
        guideId: guide.id,
        authorId: session.user.id,
        snapshot: guide,
        notes: "Guide updated",
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "content.guide_updated",
      entityType: "Guide",
      entityId: guide.id,
    });

    revalidatePath("/admin/guides");
    revalidatePath(`/admin/guides/${guide.id}`);
    revalidatePath(`/guides/${guide.slug}`);
    revalidatePath("/guides");
    return { ok: true, id: guide.id };
  } catch {
    return { ok: false, error: "Unable to update guide." };
  }
}

export async function transitionGuideStatusAction(
  guideId: string,
  nextStatus: PublishStatus,
): Promise<ContentActionResult> {
  try {
    const needsPublish = nextStatus === "PUBLISHED";
    const session = await requirePermission(
      needsPublish ? "content.publish" : "content.manage",
    );

    const guide = await prisma.guide.findUnique({ where: { id: guideId } });
    if (!guide) return { ok: false, error: "Guide not found." };
    if (!canTransitionGuideStatus(guide.status, nextStatus)) {
      return {
        ok: false,
        error: `Cannot move from ${guide.status} to ${nextStatus}.`,
      };
    }

    const updated = await prisma.guide.update({
      where: { id: guideId },
      data: {
        status: nextStatus,
        publishedAt:
          nextStatus === "PUBLISHED" ? new Date() : guide.publishedAt,
        lastReviewedAt:
          nextStatus === "APPROVED" || nextStatus === "PUBLISHED"
            ? new Date()
            : guide.lastReviewedAt,
        indexDirective:
          nextStatus === "PUBLISHED" ? "INDEX" : "NOINDEX",
      },
    });

    await prisma.contentRevision.create({
      data: {
        entityType: "Guide",
        entityId: updated.id,
        guideId: updated.id,
        authorId: session.user.id,
        reviewerId:
          nextStatus === "APPROVED" || nextStatus === "PUBLISHED"
            ? session.user.id
            : null,
        snapshot: updated,
        notes: `Status → ${nextStatus}`,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "content.guide_status",
      entityType: "Guide",
      entityId: guideId,
      metadata: { from: guide.status, to: nextStatus },
    });

    revalidatePath("/admin/guides");
    revalidatePath(`/admin/guides/${guideId}`);
    revalidatePath("/guides");
    revalidatePath(`/guides/${updated.slug}`);
    revalidatePath("/sitemap.xml");
    return { ok: true, id: guideId };
  } catch {
    return { ok: false, error: "Unable to change guide status." };
  }
}

export async function upsertGuideFaqAction(
  _prev: ContentActionResult,
  formData: FormData,
): Promise<ContentActionResult> {
  try {
    const session = await requirePermission("content.manage");
    const guideId = String(formData.get("guideId") ?? "");
    const question = String(formData.get("question") ?? "").trim();
    const answer = String(formData.get("answer") ?? "").trim();
    if (!guideId || question.length < 5 || answer.length < 10) {
      return { ok: false, error: "Provide question and answer." };
    }

    const guide = await prisma.guide.findUnique({ where: { id: guideId } });
    if (!guide) return { ok: false, error: "Guide not found." };

    const maxSort = await prisma.fAQ.aggregate({
      where: { guideId },
      _max: { sortOrder: true },
    });

    const faq = await prisma.fAQ.create({
      data: {
        guideId,
        question,
        answer,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "content.faq_created",
      entityType: "FAQ",
      entityId: faq.id,
      metadata: { guideId },
    });

    revalidatePath(`/admin/guides/${guideId}`);
    revalidatePath(`/guides/${guide.slug}`);
    return { ok: true, id: faq.id };
  } catch {
    return { ok: false, error: "Unable to add FAQ." };
  }
}
