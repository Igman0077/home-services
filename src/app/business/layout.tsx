import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError, requireSession } from "@/lib/auth-guards";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/business/dashboard", label: "Overview" },
  { href: "/business/leads", label: "Leads" },
  { href: "/business/profile", label: "Profile" },
  { href: "/business/preferences", label: "Lead preferences" },
  { href: "/business/analytics", label: "Analytics" },
  { href: "/business/plans", label: "Plan" },
  { href: "/business/onboard", label: "Add business" },
];

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    if (error instanceof AuthError) redirect("/login");
    throw error;
  }

  const isAdmin =
    hasPermission(session.user.permissions, "businesses.manage") ||
    hasPermission(session.user.permissions, "leads.manage");
  const memberships = await prisma.businessMember.findMany({
    where: { userId: session.user.id },
    include: { business: { select: { name: true, slug: true } } },
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Business
          </p>
          <h1 className="font-display text-2xl font-semibold text-primary">
            Dashboard
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
        {memberships.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {memberships.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/businesses/${m.business.slug}`}
                  className="hover:text-foreground"
                >
                  {m.business.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            {isAdmin
              ? "Admin access — claim or create a business to manage as an owner."
              : "No linked businesses yet. Claim an existing listing or create a new profile."}
          </p>
        )}
      </aside>
      <div>{children}</div>
    </div>
  );
}
