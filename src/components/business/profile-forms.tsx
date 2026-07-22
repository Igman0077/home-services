"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BusinessActionResult } from "@/server/actions/business-claims";
import {
  requestBusinessVerificationAction,
  updateBusinessAreasAction,
  updateBusinessHoursAction,
  updateBusinessProfileAction,
  updateBusinessServicesAction,
} from "@/server/actions/business-profile";

const initial: BusinessActionResult = { ok: false };

type BusinessProfile = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressLine1: string | null;
  city: string | null;
  stateCode: string | null;
  postalCode: string | null;
  yearEstablished: number | null;
  offersEmergency: boolean;
  offersFreeEstimate: boolean;
  offersFinancing: boolean;
  isServiceAreaBusiness: boolean;
  licenseDetails: string | null;
  insuranceDetails: string | null;
  verificationStatus: string;
};

export function EditBusinessProfileForm({
  business,
}: {
  business: BusinessProfile;
}) {
  const [state, action, pending] = useActionState(
    updateBusinessProfileAction,
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="businessId" value={business.id} />
      <div className="space-y-2">
        <Label htmlFor="name">Business name</Label>
        <Input id="name" name="name" defaultValue={business.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={business.description ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={business.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={business.email ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          type="url"
          defaultValue={business.website ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="addressLine1">Address</Label>
          <Input
            id="addressLine1"
            name="addressLine1"
            defaultValue={business.addressLine1 ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={business.city ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stateCode">State</Label>
          <Input
            id="stateCode"
            name="stateCode"
            defaultValue={business.stateCode ?? "NY"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">ZIP</Label>
          <Input
            id="postalCode"
            name="postalCode"
            defaultValue={business.postalCode ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="yearEstablished">Year established</Label>
        <Input
          id="yearEstablished"
          name="yearEstablished"
          type="number"
          defaultValue={business.yearEstablished ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["offersEmergency", "Emergency service", business.offersEmergency],
            ["offersFreeEstimate", "Free estimates", business.offersFreeEstimate],
            ["offersFinancing", "Financing", business.offersFinancing],
            [
              "isServiceAreaBusiness",
              "Service-area business",
              business.isServiceAreaBusiness,
            ],
          ] as const
        ).map(([name, label, value]) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <select
              id={name}
              name={name}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={value ? "true" : "false"}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="licenseDetails">License details (self-reported)</Label>
        <Textarea
          id="licenseDetails"
          name="licenseDetails"
          rows={2}
          defaultValue={business.licenseDetails ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="insuranceDetails">Insurance details (self-reported)</Label>
        <Textarea
          id="insuranceDetails"
          name="insuranceDetails"
          rows={2}
          defaultValue={business.insuranceDetails ?? ""}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800" role="status">
          Profile saved.
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

export function EditServicesForm({
  businessId,
  allServices,
  selectedIds,
}: {
  businessId: string;
  allServices: { id: string; name: string }[];
  selectedIds: string[];
}) {
  const [state, action, pending] = useActionState(
    updateBusinessServicesAction,
    initial,
  );
  const selected = new Set(selectedIds);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      <fieldset className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium">Services offered</legend>
        {allServices.map((service) => (
          <label key={service.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="serviceIds"
              value={service.id}
              defaultChecked={selected.has(service.id)}
            />
            {service.name}
          </label>
        ))}
      </fieldset>
      {state.ok ? (
        <p className="text-sm text-emerald-800">Services updated.</p>
      ) : null}
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save services"}
      </Button>
    </form>
  );
}

export function EditAreasForm({
  businessId,
  allLocations,
  selectedIds,
}: {
  businessId: string;
  allLocations: { id: string; name: string }[];
  selectedIds: string[];
}) {
  const [state, action, pending] = useActionState(
    updateBusinessAreasAction,
    initial,
  );
  const selected = new Set(selectedIds);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      <fieldset className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium">Service areas</legend>
        {allLocations.map((location) => (
          <label key={location.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="locationIds"
              value={location.id}
              defaultChecked={selected.has(location.id)}
            />
            {location.name}
          </label>
        ))}
      </fieldset>
      {state.ok ? (
        <p className="text-sm text-emerald-800">Areas updated.</p>
      ) : null}
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save areas"}
      </Button>
    </form>
  );
}

export function EditHoursForm({
  businessId,
  hours,
}: {
  businessId: string;
  hours: {
    dayOfWeek: string;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }[];
}) {
  const [state, action, pending] = useActionState(
    updateBusinessHoursAction,
    initial,
  );
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
  const days = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ] as const;
  const labels: Record<(typeof days)[number], string> = {
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
    SATURDAY: "Saturday",
    SUNDAY: "Sunday",
  };

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      <ul className="space-y-2">
        {days.map((day) => {
          const row = byDay.get(day);
          return (
            <li
              key={day}
              className="grid gap-2 rounded-md border border-border/70 p-3 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-center"
            >
              <span className="text-sm font-medium">{labels[day]}</span>
              <Input
                name={`open_${day}`}
                placeholder="09:00"
                defaultValue={row?.openTime ?? ""}
                aria-label={`${labels[day]} open`}
              />
              <Input
                name={`close_${day}`}
                placeholder="17:00"
                defaultValue={row?.closeTime ?? ""}
                aria-label={`${labels[day]} close`}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`closed_${day}`}
                  value="true"
                  defaultChecked={row?.isClosed ?? false}
                />
                Closed
              </label>
            </li>
          );
        })}
      </ul>
      {state.ok ? (
        <p className="text-sm text-emerald-800">Hours updated.</p>
      ) : null}
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save hours"}
      </Button>
    </form>
  );
}

export function RequestVerificationForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState(
    requestBusinessVerificationAction,
    initial,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      <div className="space-y-2">
        <Label htmlFor="method">Method</Label>
        <select
          id="method"
          name="method"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue="documentation"
        >
          <option value="business_email">Business email</option>
          <option value="phone">Phone</option>
          <option value="documentation">Documentation</option>
          <option value="manual">Manual review</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes / evidence summary</Label>
        <Textarea id="notes" name="notes" required minLength={10} rows={3} />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800">Verification request submitted.</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Submitting…" : "Request verification"}
      </Button>
    </form>
  );
}
