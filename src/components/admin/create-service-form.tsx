"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createServiceAction,
  type ActionResult,
} from "@/server/actions/admin";

const initial: ActionResult = { ok: false };

export function CreateServiceForm() {
  const [state, action, pending] = useActionState(createServiceAction, initial);

  return (
    <form action={action} className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold">Add service</h3>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" placeholder="roofing" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short description</Label>
        <Textarea id="shortDescription" name="shortDescription" rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="isLaunchFocus">Launch focus</Label>
        <select
          id="isLaunchFocus"
          name="isLaunchFocus"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue="false"
        >
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800" role="status">
          Service created.
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create service"}
      </Button>
    </form>
  );
}
