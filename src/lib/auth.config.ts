import type { NextAuthConfig } from "next-auth";
import type { UserRole, AccountStatus, SubscriptionTier } from "@prisma/client";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export default {
  providers: [
    Kakao({
      clientId: (process.env.AUTH_KAKAO_ID ?? "").trim(),
      clientSecret: (process.env.AUTH_KAKAO_SECRET ?? "").trim(),
    }),
    Naver({
      clientId: (process.env.AUTH_NAVER_ID ?? "").trim(),
      clientSecret: (process.env.AUTH_NAVER_SECRET ?? "").trim(),
    }),
    Google({
      clientId: (process.env.AUTH_GOOGLE_ID ?? "").trim(),
      clientSecret: (process.env.AUTH_GOOGLE_SECRET ?? "").trim(),
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      // authorize is defined in auth.ts where Prisma is available
      authorize: () => null,
    }),
  ],
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.accountStatus = token.accountStatus as AccountStatus;
        session.user.subscriptionTier = token.subscriptionTier as SubscriptionTier;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
