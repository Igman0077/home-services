"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitBusinessClaimAction,
  type BusinessActionResult,
} from "@/server/actions/business-claims";

const initial: BusinessActionResult = { ok: false };

export function ClaimBusinessForm({
  businessId,
  isSignedIn,
}: {
  businessId: string;
  isSignedIn: boolean;
}) {
  const [state, action, pending] = useActionState(
    submitBusinessClaimAction,
    initial,
  );

  if (!isSignedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>{" "}
        or{" "}
        <Link href="/register" className="text-accent hover:underline">
          create an account
        </Link>{" "}
        to claim this business.
      </p>
    );
  }

  if (state.ok) {
    return (
      <p className="text-sm text-emerald-800" role="status">
        Claim submitted for review. An administrator will verify ownership before
        approving access.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      <div className="space-y-2">
        <Label htmlFor="verificationMethod">Verification method</Label>
        <select
          id="verificationMethod"
          name="verificationMethod"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue="manual"
          required
        >
          <option value="business_email">Business domain email</option>
          <option value="phone">Phone verification</option>
          <option value="documentation">Documentation</option>
          <option value="manual">Manual administrator review</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="evidenceNotes">Evidence / notes</Label>
        <Textarea
          id="evidenceNotes"
          name="evidenceNotes"
          required
          minLength={10}
          rows={4}
          placeholder="Explain how you can prove ownership (role, phone on listing, docs you can provide, etc.)"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Claim this business"}
      </Button>
    </form>
  );
}
