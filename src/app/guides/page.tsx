import { Badge } from "@/components/ui/badge";

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge variant="warning">Phase 2 / 6</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
        Guides
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Editorial home-maintenance and cost guides will publish here after CMS
        workflows are in place.
      </p>
    </div>
  );
}
