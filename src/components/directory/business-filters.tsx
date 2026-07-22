"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { slug: string; name: string };

export function BusinessFilters({
  services,
  locations,
}: {
  services: Option[];
  locations: Option[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of [
      "q",
      "service",
      "location",
      "emergency",
      "freeEstimate",
      "financing",
      "verified",
    ]) {
      const value = String(form.get(key) ?? "").trim();
      if (value && value !== "false") next.set(key, value === "on" ? "1" : value);
    }
    const qs = next.toString();
    router.push(qs ? `/businesses?${qs}` : "/businesses");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-4"
    >
      <h2 className="font-semibold">Filter</h2>
      <div className="space-y-2">
        <Label htmlFor="q">Keyword</Label>
        <Input id="q" name="q" defaultValue={params.get("q") ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="service">Service</Label>
        <select
          id="service"
          name="service"
          defaultValue={params.get("service") ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Any</option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <select
          id="location"
          name="location"
          defaultValue={params.get("location") ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Any</option>
          {locations.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Options</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="emergency"
            defaultChecked={params.get("emergency") === "1"}
          />
          Emergency availability
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="freeEstimate"
            defaultChecked={params.get("freeEstimate") === "1"}
          />
          Free estimates
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="financing"
            defaultChecked={params.get("financing") === "1"}
          />
          Financing available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="verified"
            defaultChecked={params.get("verified") === "1"}
          />
          Verified only
        </label>
      </fieldset>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/businesses")}>
          Reset
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Filter results use <code>noindex</code> query URLs to avoid index bloat.
      </p>
    </form>
  );
}
