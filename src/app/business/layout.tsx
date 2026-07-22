import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError, requireSession } from "@/lib/auth-guards";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  const isAdmin = hasPermission(session.user.permissions, "leads.manage");
  const memberships = await prisma.businessMember.findMany({
    where: { userId: session.user.id },
    include: { business: { select: { name: true, slug: true } } },
  });

  if (!isAdmin && memberships.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-primary">
          Business dashboard
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your account is not linked to a business profile yet. Claiming and
          onboarding continue in Phase 4. Administrators can still manage leads
          in admin.
        </p>
        <Link href="/" className="mt-6 inline-block text-accent hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[200px_1fr]">
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
          <Link
            href="/business/dashboard"
            className="rounded-md px-3 py-2 hover:bg-muted"
          >
            Overview
          </Link>
          <Link
            href="/business/leads"
            className="rounded-md px-3 py-2 hover:bg-muted"
          >
            Leads
          </Link>
        </nav>
        {memberships.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {memberships.map((m) => (
              <li key={m.id}>{m.business.name}</li>
            ))}
          </ul>
        ) : null}
      </aside>
      <div>{children}</div>
    </div>
  );
}
