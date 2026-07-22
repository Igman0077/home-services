"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadDocumentAction } from "@/server/actions/homeowner-documents";
import type { HomeownerActionResult } from "@/server/services/homeowner-access";

const initial: HomeownerActionResult = { ok: false };

export function DocumentUploadForm({
  properties,
}: {
  properties: { id: string; nickname: string }[];
}) {
  const [state, action, pending] = useActionState(uploadDocumentAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="Furnace warranty PDF" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="propertyId">Property (optional)</Label>
        <select
          id="propertyId"
          name="propertyId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue=""
        >
          <option value="">None</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nickname}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">File upload (max 5MB)</Label>
        <Input id="file" name="file" type="file" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="externalUrl">Or external URL</Label>
        <Input
          id="externalUrl"
          name="externalUrl"
          type="url"
          placeholder="https://…"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Private vault only. Local files stay on this server’s disk until cloud
        storage is connected.
      </p>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800">Document saved.</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save document"}
      </Button>
    </form>
  );
}
