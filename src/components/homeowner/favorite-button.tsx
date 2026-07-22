"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toggleFavoriteBusinessAction } from "@/server/actions/homeowner-favorites";

export function FavoriteBusinessButton({
  businessId,
  isFavorited,
  isSignedIn,
}: {
  businessId: string;
  isFavorited: boolean;
  isSignedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!isSignedIn) return null;

  return (
    <Button
      type="button"
      variant={isFavorited ? "secondary" : "outline"}
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await toggleFavoriteBusinessAction(businessId);
        });
      }}
    >
      {pending ? "…" : isFavorited ? "Saved" : "Save business"}
    </Button>
  );
}
