import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";
import type { UserRole, AccountStatus, SubscriptionTier } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      accountStatus: AccountStatus;
      subscriptionTier: SubscriptionTier;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    // Keep OAuth providers from config
    ...authConfig.providers.filter((p) => p.type !== "credentials"),
    // Override Credentials with full authorize function (needs Prisma)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, accountStatus: true, subscriptionTier: true },
        });
        token.role = dbUser?.role ?? "BUYER";
        token.accountStatus = dbUser?.accountStatus ?? "ACTIVE";
        token.subscriptionTier = dbUser?.subscriptionTier ?? "FREE";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.accountStatus = token.accountStatus as AccountStatus;
        session.user.subscriptionTier = token.subscriptionTier as SubscriptionTier;
      }
      return session;
    },
    async signIn({ user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { accountStatus: true },
      });
      if (dbUser?.accountStatus === "SUSPENDED") return false;
      return true;
    },
  },
});
