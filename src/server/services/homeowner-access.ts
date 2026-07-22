export type HomeownerActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

export async function ensureHomeownerPermission(userId: string) {
  const { prisma } = await import("@/lib/db");
  const role = await prisma.role.findUnique({ where: { name: "HOMEOWNER" } });
  if (!role) return;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id },
    update: {},
  });
}
