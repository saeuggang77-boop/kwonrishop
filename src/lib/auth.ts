import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    KakaoProvider({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    }),
    NaverProvider({
      clientId: process.env.AUTH_NAVER_ID!,
      clientSecret: process.env.AUTH_NAVER_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
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
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, phone: true },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role;
          session.user.phone = dbUser.phone;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
