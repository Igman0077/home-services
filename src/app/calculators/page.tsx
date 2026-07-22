import type { Metadata } from "next";
import Link from "next/link";

import { listPublishedCalculators } from "@/server/services/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cost calculators",
  description:
    "Educational home-service cost range estimators for Northern New York. Estimates are not contractor quotes.",
  alternates: { canonical: "/calculators" },
};

export default async function CalculatorsPage() {
  const calculators = await listPublishedCalculators();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-primary">
        Cost calculators
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Coarse ranges to help plan conversations with contractors. Results are
        estimates — never professional advice or bids.
      </p>

      {calculators.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No published calculators yet.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {calculators.map((calc) => (
            <li
              key={calc.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <h2 className="text-xl font-semibold">
                <Link
                  href={`/calculators/${calc.slug}`}
                  className="hover:text-accent"
                >
                  {calc.name}
                </Link>
              </h2>
              {calc.description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {calc.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
