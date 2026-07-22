"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestAiGuideDraftAction,
} from "@/server/actions/ai-content";
import type { ContentActionResult } from "@/server/actions/content-guides";

const initial: ContentActionResult = { ok: false };

export function AiDraftRequestForm() {
  const [state, action, pending] = useActionState(
    requestAiGuideDraftAction,
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="topic">Topic</Label>
        <Input
          id="topic"
          name="topic"
          required
          minLength={5}
          placeholder="Ice dam prevention for older roofs"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="serviceName">Service focus</Label>
          <Input id="serviceName" name="serviceName" placeholder="Roofing" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationName">Location context</Label>
          <Input
            id="locationName"
            name="locationName"
            placeholder="Potsdam, NY"
            defaultValue="Northern New York"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Drafts are never published automatically. An editor must approve the AI
        output, then a separate publish step is required.
      </p>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800">
          Draft queued for review in the list below.
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : "Generate AI draft"}
      </Button>
    </form>
  );
}
