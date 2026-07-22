import Link from "next/link";

export default function LegalPrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
        Draft — attorney review required
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-primary">
        Privacy policy
      </h1>
      <p className="mt-4 text-muted-foreground">
        This is placeholder draft language for development. It does not claim
        legal compliance. Replace with counsel-reviewed content before
        production.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        Related:{" "}
        <Link href="/legal/terms" className="text-accent hover:underline">
          Terms of use
        </Link>
      </p>
    </div>
  );
}
