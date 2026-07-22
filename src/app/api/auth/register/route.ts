import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/server/services/audit";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(10).max(128),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid name, email, and password (10+ characters)." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const homeownerRole = await prisma.role.findUnique({
    where: { name: "HOMEOWNER" },
  });

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
      emailVerified: null,
      profile: {
        create: {
          displayName: parsed.data.name,
        },
      },
      roles: homeownerRole
        ? {
            create: {
              roleId: homeownerRole.id,
            },
          }
        : undefined,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "user.registered",
    entityType: "User",
    entityId: user.id,
    metadata: { email },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
