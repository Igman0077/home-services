"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createBusinessProfileAction,
  type BusinessActionResult,
} from "@/server/actions/business-claims";

const initial: BusinessActionResult = { ok: false };

export function CreateBusinessForm() {
  const [state, action, pending] = useActionState(
    createBusinessProfileAction,
    initial,
  );

  if (state.ok) {
    return (
      <p className="rounded-lg border border-border bg-card p-4 text-sm text-emerald-800">
        Business profile created and submitted for review. You can edit details
        and service areas from your dashboard while it awaits publication.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Business name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required minLength={40} rows={4} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Business email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website (optional)</Label>
        <Input id="website" name="website" type="url" placeholder="https://" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stateCode">State</Label>
          <Input id="stateCode" name="stateCode" defaultValue="NY" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">ZIP</Label>
          <Input id="postalCode" name="postalCode" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="isServiceAreaBusiness">Business type</Label>
        <select
          id="isServiceAreaBusiness"
          name="isServiceAreaBusiness"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue="true"
        >
          <option value="true">Service-area business</option>
          <option value="false">Has a storefront address</option>
        </select>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create profile for review"}
      </Button>
    </form>
  );
}
