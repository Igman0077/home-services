import Link from "next/link";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

type SiteHeaderProps = {
  siteName: string;
};

const navItems = [
  { href: "/services", label: "Services" },
  { href: "/locations", label: "Locations" },
  { href: "/businesses", label: "Businesses" },
  { href: "/guides", label: "Guides" },
  { href: "/calculators", label: "Calculators" },
];

export async function SiteHeader({ siteName }: SiteHeaderProps) {
  const session = await auth();
  const canAccessAdmin =
    session?.user && hasPermission(session.user.permissions, "admin.access");

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-primary sm:text-2xl"
        >
          {siteName}
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/request-a-quote">Request a quote</Link>
          </Button>
          {session?.user ? (
            <>
              {canAccessAdmin ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="sm">
                <Link href="/business/leads">Business</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/homeowner/dashboard">Account</Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
