import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { AuthError, requireAdminAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/settings", label: "Site settings" },
  { href: "/admin/audit", label: "Audit log" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdminAccess();
  } catch (error) {
    if (error instanceof AuthError && error.code === "UNAUTHENTICATED") {
      redirect("/login");
    }
    redirect("/");
  }

  const [serviceCount, locationCount, userCount] = await Promise.all([
    prisma.service.count(),
    prisma.location.count(),
    prisma.user.count({ where: { deletedAt: null } }),
  ]);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Administration
          </p>
          <h1 className="font-display text-2xl font-semibold text-primary">
            Admin
          </h1>
        </div>
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 rounded-lg border border-border bg-card p-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Services</span>
            <Badge variant="secondary">{serviceCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Locations</span>
            <Badge variant="secondary">{locationCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Users</span>
            <Badge variant="secondary">{userCount}</Badge>
          </div>
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
