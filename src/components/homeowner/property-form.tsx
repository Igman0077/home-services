"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPropertyAction,
  updatePropertyAction,
} from "@/server/actions/homeowner-properties";
import type { HomeownerActionResult } from "@/server/services/homeowner-access";

const initial: HomeownerActionResult = { ok: false };

const PROPERTY_TYPES = [
  ["SINGLE_FAMILY", "Single family"],
  ["MULTI_FAMILY", "Multi family"],
  ["CONDO", "Condo"],
  ["TOWNHOUSE", "Townhouse"],
  ["MOBILE", "Mobile"],
  ["COMMERCIAL", "Commercial"],
  ["OTHER", "Other"],
] as const;

type PropertyFields = {
  id?: string;
  nickname: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateCode: string | null;
  postalCode: string | null;
  propertyType: string;
  yearBuilt: number | null;
  squareFootage: number | null;
  heatingType: string | null;
  coolingType: string | null;
  roofType: string | null;
  roofAgeYears: number | null;
  waterSource: string | null;
  sewerType: string | null;
  notes: string | null;
};

export function PropertyForm({
  property,
}: {
  property?: PropertyFields;
}) {
  const action = property ? updatePropertyAction : createPropertyAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {property ? (
        <input type="hidden" name="propertyId" value={property.id} />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          name="nickname"
          required
          defaultValue={property?.nickname ?? ""}
          placeholder="e.g. Main house"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="addressLine1">Address</Label>
          <Input
            id="addressLine1"
            name="addressLine1"
            defaultValue={property?.addressLine1 ?? ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="addressLine2">Address line 2</Label>
          <Input
            id="addressLine2"
            name="addressLine2"
            defaultValue={property?.addressLine2 ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={property?.city ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stateCode">State</Label>
          <Input
            id="stateCode"
            name="stateCode"
            defaultValue={property?.stateCode ?? "NY"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">ZIP</Label>
          <Input
            id="postalCode"
            name="postalCode"
            defaultValue={property?.postalCode ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="propertyType">Property type</Label>
          <select
            id="propertyType"
            name="propertyType"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue={property?.propertyType ?? "SINGLE_FAMILY"}
          >
            {PROPERTY_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="yearBuilt">Year built</Label>
          <Input
            id="yearBuilt"
            name="yearBuilt"
            type="number"
            defaultValue={property?.yearBuilt ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="squareFootage">Square footage</Label>
          <Input
            id="squareFootage"
            name="squareFootage"
            type="number"
            defaultValue={property?.squareFootage ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roofAgeYears">Roof age (years)</Label>
          <Input
            id="roofAgeYears"
            name="roofAgeYears"
            type="number"
            defaultValue={property?.roofAgeYears ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["heatingType", "Heating", property?.heatingType],
            ["coolingType", "Cooling", property?.coolingType],
            ["roofType", "Roof type", property?.roofType],
            ["waterSource", "Water source", property?.waterSource],
            ["sewerType", "Sewer / septic", property?.sewerType],
          ] as const
        ).map(([name, label, value]) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} defaultValue={value ?? ""} />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={property?.notes ?? ""}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800" role="status">
          Property saved.
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : property ? "Update property" : "Add property"}
      </Button>
    </form>
  );
}
