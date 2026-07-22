import { Badge } from "@/components/ui/badge";

export default function RequestQuotePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge variant="warning">Phase 3</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
        Request a quote
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The multi-step quote form, spam controls, consent logging, and lead
        routing engine are scheduled for Phase 3. This page is intentionally not
        collecting leads yet.
      </p>
    </div>
  );
}
