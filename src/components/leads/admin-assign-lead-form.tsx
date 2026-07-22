"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  adminAssignLeadAction,
  type QuoteActionResult,
} from "@/server/actions/leads";

const initial: QuoteActionResult = { ok: false };

export function AdminAssignLeadForm({
  leadId,
  businesses,
}: {
  leadId: string;
  businesses: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    adminAssignLeadAction,
    initial,
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <select
        name="businessId"
        required
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        defaultValue=""
      >
        <option value="" disabled>
          Assign business…
        </option>
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Assigning…" : "Assign"}
      </Button>
      {state.error ? (
        <span className="text-xs text-destructive">{state.error}</span>
      ) : null}
      {state.ok ? (
        <span className="text-xs text-emerald-800">Assigned</span>
      ) : null}
    </form>
  );
}
