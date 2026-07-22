import Link from "next/link";

import { LeadPreferencesForm } from "@/components/business/lead-preferences-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth-guards";
import { resolveManagedBusiness } from "@/server/services/business-context";

export const dynamic = "force-dynamic";

export default async function BusinessPreferencesPage() {
  const session = await requireSession();
  const business = await resolveManagedBusiness(session.user.id);

  if (!business) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-3xl font-semibold text-primary">
          Lead preferences
        </h2>
        <Button asChild>
          <Link href="/business/onboard">Link a business first</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Lead preferences
        </h2>
        <p className="mt-2 text-muted-foreground">
          Control whether {business.name} receives leads and how you are notified.
        </p>
      </div>
      <div className="max-w-xl rounded-lg border border-border bg-card p-5">
        <LeadPreferencesForm
          businessId={business.id}
          prefs={business.leadPreferences}
        />
      </div>
    </div>
  );
}
