import { UserRole } from "@prisma/client"
import { DefaultSession } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      organisationId: string
      organisationName: string
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    organisationId: string
    organisationName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole
    organisationId: string
    organisationName: string
  }
}
