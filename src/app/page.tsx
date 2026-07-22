import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getPublicSiteConfig } from "@/server/services/site-settings";

export default async function HomePage() {
  const site = await getPublicSiteConfig();

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.12), transparent 35%)",
          }}
        />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
          <p className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            {site.name}
          </p>
          <h1 className="mt-4 max-w-2xl text-xl font-medium text-white/90 sm:text-2xl">
            Local home service pros for Northern New York
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
            {site.tagline}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link href="/services">Browse services</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/request-a-quote">Request a quote</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-primary">
          How it works
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Search by service and town, compare local businesses, and request
          estimates — without thin doorway pages or unverified claims.
        </p>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Find a service",
              body: "Browse roofing, plumbing, HVAC, electrical, tree removal, and more.",
            },
            {
              step: "2",
              title: "Compare local pros",
              body: "Review profiles with clear verification labels and service areas.",
            },
            {
              step: "3",
              title: "Request estimates",
              body: "Submit one quote request and we route it to matching businesses.",
            },
          ].map((item) => (
            <li key={item.step}>
              <p className="text-sm font-semibold text-accent">Step {item.step}</p>
              <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-primary">
              Built for trust
            </h2>
            <p className="mt-3 text-muted-foreground">
              We do not invent ratings, reviews, licenses, or testimonials. Sample
              development data is labeled. Sponsored placements will be marked
              clearly when enabled.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold text-primary">
              For contractors
            </h2>
            <p className="mt-3 text-muted-foreground">
              Claim your profile, manage service areas, and receive qualified
              leads when your plan allows.
            </p>
            <Button asChild className="mt-5">
              <Link href="/for-contractors">Learn about contractor accounts</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
