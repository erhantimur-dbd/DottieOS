import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfigBase } from "./config.base"
import { recordAudit } from "@/lib/audit"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfigBase,
  events: {
    async signIn({ user }) {
      // Record a login in the organisation audit trail. Best-effort; never blocks sign-in.
      const organisationId = (user as { organisationId?: string }).organisationId
      if (!organisationId) return
      await recordAudit({
        organisationId,
        actorId: user.id ?? null,
        actorName: user.name ?? user.email ?? "Unknown",
        action: "LOGIN",
        entityType: "User",
        entityId: user.id ?? null,
        summary: `Signed in`,
      })
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organisation: true }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organisationId: user.organisationId,
          organisationName: user.organisation.name
        }
      }
    })
  ],
})
