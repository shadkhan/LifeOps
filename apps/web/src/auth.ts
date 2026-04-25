import { db } from "@lifeops/db";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const identifier = parsed.data.identifier.trim().toLowerCase();
        await ensureAdminTestUser(identifier);

        const user = await db.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }],
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.username ?? user.email,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});

async function ensureAdminTestUser(identifier: string) {
  if (identifier !== "admin" && identifier !== "admin@lifeops.local") {
    return;
  }

  const existing = await db.user.findFirst({
    where: {
      OR: [{ username: "admin" }, { email: "admin@lifeops.local" }],
    },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await db.user.create({
    data: {
      email: "admin@lifeops.local",
      username: "admin",
      name: "Admin",
      passwordHash: await bcrypt.hash("password123", 12),
    },
  });
}
