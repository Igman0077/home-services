"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUsdFromCents } from "@/lib/calculators/roof";
import {
  runRoofCalculatorAction,
  type CalculatorActionResult,
} from "@/server/actions/calculators";

const initial: CalculatorActionResult = { ok: false };

export function RoofCalculatorForm({
  disclaimer,
}: {
  disclaimer: string;
}) {
  const [state, action, pending] = useActionState(
    runRoofCalculatorAction,
    initial,
  );

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="squares">Roof size (squares)</Label>
          <Input
            id="squares"
            name="squares"
            type="number"
            min={5}
            max={80}
            defaultValue={20}
            required
          />
          <p className="text-xs text-muted-foreground">
            One square ≈ 100 sq ft of roof surface. Typical homes are often
            15–30 squares.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pitch">Pitch / complexity</Label>
            <select
              id="pitch"
              name="pitch"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="medium"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="steep">Steep / complex</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <select
              id="material"
              name="material"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="asphalt"
            >
              <option value="asphalt">Asphalt shingle</option>
              <option value="metal">Metal</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="save">Save this estimate to your account?</Label>
          <select
            id="save"
            name="save"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="false"
          >
            <option value="false">No — just show the range</option>
            <option value="true">Yes — save anonymized inputs/results</option>
          </select>
        </div>
        <input type="hidden" name="consent" value="true" />
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Calculating…" : "Show estimate range"}
        </Button>
      </form>

      {state.ok && state.lowCents != null && state.highCents != null ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Estimated range
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-primary">
            {formatUsdFromCents(state.lowCents)} –{" "}
            {formatUsdFromCents(state.highCents)}
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {(state.assumptions ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            {state.disclaimer ?? disclaimer}
          </p>
        </div>
      ) : null}
    </div>
  );
}
