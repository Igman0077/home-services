import Link from "next/link";

import {
  EditAreasForm,
  EditBusinessProfileForm,
  EditHoursForm,
  EditServicesForm,
  RequestVerificationForm,
} from "@/components/business/profile-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { resolveManagedBusiness } from "@/server/services/business-context";

export const dynamic = "force-dynamic";

export default async function BusinessProfilePage() {
  const session = await requireSession();
  const business = await resolveManagedBusiness(session.user.id);

  if (!business) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-3xl font-semibold text-primary">
          Profile
        </h2>
        <p className="text-muted-foreground">
          Link a business first to edit profile details.
        </p>
        <Button asChild>
          <Link href="/business/onboard">Create or claim a business</Link>
        </Button>
      </div>
    );
  }

  const [services, cities] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.location.findMany({
      where: { type: "CITY", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-3xl font-semibold text-primary">
          Edit profile
        </h2>
        <Badge variant="outline">{business.publishStatus}</Badge>
        <Badge variant="secondary">{business.verificationStatus}</Badge>
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Basic information</h3>
        <div className="mt-4">
          <EditBusinessProfileForm business={business} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Services</h3>
        <div className="mt-4">
          <EditServicesForm
            businessId={business.id}
            allServices={services}
            selectedIds={business.services.map((s) => s.serviceId)}
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Service areas</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Only list towns you actually serve. Distance is not invented for broad
          service-area listings.
        </p>
        <div className="mt-4">
          <EditAreasForm
            businessId={business.id}
            allLocations={cities}
            selectedIds={business.serviceAreas.map((a) => a.locationId)}
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Hours</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Use 24-hour times (e.g. 09:00). Leave blank days you do not want listed.
        </p>
        <div className="mt-4">
          <EditHoursForm businessId={business.id} hours={business.hours} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Request verification</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Verification is reviewed by administrators. Do not claim licenses or
          insurance are platform-confirmed until status says so.
        </p>
        <div className="mt-4">
          <RequestVerificationForm businessId={business.id} />
        </div>
      </section>
    </div>
  );
}
