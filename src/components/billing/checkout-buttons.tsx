"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  assignFreePlanAction,
  openBillingPortalAction,
  startPlanCheckoutAction,
} from "@/server/actions/billing";

export function CheckoutButton({
  planId,
  label,
  variant = "default",
}: {
  planId: string;
  label: string;
  variant?: "default" | "outline" | "secondary";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await startPlanCheckoutAction(planId);
        });
      }}
    >
      {pending ? "Starting…" : label}
    </Button>
  );
}

export function BillingPortalButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await openBillingPortalAction();
        });
      }}
    >
      {pending ? "Opening…" : "Manage billing"}
    </Button>
  );
}

export function AssignFreePlanButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await assignFreePlanAction();
        });
      }}
    >
      {pending ? "Saving…" : "Switch to Free"}
    </Button>
  );
}
