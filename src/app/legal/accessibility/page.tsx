export default function LegalAccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
        Draft — attorney / accessibility review recommended
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-primary">
        Accessibility statement
      </h1>
      <p className="mt-4 text-muted-foreground">
        We aim to meet WCAG 2.2 AA practices. This statement is draft language
        and should be reviewed before production publication. Contact support to
        report accessibility barriers.
      </p>
    </div>
  );
}
