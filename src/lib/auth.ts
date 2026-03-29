import { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { CustomPrismaAdapter } from "@/lib/auth-adapter";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import { verifyPassword } from "@/lib/password";
import type { UserRole } from "@/generated/prisma/client";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  adapter: CustomPrismaAdapter(),
  providers: [
    KakaoProvider({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    }),
    NaverProvider({
      clientId: process.env.AUTH_NAVER_ID!,
      clientSecret: process.env.AUTH_NAVER_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "이메일",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            emailVerified: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        const isValid = await verifyPassword(credentials.password, user.password);
        if (!isValid) {
          throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
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
    async signIn({ user, account }) {
      // 소셜 로그인 시 동일 이메일 계정 충돌 처리
      if (account?.provider && account.provider !== "credentials") {
        if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: { select: { provider: true } } },
          });

          if (existingUser) {
            // 이미 해당 소셜 계정으로 연결된 경우 → 정상 로그인
            const alreadyLinked = existingUser.accounts.some(
              (a) => a.provider === account.provider
            );
            if (alreadyLinked) return true;

            // 다른 방식으로 가입된 이메일 → 자동 연결 차단 (보안)
            const existingProviders = existingUser.accounts.map((a) => a.provider);
            const methodLabel = existingUser.password
              ? "이메일/비밀번호"
              : existingProviders.join(", ") || "다른 방법";
            return `/login?error=OAuthAccountNotLinked&method=${encodeURIComponent(methodLabel)}`;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: (user?.id || token.id) as string },
          select: {
            id: true,
            role: true,
            phone: true,
            roleSelectedAt: true,
            businessVerification: { select: { verified: true } }
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.phone = dbUser.phone;
          token.roleSelected = !!dbUser.roleSelectedAt;
          token.verified = dbUser.businessVerification?.verified ?? false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.phone = (token.phone as string) || null;
        session.user.roleSelected = (token.roleSelected as boolean) ?? false;
        session.user.verified = (token.verified as boolean) ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
