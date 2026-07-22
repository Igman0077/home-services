import { Badge } from "@/components/ui/badge";

export default function CalculatorsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge variant="warning">Phase 2 / 5</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
        Cost calculators
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Estimators (starting with roof replacement) will live here. Results will
        always be labeled as estimates, not professional advice.
      </p>
    </div>
  );
}
