import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@prisma/client"

// Edge-safe NextAuth config. Contains NO database/Node-only imports so it can be
// used from the middleware (Edge runtime). The Credentials provider (which touches
// Prisma) is added in the Node-only config.ts.
export const authConfigBase = {
  // Trust the deployment host. NextAuth auto-trusts on Vercel, but a generic host
  // (or `next start` locally / behind a proxy) needs this explicitly, otherwise
  // every auth request fails with UntrustedHost and sessions never establish.
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as UserRole
        token.organisationId = user.organisationId as string
        token.organisationName = user.organisationName as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.organisationId = token.organisationId as string
        session.user.organisationName = token.organisationName as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig
