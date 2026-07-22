"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  getSeasonalSuggestions,
  nextDueDateForSuggestion,
} from "@/lib/seasonal-tasks";
import { prisma } from "@/lib/db";
import type { HomeownerActionResult } from "@/server/services/homeowner-access";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";
import { writeAuditLog } from "@/server/services/audit";

const taskSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  propertyId: z.string().cuid().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  recurrence: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

function parseDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function assertPropertyOptional(userId: string, propertyId?: string) {
  if (!propertyId) return null;
  const property = await prisma.homeownerProperty.findFirst({
    where: { id: propertyId, userId, deletedAt: null },
  });
  return property?.id ?? null;
}

export async function createTaskAction(
  _prev: HomeownerActionResult,
  formData: FormData,
): Promise<HomeownerActionResult> {
  try {
    const session = await requireHomeownerSession();
    const parsed = taskSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || "",
      propertyId: formData.get("propertyId") || "",
      dueDate: formData.get("dueDate") || "",
      recurrence: formData.get("recurrence") || "",
      notes: formData.get("notes") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: "Provide a task title." };
    }

    const propertyId = await assertPropertyOptional(
      session.user.id,
      parsed.data.propertyId || undefined,
    );

    const task = await prisma.maintenanceTask.create({
      data: {
        userId: session.user.id,
        propertyId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        dueDate: parseDate(parsed.data.dueDate),
        recurrence: parsed.data.recurrence || null,
        notes: parsed.data.notes || null,
        isSeasonalSuggestion: false,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "homeowner.task_created",
      entityType: "MaintenanceTask",
      entityId: task.id,
    });

    revalidatePath("/homeowner/tasks");
    revalidatePath("/homeowner/dashboard");
    return { ok: true, id: task.id };
  } catch {
    return { ok: false, error: "Unable to create task." };
  }
}

export async function completeTaskAction(
  taskId: string,
  notes?: string,
): Promise<HomeownerActionResult> {
  try {
    const session = await requireHomeownerSession();
    const task = await prisma.maintenanceTask.findFirst({
      where: { id: taskId, userId: session.user.id },
    });
    if (!task) return { ok: false, error: "Task not found." };

    const completedAt = new Date();
    await prisma.$transaction([
      prisma.maintenanceCompletion.create({
        data: {
          taskId,
          notes: notes?.trim() || null,
          completedAt,
        },
      }),
      prisma.maintenanceTask.update({
        where: { id: taskId },
        data: { completedAt },
      }),
    ]);

    // Recurring: spawn next occurrence
    if (task.recurrence && task.dueDate) {
      const next = new Date(task.dueDate);
      if (task.recurrence === "monthly") next.setMonth(next.getMonth() + 1);
      else if (task.recurrence === "yearly" || task.recurrence === "seasonal") {
        next.setFullYear(next.getFullYear() + 1);
      } else {
        next.setFullYear(next.getFullYear() + 1);
      }
      await prisma.maintenanceTask.create({
        data: {
          userId: session.user.id,
          propertyId: task.propertyId,
          title: task.title,
          description: task.description,
          dueDate: next,
          recurrence: task.recurrence,
          isSeasonalSuggestion: task.isSeasonalSuggestion,
          notes: task.notes,
        },
      });
    }

    await writeAuditLog({
      actorId: session.user.id,
      action: "homeowner.task_completed",
      entityType: "MaintenanceTask",
      entityId: taskId,
    });

    revalidatePath("/homeowner/tasks");
    revalidatePath("/homeowner/dashboard");
    return { ok: true, id: taskId };
  } catch {
    return { ok: false, error: "Unable to complete task." };
  }
}

export async function deleteTaskAction(
  taskId: string,
): Promise<HomeownerActionResult> {
  try {
    const session = await requireHomeownerSession();
    const task = await prisma.maintenanceTask.findFirst({
      where: { id: taskId, userId: session.user.id },
    });
    if (!task) return { ok: false, error: "Task not found." };
    await prisma.maintenanceTask.delete({ where: { id: taskId } });
    revalidatePath("/homeowner/tasks");
    return { ok: true, id: taskId };
  } catch {
    return { ok: false, error: "Unable to delete task." };
  }
}

export async function addSeasonalSuggestionsAction(
  propertyId?: string,
): Promise<HomeownerActionResult> {
  try {
    const session = await requireHomeownerSession();
    let ownedPropertyId: string | null = null;
    if (propertyId) {
      const property = await prisma.homeownerProperty.findFirst({
        where: { id: propertyId, userId: session.user.id, deletedAt: null },
      });
      ownedPropertyId = property?.id ?? null;
    }

    const suggestions = getSeasonalSuggestions();
    const existing = await prisma.maintenanceTask.findMany({
      where: {
        userId: session.user.id,
        completedAt: null,
        isSeasonalSuggestion: true,
      },
      select: { title: true },
    });
    const existingTitles = new Set(existing.map((t) => t.title));

    const created = [];
    for (const suggestion of suggestions) {
      if (existingTitles.has(suggestion.title)) continue;
      created.push(
        await prisma.maintenanceTask.create({
          data: {
            userId: session.user.id,
            propertyId: ownedPropertyId,
            title: suggestion.title,
            description: suggestion.description,
            dueDate: nextDueDateForSuggestion(suggestion.monthHint),
            recurrence: suggestion.recurrence,
            isSeasonalSuggestion: true,
          },
        }),
      );
    }

    revalidatePath("/homeowner/tasks");
    revalidatePath("/homeowner/dashboard");
    return { ok: true, id: String(created.length) };
  } catch {
    return { ok: false, error: "Unable to add seasonal suggestions." };
  }
}
