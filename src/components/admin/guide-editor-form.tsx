"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createGuideAction,
  updateGuideAction,
  type ContentActionResult,
} from "@/server/actions/content-guides";

const initial: ContentActionResult = { ok: false };

type GuideFields = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  sectionsJson?: string;
  seoTitle: string | null;
  seoDescription: string | null;
  authorName: string | null;
};

export function GuideEditorForm({ guide }: { guide?: GuideFields }) {
  const action = guide ? updateGuideAction : createGuideAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {guide?.id ? <input type="hidden" name="guideId" value={guide.id} /> : null}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={guide?.title ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={guide?.slug ?? ""}
          placeholder="auto from title if blank"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={guide?.excerpt ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <Textarea
          id="body"
          name="body"
          required
          minLength={40}
          rows={8}
          defaultValue={guide?.body ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sectionsJson">Sections JSON (optional)</Label>
        <Textarea
          id="sectionsJson"
          name="sectionsJson"
          rows={4}
          defaultValue={guide?.sectionsJson ?? ""}
          placeholder='[{"heading":"...","body":"..."}]'
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO title</Label>
          <Input id="seoTitle" name="seoTitle" defaultValue={guide?.seoTitle ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="authorName">Author</Label>
          <Input
            id="authorName"
            name="authorName"
            defaultValue={guide?.authorName ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="seoDescription">SEO description</Label>
        <Textarea
          id="seoDescription"
          name="seoDescription"
          rows={2}
          defaultValue={guide?.seoDescription ?? ""}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800">Saved.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : guide ? "Update guide" : "Create draft"}
      </Button>
    </form>
  );
}
