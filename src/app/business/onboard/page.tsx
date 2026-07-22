import { CreateBusinessForm } from "@/components/business/create-business-form";
import { requireSession } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function BusinessOnboardPage() {
  await requireSession();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Create a business profile
        </h2>
        <p className="mt-2 text-muted-foreground">
          New profiles start in pending review and are not shown publicly until an
          administrator publishes them. To take over an existing listing, open
          that profile and choose Claim this business.
        </p>
      </div>
      <div className="max-w-xl rounded-lg border border-border bg-card p-5">
        <CreateBusinessForm />
      </div>
    </div>
  );
}
