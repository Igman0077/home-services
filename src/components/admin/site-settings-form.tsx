"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateSiteSettingsAction,
  type ActionResult,
} from "@/server/actions/admin";

const initial: ActionResult = { ok: false };

type Props = {
  siteName: string;
  siteTagline: string;
  supportEmail: string;
  reviewsEnabled: boolean;
};

export function SiteSettingsForm({
  siteName,
  siteTagline,
  supportEmail,
  reviewsEnabled,
}: Props) {
  const [state, action, pending] = useActionState(
    updateSiteSettingsAction,
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="siteName">Site name</Label>
        <Input
          id="siteName"
          name="siteName"
          defaultValue={siteName}
          required
        />
        <p className="text-xs text-muted-foreground">
          Configurable branding — change without editing code.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="siteTagline">Tagline</Label>
        <Input
          id="siteTagline"
          name="siteTagline"
          defaultValue={siteTagline}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="supportEmail">Support email</Label>
        <Input
          id="supportEmail"
          name="supportEmail"
          type="email"
          defaultValue={supportEmail}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reviewsEnabled">Reviews enabled</Label>
        <select
          id="reviewsEnabled"
          name="reviewsEnabled"
          defaultValue={reviewsEnabled ? "true" : "false"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="false">Off (recommended for launch)</option>
          <option value="true">On</option>
        </select>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800" role="status">
          Settings saved.
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
