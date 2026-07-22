import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { verificationLabel } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Business, VerificationStatus } from "@prisma/client";

type BusinessCardProps = {
  business: Pick<
    Business,
    | "name"
    | "slug"
    | "description"
    | "city"
    | "stateCode"
    | "verificationStatus"
    | "offersEmergency"
    | "offersFreeEstimate"
    | "isFeatured"
    | "isSponsored"
    | "isSampleData"
    | "claimStatus"
  >;
  className?: string;
};

export function BusinessCard({ business, className }: BusinessCardProps) {
  const verification = verificationLabel(
    business.verificationStatus as VerificationStatus,
  );

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border border-border bg-card p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">
          <Link
            href={`/businesses/${business.slug}`}
            className="hover:text-accent"
          >
            {business.name}
          </Link>
        </h3>
        <div className="flex flex-wrap gap-1">
          {business.isSponsored ? (
            <Badge variant="warning">Sponsored</Badge>
          ) : null}
          {business.isFeatured ? (
            <Badge variant="secondary">Featured</Badge>
          ) : null}
          {business.isSampleData ? (
            <Badge variant="outline">Sample data</Badge>
          ) : null}
        </div>
      </div>

      {(business.city || business.stateCode) && (
        <p className="mt-1 text-sm text-muted-foreground">
          {[business.city, business.stateCode].filter(Boolean).join(", ")}
        </p>
      )}

      {business.description ? (
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
          {business.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1">
        <Badge variant={verification.tone}>{verification.label}</Badge>
        {business.offersEmergency ? (
          <Badge variant="outline">Emergency</Badge>
        ) : null}
        {business.offersFreeEstimate ? (
          <Badge variant="outline">Free estimates</Badge>
        ) : null}
      </div>
    </article>
  );
}
