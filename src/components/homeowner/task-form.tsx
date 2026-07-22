"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createTaskAction,
} from "@/server/actions/homeowner-tasks";
import type { HomeownerActionResult } from "@/server/services/homeowner-access";

const initial: HomeownerActionResult = { ok: false };

export function TaskForm({
  properties,
}: {
  properties: { id: string; nickname: string }[];
}) {
  const [state, action, pending] = useActionState(createTaskAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="propertyId">Property (optional)</Label>
          <select
            id="propertyId"
            name="propertyId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="">None</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nickname}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recurrence">Recurrence</Label>
          <select
            id="recurrence"
            name="recurrence"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="">One-time</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="seasonal">Seasonal</option>
          </select>
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800">Task created.</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add task"}
      </Button>
    </form>
  );
}
