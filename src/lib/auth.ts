import { PrismaAdapter } from "@auth/prisma-adapter";
import type { RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/db";
import { ROLE_PERMISSION_MAP, type PermissionKey } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      roles: RoleName[];
      permissions: PermissionKey[];
    };
  }

  interface User {
    roles?: RoleName[];
    permissions?: PermissionKey[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    roles?: RoleName[];
    permissions?: PermissionKey[];
  }
}

async function loadUserAccess(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  const roles = userRoles.map((ur) => ur.role.name);
  const permissionSet = new Set<PermissionKey>();

  for (const ur of userRoles) {
    for (const key of ROLE_PERMISSION_MAP[ur.role.name]) {
      permissionSet.add(key);
    }
    for (const rp of ur.role.permissions) {
      permissionSet.add(rp.permission.key as PermissionKey);
    }
  }

  return {
    roles,
    permissions: Array.from(permissionSet),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.toLowerCase().trim()
            : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: { email, deletedAt: null },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        const access = await loadUserAccess(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles: access.roles,
          permissions: access.permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        const access = user.roles
          ? {
              roles: user.roles,
              permissions: user.permissions ?? [],
            }
          : await loadUserAccess(user.id);
        token.roles = access.roles;
        token.permissions = access.permissions;
      } else if (
        typeof token.id === "string" &&
        (!token.roles || !token.permissions)
      ) {
        const access = await loadUserAccess(token.id);
        token.roles = access.roles;
        token.permissions = access.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
        session.user.roles = token.roles ?? [];
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },
});
