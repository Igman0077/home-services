"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAiProvider } from "@/integrations/ai";
import type { AiGuideDraftOutput } from "@/integrations/ai";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/server/services/audit";
import type { ContentActionResult } from "@/server/actions/content-guides";

const requestSchema = z.object({
  topic: z.string().trim().min(5).max(200),
  serviceName: z.string().trim().max(120).optional().or(z.literal("")),
  locationName: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function requestAiGuideDraftAction(
  _prev: ContentActionResult,
  formData: FormData,
): Promise<ContentActionResult> {
  try {
    const session = await requirePermission("ai.generate");
    const parsed = requestSchema.safeParse({
      topic: formData.get("topic"),
      serviceName: formData.get("serviceName") || "",
      locationName: formData.get("locationName") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: "Provide a topic (at least 5 characters)." };
    }

    const job = await prisma.aIJob.create({
      data: {
        type: "guide_draft",
        status: "RUNNING",
        input: parsed.data,
        startedAt: new Date(),
        attempts: 1,
      },
    });

    try {
      const result = await getAiProvider().generateGuideDraft({
        type: "guide_draft",
        topic: parsed.data.topic,
        serviceName: parsed.data.serviceName || undefined,
        locationName: parsed.data.locationName || undefined,
      });

      const generation = await prisma.aIGeneration.create({
        data: {
          jobId: job.id,
          prompt: result.prompt,
          model: result.model,
          provider: result.provider,
          sourceData: parsed.data,
          output: result.output,
          reviewStatus: "PENDING_REVIEW",
          qualityScore: result.qualityScore,
        },
      });

      await prisma.aIJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          costUsd: 0,
        },
      });

      await writeAuditLog({
        actorId: session.user.id,
        action: "ai.guide_draft_requested",
        entityType: "AIGeneration",
        entityId: generation.id,
        metadata: { jobId: job.id, topic: parsed.data.topic },
      });

      revalidatePath("/admin/ai");
      return { ok: true, id: generation.id };
    } catch (error) {
      await prisma.aIJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Generation failed",
          completedAt: new Date(),
        },
      });
      return { ok: false, error: "AI generation failed." };
    }
  } catch {
    return { ok: false, error: "Unable to start AI draft." };
  }
}

async function uniqueGuideSlug(base: string) {
  let slug = slugify(base) || `ai-guide-${Date.now().toString(36)}`;
  let n = 0;
  while (await prisma.guide.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
  return slug;
}

export async function reviewAiGenerationAction(
  generationId: string,
  decision: "APPROVED" | "REJECTED" | "NEEDS_REVISION",
): Promise<ContentActionResult> {
  try {
    const session = await requirePermission("ai.review");
    const generation = await prisma.aIGeneration.findUnique({
      where: { id: generationId },
    });
    if (!generation) return { ok: false, error: "Generation not found." };
    if (generation.reviewStatus !== "PENDING_REVIEW") {
      return { ok: false, error: "Already reviewed." };
    }

    await prisma.aIGeneration.update({
      where: { id: generationId },
      data: {
        reviewStatus: decision,
        reviewerId: session.user.id,
        reviewedAt: new Date(),
      },
    });

    let guideId: string | undefined;

    if (decision === "APPROVED") {
      const output = generation.output as AiGuideDraftOutput | null;
      if (!output?.title || !output?.contentBlocks) {
        return { ok: false, error: "Generation output is incomplete." };
      }

      const slug = await uniqueGuideSlug(output.slug || output.title);
      const guide = await prisma.guide.create({
        data: {
          title: output.title,
          slug,
          excerpt: output.excerpt,
          contentBlocks: output.contentBlocks,
          status: "DRAFT",
          seoTitle: output.seoTitle,
          seoDescription: output.seoDescription,
          authorName: "AI draft (pending human publish)",
          indexDirective: "NOINDEX",
          faqs: {
            create: (output.faqs ?? []).map((faq, index) => ({
              question: faq.question,
              answer: faq.answer,
              sortOrder: index,
            })),
          },
        },
      });
      guideId = guide.id;

      await prisma.contentRevision.create({
        data: {
          entityType: "Guide",
          entityId: guide.id,
          guideId: guide.id,
          authorId: session.user.id,
          reviewerId: session.user.id,
          snapshot: {
            guide,
            fromAiGenerationId: generation.id,
            disclaimer: output.disclaimer,
          },
          notes: "Created from approved AI draft — still requires publish step",
        },
      });
    }

    await writeAuditLog({
      actorId: session.user.id,
      action: "ai.generation_reviewed",
      entityType: "AIGeneration",
      entityId: generationId,
      metadata: { decision, guideId },
    });

    revalidatePath("/admin/ai");
    revalidatePath("/admin/guides");
    return { ok: true, id: guideId ?? generationId };
  } catch {
    return { ok: false, error: "Unable to review AI generation." };
  }
}
