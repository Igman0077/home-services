"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { slug: string; name: string };

type DirectorySearchFormProps = {
  services: Option[];
  locations: Option[];
  defaultService?: string;
  defaultLocation?: string;
  defaultQuery?: string;
  actionPath?: string;
};

export function DirectorySearchForm({
  services,
  locations,
  defaultService = "",
  defaultLocation = "",
  defaultQuery = "",
  actionPath = "/businesses",
}: DirectorySearchFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const q = String(form.get("q") ?? "").trim();
    const service = String(form.get("service") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();
    if (q) params.set("q", q);
    if (service) params.set("service", service);
    if (location) params.set("location", location);
    const qs = params.toString();
    router.push(qs ? `${actionPath}?${qs}` : actionPath);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur sm:grid-cols-[1fr_1fr_1fr_auto]"
      role="search"
      aria-label="Find home service professionals"
    >
      <div className="space-y-1.5">
        <Label htmlFor="service" className="text-white/90">
          Service
        </Label>
        <select
          id="service"
          name="service"
          defaultValue={defaultService}
          className="flex h-10 w-full rounded-md border border-white/30 bg-white px-3 text-sm text-foreground"
        >
          <option value="">All services</option>
          {services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-white/90">
          Location
        </Label>
        <select
          id="location"
          name="location"
          defaultValue={defaultLocation}
          className="flex h-10 w-full rounded-md border border-white/30 bg-white px-3 text-sm text-foreground"
        >
          <option value="">All locations</option>
          {locations.map((location) => (
            <option key={location.slug} value={location.slug}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="q" className="text-white/90">
          Keyword
        </Label>
        <Input
          id="q"
          name="q"
          defaultValue={defaultQuery}
          placeholder="Business name…"
          className="border-white/30 bg-white text-foreground"
        />
      </div>
      <div className="flex items-end">
        <Button
          type="submit"
          disabled={pending}
          className="h-10 w-full bg-white text-primary hover:bg-white/90"
        >
          {pending ? "Searching…" : "Search"}
        </Button>
      </div>
    </form>
  );
}
