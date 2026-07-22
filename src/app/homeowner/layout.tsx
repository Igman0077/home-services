import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth-guards";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/homeowner/dashboard", label: "Overview" },
  { href: "/homeowner/properties", label: "Properties" },
  { href: "/homeowner/tasks", label: "Tasks" },
  { href: "/homeowner/appliances", label: "Appliances" },
  { href: "/homeowner/documents", label: "Documents" },
  { href: "/homeowner/favorites", label: "Saved businesses" },
];

export default async function HomeownerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireHomeownerSession();
  } catch (error) {
    if (error instanceof AuthError) redirect("/login");
    throw error;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Homeowner
          </p>
          <h1 className="font-display text-2xl font-semibold text-primary">
            My home
          </h1>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">
          Private tools for your properties — not shown on public business
          listings.
        </p>
      </aside>
      <div>{children}</div>
    </div>
  );
}
