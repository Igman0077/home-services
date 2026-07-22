"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  acceptLeadAssignmentAction,
  declineLeadAssignmentAction,
  updateLeadAssignmentStatusAction,
} from "@/server/actions/business-leads";

export function BusinessLeadActions({
  assignmentId,
  status,
}: {
  assignmentId: string;
  status: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    const result = await fn();
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {status === "ASSIGNED" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={pending}
            onClick={() => void run(() => acceptLeadAssignmentAction(assignmentId))}
          >
            Accept lead
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => void run(() => declineLeadAssignmentAction(assignmentId))}
          >
            Decline
          </Button>
        </div>
      ) : null}

      {(status === "ACCEPTED" ||
        status === "CONTACTED" ||
        status === "APPOINTMENT_SCHEDULED") && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              void run(() =>
                updateLeadAssignmentStatusAction(assignmentId, "CONTACTED"),
              )
            }
          >
            Mark contacted
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              void run(() =>
                updateLeadAssignmentStatusAction(
                  assignmentId,
                  "APPOINTMENT_SCHEDULED",
                ),
              )
            }
          >
            Appointment set
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() =>
              void run(() =>
                updateLeadAssignmentStatusAction(assignmentId, "WON"),
              )
            }
          >
            Won
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              void run(() =>
                updateLeadAssignmentStatusAction(assignmentId, "LOST"),
              )
            }
          >
            Lost
          </Button>
        </div>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
