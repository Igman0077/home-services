"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitQuoteRequestAction,
  type QuoteActionResult,
} from "@/server/actions/leads";

type Option = { id: string; name: string; slug?: string };

type QuoteFormProps = {
  services: Option[];
  locations: Option[];
  consentText: string;
  defaultServiceId?: string;
  defaultLocationId?: string;
  defaultBusinessSlug?: string;
};

const initial: QuoteActionResult = { ok: false };

export function QuoteRequestForm({
  services,
  locations,
  consentText,
  defaultServiceId = "",
  defaultLocationId = "",
  defaultBusinessSlug = "",
}: QuoteFormProps) {
  const [step, setStep] = useState(1);
  const formStartedAt = useMemo(() => new Date().toISOString(), []);
  const [state, action, pending] = useActionState(
    submitQuoteRequestAction,
    initial,
  );

  if (state.ok) {
    return (
      <div
        className="rounded-lg border border-border bg-card p-6"
        role="status"
      >
        <h2 className="font-display text-2xl font-semibold text-primary">
          Request received
        </h2>
        <p className="mt-3 text-muted-foreground">
          Thanks — your quote request was submitted. Matching businesses will
          review project details. They only receive your contact information
          after they accept the lead.
        </p>
        {state.warnings?.length ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {state.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">
          Reference: {state.leadId}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="formStartedAt" value={formStartedAt} />
      <input
        type="hidden"
        name="businessSlug"
        value={defaultBusinessSlug}
      />

      {/* Honeypot */}
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <Label htmlFor="companyWebsite">Company website</Label>
        <Input
          id="companyWebsite"
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <ol className="flex flex-wrap gap-2 text-sm" aria-label="Form progress">
        {[1, 2, 3].map((n) => (
          <li
            key={n}
            className={
              n === step
                ? "rounded-md bg-primary px-3 py-1 font-medium text-primary-foreground"
                : n < step
                  ? "rounded-md bg-secondary px-3 py-1 text-secondary-foreground"
                  : "rounded-md border border-border px-3 py-1 text-muted-foreground"
            }
          >
            Step {n}
          </li>
        ))}
      </ol>

      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <h2 className="text-xl font-semibold">Service & location</h2>
        <div className="space-y-2">
          <Label htmlFor="serviceId">Service needed</Label>
          <select
            id="serviceId"
            name="serviceId"
            required
            defaultValue={defaultServiceId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select a service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationId">Town / city</Label>
          <select
            id="locationId"
            name="locationId"
            defaultValue={defaultLocationId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select a location</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP code (if location not listed)</Label>
          <Input id="zipCode" name="zipCode" inputMode="numeric" />
        </div>
        <Button type="button" onClick={() => setStep(2)}>
          Continue
        </Button>
      </div>

      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <h2 className="text-xl font-semibold">Project details</h2>
        <div className="space-y-2">
          <Label htmlFor="projectDescription">Describe the project</Label>
          <Textarea
            id="projectDescription"
            name="projectDescription"
            required
            minLength={20}
            rows={5}
            placeholder="What needs to be done? Any urgency, property details, or preferences?"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desiredTimeline">Desired timeline</Label>
          <Input
            id="desiredTimeline"
            name="desiredTimeline"
            placeholder="e.g. ASAP, this month, flexible"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="propertyType">Property type</Label>
          <select
            id="propertyType"
            name="propertyType"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="SINGLE_FAMILY"
          >
            <option value="SINGLE_FAMILY">Single family</option>
            <option value="MULTI_FAMILY">Multi family</option>
            <option value="CONDO">Condo</option>
            <option value="TOWNHOUSE">Townhouse</option>
            <option value="MOBILE">Mobile</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button type="button" onClick={() => setStep(3)}>
            Continue
          </Button>
        </div>
      </div>

      <div className={step === 3 ? "space-y-4" : "hidden"}>
        <h2 className="text-xl font-semibold">Contact</h2>
        <div className="space-y-2">
          <Label htmlFor="contactName">Full name</Label>
          <Input id="contactName" name="contactName" required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredContact">Preferred contact method</Label>
          <select
            id="preferredContact"
            name="preferredContact"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="EITHER"
          >
            <option value="EITHER">Either email or phone</option>
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
          </select>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="consent"
              value="true"
              required
              className="mt-1"
            />
            <span>
              <span className="font-medium text-foreground">
                I agree to be contacted about this project.
              </span>{" "}
              {consentText}
            </span>
          </label>
        </div>
        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setStep(2)}>
            Back
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Submitting…" : "Submit quote request"}
          </Button>
        </div>
      </div>
    </form>
  );
}
