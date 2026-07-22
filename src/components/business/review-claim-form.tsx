"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  reviewBusinessClaimAction,
  type BusinessActionResult,
} from "@/server/actions/business-claims";

const initial: BusinessActionResult = { ok: false };

export function ReviewClaimForm({ claimId }: { claimId: string }) {
  const [state, action, pending] = useActionState(
    reviewBusinessClaimAction,
    initial,
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="claimId" value={claimId} />
      <select
        name="decision"
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        defaultValue="APPROVED"
      >
        <option value="APPROVED">Approve</option>
        <option value="MORE_INFO_REQUIRED">Request more info</option>
        <option value="REJECTED">Reject</option>
      </select>
      <input
        name="adminNotes"
        placeholder="Admin notes"
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Submit review"}
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
