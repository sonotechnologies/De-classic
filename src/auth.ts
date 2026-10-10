import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/db";
import { users, type Role } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      branchId: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
    branchId?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
    branchId?: string | null;
  }
}

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

class LockedError extends CredentialsSignin {
  code = "locked";
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 12 * 60 * 60, updateAge: 60 * 60 },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user || !user.isActive) {
          // Spend similar time as a real check so response timing does not reveal which emails exist.
          await bcrypt.compare(password, "$2b$12$3/hUU3aomWQ/Nc2b.q5Es.7MZQqsXxloA2aa6BT6CHALDbiG1tFLC");
          return null;
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) throw new LockedError();
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          const failed = user.failedLogins + 1;
          await db
            .update(users)
            .set({
              failedLogins: failed >= MAX_FAILED ? 0 : failed,
              lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
            })
            .where(eq(users.id, user.id));
          return null;
        }
        await db.update(users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(users.id, user.id));
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.branchId = user.branchId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) {
        session.user.id = token.uid;
        session.user.role = token.role as Role;
        session.user.branchId = token.branchId ?? null;
      }
      return session;
    },
  },
});
