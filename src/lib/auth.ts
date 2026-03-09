import { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import type { UserRole } from "@/generated/prisma/client";

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.AUTH_SECRET,
  // adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],  // temporarily disabled for testing
  providers: [
    KakaoProvider({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    NaverProvider({
      clientId: process.env.AUTH_NAVER_ID!,
      clientSecret: process.env.AUTH_NAVER_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  events: {
    createUser: async ({ user }) => {
      // 회원가입 시 환영 이메일 전송 (비차단)
      if (user.email) {
        (async () => {
          try {
            const { subject, html } = welcomeEmail(user.name || "회원");
            await sendEmail(user.email!, subject, html);
          } catch (error) {
            console.error("[Email] Failed to send welcome email:", error);
          }
        })();
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, phone: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.phone = dbUser.phone;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.phone = (token.phone as string) || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
