import Link from "next/link";

type SiteFooterProps = {
  siteName: string;
};

export function SiteFooter({ siteName }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-semibold">{siteName}</p>
          <p className="mt-3 max-w-md text-sm text-primary-foreground/80">
            A regional home services directory helping homeowners find local
            professionals across Northern New York — expanding statewide over
            time.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/70">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="hover:underline" href="/services">
                Services
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/locations">
                Locations
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/businesses">
                Businesses
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/guides">
                Guides
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/70">
            Company
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="hover:underline" href="/legal/privacy">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/legal/terms">
                Terms of use
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/legal/accessibility">
                Accessibility
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/for-contractors">
                For contractors
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-primary-foreground/70 sm:px-6">
          © {year} {siteName}. Draft legal pages require attorney review before
          production use.
        </p>
      </div>
    </footer>
  );
}
