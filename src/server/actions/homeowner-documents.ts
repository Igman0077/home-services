"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getStorageProvider } from "@/integrations/storage";
import { prisma } from "@/lib/db";
import type { HomeownerActionResult } from "@/server/services/homeowner-access";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";
import { writeAuditLog } from "@/server/services/audit";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const metaSchema = z.object({
  title: z.string().trim().min(2).max(200),
  propertyId: z.string().cuid().optional().or(z.literal("")),
  applianceId: z.string().cuid().optional().or(z.literal("")),
  taskId: z.string().cuid().optional().or(z.literal("")),
  externalUrl: z.string().trim().url().optional().or(z.literal("")),
});

export async function uploadDocumentAction(
  _prev: HomeownerActionResult,
  formData: FormData,
): Promise<HomeownerActionResult> {
  try {
    const session = await requireHomeownerSession();
    const parsed = metaSchema.safeParse({
      title: formData.get("title"),
      propertyId: formData.get("propertyId") || "",
      applianceId: formData.get("applianceId") || "",
      taskId: formData.get("taskId") || "",
      externalUrl: formData.get("externalUrl") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: "Provide a document title." };
    }

    const propertyId = parsed.data.propertyId || null;
    if (propertyId) {
      const owned = await prisma.homeownerProperty.findFirst({
        where: { id: propertyId, userId: session.user.id, deletedAt: null },
      });
      if (!owned) return { ok: false, error: "Invalid property." };
    }

    const file = formData.get("file");
    let storageKey: string;
    let fileName: string;
    let mimeType: string;
    let sizeBytes: number;

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_BYTES) {
        return { ok: false, error: "File must be 5MB or smaller." };
      }
      if (!ALLOWED.has(file.type)) {
        return {
          ok: false,
          error: "Allowed types: PDF, JPEG, PNG, WebP, TXT, DOC/DOCX.",
        };
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const stored = await getStorageProvider().put(session.user.id, {
        buffer,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
      });
      storageKey = stored.storageKey;
      fileName = stored.fileName;
      mimeType = stored.mimeType;
      sizeBytes = stored.sizeBytes;
    } else if (parsed.data.externalUrl) {
      storageKey = `external:${parsed.data.externalUrl}`;
      fileName = parsed.data.title.slice(0, 120);
      mimeType = "text/uri-list";
      sizeBytes = 0;
    } else {
      return {
        ok: false,
        error: "Upload a file or provide an external document URL.",
      };
    }

    const doc = await prisma.document.create({
      data: {
        userId: session.user.id,
        propertyId,
        applianceId: parsed.data.applianceId || null,
        taskId: parsed.data.taskId || null,
        title: parsed.data.title,
        fileName,
        mimeType,
        sizeBytes,
        storageKey,
        visibility: "PRIVATE",
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "homeowner.document_created",
      entityType: "Document",
      entityId: doc.id,
    });

    revalidatePath("/homeowner/documents");
    return { ok: true, id: doc.id };
  } catch {
    return { ok: false, error: "Unable to save document." };
  }
}

export async function deleteDocumentAction(
  documentId: string,
): Promise<HomeownerActionResult> {
  try {
    const session = await requireHomeownerSession();
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId: session.user.id },
    });
    if (!doc) return { ok: false, error: "Document not found." };

    if (doc.storageKey.startsWith("local/")) {
      await getStorageProvider().delete(doc.storageKey);
    }
    await prisma.document.delete({ where: { id: doc.id } });

    await writeAuditLog({
      actorId: session.user.id,
      action: "homeowner.document_deleted",
      entityType: "Document",
      entityId: documentId,
    });

    revalidatePath("/homeowner/documents");
    return { ok: true, id: documentId };
  } catch {
    return { ok: false, error: "Unable to delete document." };
  }
}
