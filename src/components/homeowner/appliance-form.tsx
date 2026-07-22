"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createApplianceAction } from "@/server/actions/homeowner-appliances";
import type { HomeownerActionResult } from "@/server/services/homeowner-access";

const initial: HomeownerActionResult = { ok: false };

export function ApplianceForm({
  propertyId,
  properties,
}: {
  propertyId?: string;
  properties: { id: string; nickname: string }[];
}) {
  const [state, action, pending] = useActionState(createApplianceAction, initial);

  return (
    <form action={action} className="space-y-4">
      {propertyId ? (
        <input type="hidden" name="propertyId" value={propertyId} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor="propertyId">Property</Label>
          <select
            id="propertyId"
            name="propertyId"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select property
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nickname}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Furnace, water heater…" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input id="manufacturer" name="manufacturer" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial number</Label>
          <Input id="serialNumber" name="serialNumber" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase date</Label>
          <Input id="purchaseDate" name="purchaseDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="warrantyExpires">Warranty expires</Label>
          <Input id="warrantyExpires" name="warrantyExpires" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="warrantyProvider">Warranty provider</Label>
          <Input id="warrantyProvider" name="warrantyProvider" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800">Appliance added.</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add appliance"}
      </Button>
    </form>
  );
}
