"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  upsertGuideFaqAction,
  type ContentActionResult,
} from "@/server/actions/content-guides";

const initial: ContentActionResult = { ok: false };

export function GuideFaqForm({ guideId }: { guideId: string }) {
  const [state, action, pending] = useActionState(upsertGuideFaqAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="guideId" value={guideId} />
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Input id="question" name="question" required minLength={5} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="answer">Answer</Label>
        <Textarea id="answer" name="answer" required minLength={10} rows={3} />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800">FAQ added.</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add FAQ"}
      </Button>
    </form>
  );
}
