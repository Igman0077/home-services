import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { requireSession, AuthError } from "@/lib/auth-guards";

export default async function HomeownerDashboardPage() {
  try {
    await requireSession();
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge variant="warning">Phase 5</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
        Homeowner dashboard
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Properties, maintenance tasks, appliances, warranties, and the document
        vault arrive in Phase 5. You are signed in; tools are not available yet.
      </p>
    </div>
  );
}
