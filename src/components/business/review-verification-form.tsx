"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  reviewVerificationAction,
} from "@/server/actions/business-profile";
import type { BusinessActionResult } from "@/server/actions/business-claims";

const initial: BusinessActionResult = { ok: false };

export function ReviewVerificationForm({
  verificationId,
}: {
  verificationId: string;
}) {
  const [state, action, pending] = useActionState(
    reviewVerificationAction,
    initial,
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="verificationId" value={verificationId} />
      <select
        name="decision"
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        defaultValue="BUSINESS_VERIFIED"
      >
        <option value="BUSINESS_VERIFIED">Business verified</option>
        <option value="PLATFORM_VERIFIED">Platform verified</option>
        <option value="REJECTED">Reject</option>
      </select>
      <input
        name="notes"
        placeholder="Notes"
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Submit"}
      </Button>
      {state.error ? (
        <span className="text-xs text-destructive">{state.error}</span>
      ) : null}
      {state.ok ? (
        <span className="text-xs text-emerald-800">Saved</span>
      ) : null}
    </form>
  );
}
