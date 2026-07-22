import Link from "next/link";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For contractors",
  description:
    "Claim your business listing, manage leads, set service areas, and request verification on North Country Home Services.",
  alternates: { canonical: "/for-contractors" },
};

const steps = [
  {
    title: "Create an account",
    body: "Register with a work email so we can reach you about claims and lead offers.",
  },
  {
    title: "Claim or create a listing",
    body: "Claim an existing directory profile with ownership evidence, or create a new profile for administrator review before it goes public.",
  },
  {
    title: "Complete your profile",
    body: "Add services, towns you actually serve, hours, and lead preferences. Completeness affects routing eligibility.",
  },
  {
    title: "Receive and manage leads",
    body: "Accept offers in your dashboard. Contact details stay masked until you accept — no cold spam of homeowner info.",
  },
];

export default function ForContractorsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge variant="secondary">Contractors</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
        Grow with local homeowners
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Claim your profile, control where you work, and respond to quote
        requests from Northern New York — with clear verification and no
        invented ratings.
      </p>

      <ol className="mt-10 space-y-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <div>
              <h2 className="font-semibold text-foreground">{step.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/business/onboard">Create a business</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/businesses">Browse listings to claim</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/business/dashboard">Business dashboard</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/business/plans">View plans</Link>
        </Button>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Paid upgrades and Stripe billing arrive in a later phase. Plan
        entitlements are already modeled so featured placement stays honest.
      </p>
    </div>
  );
}
