"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessActionResult } from "@/server/actions/business-claims";
import { updateLeadPreferencesAction } from "@/server/actions/business-profile";

const initial: BusinessActionResult = { ok: false };

export function LeadPreferencesForm({
  businessId,
  prefs,
}: {
  businessId: string;
  prefs: {
    acceptsLeads: boolean;
    pauseLeads: boolean;
    dailyCap: number | null;
    monthlyCap: number | null;
    notifyEmail: boolean;
    notifySms: boolean;
    notifyInApp: boolean;
    exclusiveEligible: boolean;
  } | null;
}) {
  const [state, action, pending] = useActionState(
    updateLeadPreferencesAction,
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      {(
        [
          ["acceptsLeads", "Accept leads", prefs?.acceptsLeads ?? true],
          ["pauseLeads", "Pause leads temporarily", prefs?.pauseLeads ?? false],
          ["notifyEmail", "Email notifications", prefs?.notifyEmail ?? true],
          ["notifySms", "SMS notifications", prefs?.notifySms ?? false],
          ["notifyInApp", "In-app notifications", prefs?.notifyInApp ?? true],
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dailyCap">Daily lead cap</Label>
          <Input
            id="dailyCap"
            name="dailyCap"
            type="number"
            min={0}
            defaultValue={prefs?.dailyCap ?? ""}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthlyCap">Monthly lead cap</Label>
          <Input
            id="monthlyCap"
            name="monthlyCap"
            type="number"
            min={0}
            defaultValue={prefs?.monthlyCap ?? ""}
            placeholder="Unlimited"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Exclusive-territory eligibility is administrator-controlled
        {prefs?.exclusiveEligible ? " (currently eligible)." : " (not currently eligible)."}
      </p>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800">Preferences saved.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
