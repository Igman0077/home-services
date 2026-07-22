import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RoofCalculatorForm } from "@/components/calculators/roof-calculator-form";
import { Breadcrumbs } from "@/components/seo/structured-data";
import { Button } from "@/components/ui/button";
import { getPublishedCalculator } from "@/server/services/content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const calculator = await getPublishedCalculator(slug);
  if (!calculator) return { title: "Calculator not found" };
  return {
    title: calculator.seoTitle || calculator.name,
    description: calculator.seoDescription || calculator.description || undefined,
    alternates: { canonical: `/calculators/${calculator.slug}` },
  };
}

export default async function CalculatorDetailPage({ params }: Props) {
  const { slug } = await params;
  const calculator = await getPublishedCalculator(slug);
  if (!calculator) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Calculators", href: "/calculators" },
          { name: calculator.name },
        ]}
      />
      <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
        {calculator.name}
      </h1>
      {calculator.description ? (
        <p className="mt-4 text-lg text-muted-foreground">
          {calculator.description}
        </p>
      ) : null}

      <div className="mt-8 rounded-lg border border-border bg-card p-5">
        {calculator.slug === "roof-replacement" ? (
          <RoofCalculatorForm
            disclaimer={
              calculator.disclaimer ??
              "Estimate only — not a quote or professional recommendation."
            }
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            This calculator type is not wired in the UI yet.
          </p>
        )}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {calculator.disclaimer}
      </p>

      <Button asChild className="mt-8">
        <Link href="/request-a-quote?service=roofing">
          Request local roofing quotes
        </Link>
      </Button>
    </div>
  );
}
