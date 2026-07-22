"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createLocationAction,
  type ActionResult,
} from "@/server/actions/admin";

const initial: ActionResult = { ok: false };

type ParentOption = {
  id: string;
  name: string;
  fullSlug: string;
  type: string;
};

export function CreateLocationForm({ parents }: { parents: ParentOption[] }) {
  const [state, action, pending] = useActionState(
    createLocationAction,
    initial,
  );

  return (
    <form action={action} className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold">Add location</h3>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" placeholder="potsdam" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue="CITY"
          required
        >
          <option value="COUNTRY">Country</option>
          <option value="STATE">State</option>
          <option value="COUNTY">County</option>
          <option value="CITY">City / town</option>
          <option value="ZIP">ZIP</option>
          <option value="NEIGHBORHOOD">Neighborhood</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="parentId">Parent location</Label>
        <select
          id="parentId"
          name="parentId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue=""
        >
          <option value="">None (top level)</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name} ({parent.type} · {parent.fullSlug})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="stateCode">State code</Label>
        <Input id="stateCode" name="stateCode" placeholder="NY" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short description</Label>
        <Textarea id="shortDescription" name="shortDescription" rows={3} />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800" role="status">
          Location created.
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create location"}
      </Button>
    </form>
  );
}
