import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ForContractorsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge variant="warning">Phase 4</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
        For contractors
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Business onboarding, profile claiming, verification, and lead preferences
        ship in Phase 4.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        You can already{" "}
        <Link href="/register" className="text-accent underline-offset-2 hover:underline">
          create an account
        </Link>
        ; contractor tools unlock after Phase 4.
      </p>
    </div>
  );
}
