import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "next-auth/adapters"
import { prisma } from "@/lib/prisma"

/**
 * Custom Prisma Adapter for NextAuth v4 compatible with Prisma 7's pg driver adapter
 * Wraps all operations to prevent callback errors with @prisma/adapter-pg
 */
export function CustomPrismaAdapter(): Adapter {
  return {
    async createUser(data: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      try {
        const user = await prisma.user.create({
          data: {
            name: data.name,
            email: data.email,
            emailVerified: data.emailVerified,
            image: data.image,
          },
        })
        return {
          id: user.id,
          name: user.name,
          email: user.email ?? "",
          emailVerified: user.emailVerified,
          image: user.image,
        }
      } catch (error) {
        console.error("[CustomPrismaAdapter] createUser error:", error)
        throw error
      }
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      try {
        const user = await prisma.user.findUnique({
          where: { id },
        })
        if (!user) return null
        return {
          id: user.id,
          name: user.name,
          email: user.email ?? "",
          emailVerified: user.emailVerified,
          image: user.image,
        }
      } catch (error) {
        console.error("[CustomPrismaAdapter] getUser error:", error)
        return null
      }
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        })
        if (!user) return null
        return {
          id: user.id,
          name: user.name,
          email: user.email ?? "",
          emailVerified: user.emailVerified,
          image: user.image,
        }
      } catch (error) {
        console.error("[CustomPrismaAdapter] getUserByEmail error:", error)
        return null
      }
    },

    async getUserByAccount({ providerAccountId, provider }: { provider: string; providerAccountId: string }): Promise<AdapterUser | null> {
      try {
        const account = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId,
            },
          },
          include: { user: true },
        })
        if (!account) return null
        const user = account.user
        return {
          id: user.id,
          name: user.name,
          email: user.email ?? "",
          emailVerified: user.emailVerified,
          image: user.image,
        }
      } catch (error) {
        console.error("[CustomPrismaAdapter] getUserByAccount error:", error)
        return null
      }
    },

    async updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, "id">): Promise<AdapterUser> {
      try {
        const user = await prisma.user.update({
          where: { id: data.id },
          data: {
            name: data.name,
            email: data.email,
            emailVerified: data.emailVerified,
            image: data.image,
          },
        })
        return {
          id: user.id,
          name: user.name,
          email: user.email ?? "",
          emailVerified: user.emailVerified,
          image: user.image,
        }
      } catch (error) {
        console.error("[CustomPrismaAdapter] updateUser error:", error)
        throw error
      }
    },

    async linkAccount(data: AdapterAccount): Promise<AdapterAccount | null | undefined> {
      try {
        await prisma.account.create({
          data: {
            userId: data.userId,
            type: data.type,
            provider: data.provider,
            providerAccountId: data.providerAccountId,
            refresh_token: data.refresh_token,
            access_token: data.access_token,
            expires_at: data.expires_at,
            token_type: data.token_type,
            scope: data.scope,
            id_token: data.id_token,
            session_state: data.session_state,
          },
        })
        return data
      } catch (error) {
        console.error("[CustomPrismaAdapter] linkAccount error:", error)
        throw error
      }
    },

    async unlinkAccount({ providerAccountId, provider }: { provider: string; providerAccountId: string }): Promise<void> {
      try {
        await prisma.account.delete({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId,
            },
          },
        })
      } catch (error) {
        console.error("[CustomPrismaAdapter] unlinkAccount error:", error)
        // Don't throw - account may already be deleted
      }
    },

    async createSession(data: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
      try {
        const session = await prisma.session.create({
          data: {
            sessionToken: data.sessionToken,
            userId: data.userId,
            expires: data.expires,
          },
        })
        return {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        }
      } catch (error) {
        console.error("[CustomPrismaAdapter] createSession error:", error)
        throw error
      }
    },

    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      try {
        const sessionWithUser = await prisma.session.findUnique({
          where: { sessionToken },
          include: { user: true },
        })
        if (!sessionWithUser) return null
        const { user, ...session } = sessionWithUser
        return {
          session: {
            sessionToken: session.sessionToken,
            userId: session.userId,
            expires: session.expires,
          },
          user: {
            id: user.id,
            name: user.name,
            email: user.email ?? "",
            emailVerified: user.emailVerified,
            image: user.image,
          },
        }
      } catch (error) {
        console.error("[CustomPrismaAdapter] getSessionAndUser error:", error)
        return null
      }
    },

    async updateSession(data: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">): Promise<AdapterSession | null | undefined> {
      try {
        const session = await prisma.session.update({
          where: { sessionToken: data.sessionToken },
          data: {
            expires: data.expires,
            userId: data.userId,
          },
        })
        return {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        }
      } catch (error) {
        console.error("[CustomPrismaAdapter] updateSession error:", error)
        throw error
      }
    },

    async deleteSession(sessionToken: string): Promise<void> {
      try {
        await prisma.session.delete({
          where: { sessionToken },
        })
      } catch (error) {
        console.error("[CustomPrismaAdapter] deleteSession error:", error)
        // Don't throw - session may already be deleted
      }
    },

    async createVerificationToken(data: VerificationToken): Promise<VerificationToken | null | undefined> {
      try {
        const token = await prisma.verificationToken.create({
          data: {
            identifier: data.identifier,
            token: data.token,
            expires: data.expires,
          },
        })
        return {
          identifier: token.identifier,
          token: token.token,
          expires: token.expires,
        }
      } catch (error) {
        console.error("[CustomPrismaAdapter] createVerificationToken error:", error)
        throw error
      }
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }): Promise<VerificationToken | null> {
      try {
        const verificationToken = await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier,
              token,
            },
          },
        })
        return {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires,
        }
      } catch (error) {
        console.error("[CustomPrismaAdapter] useVerificationToken error:", error)
        return null
      }
    },
  }
}
