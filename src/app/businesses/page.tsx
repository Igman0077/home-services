import { Badge } from "@/components/ui/badge";

type StubProps = {
  title: string;
  description: string;
  phase: string;
};

function PhaseStub({ title, description, phase }: StubProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge variant="warning">{phase}</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
        {title}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      <p className="mt-6 rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
        This route is reserved and intentionally unavailable until its phase is
        implemented. No fake controls are shown.
      </p>
    </div>
  );
}

export default function BusinessesPage() {
  return (
    <PhaseStub
      title="Business directory"
      description="Business profiles, search, and filtering ship in Phase 2."
      phase="Phase 2"
    />
  );
}
