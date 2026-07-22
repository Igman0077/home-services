import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function RequestQuotePage({ searchParams }: Props) {
  const params = await searchParams;
  const service = first(params.service);
  const location = first(params.location);
  const business = first(params.business);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge variant="warning">Phase 3</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
        Request a quote
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The multi-step quote form, spam controls, consent logging, and lead
        routing engine ship in Phase 3. This page is intentionally not collecting
        leads yet.
      </p>
      {(service || location || business) && (
        <div className="mt-6 rounded-lg border border-border bg-card p-4 text-sm">
          <p className="font-medium">Prefill context (saved for Phase 3)</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {service ? <li>Service: {service}</li> : null}
            {location ? <li>Location: {location}</li> : null}
            {business ? <li>Business: {business}</li> : null}
          </ul>
        </div>
      )}
      <Button asChild variant="outline" className="mt-8">
        <Link href="/businesses">Browse businesses instead</Link>
      </Button>
    </div>
  );
}
