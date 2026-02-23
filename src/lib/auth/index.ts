import { auth } from "./config"
import { UserRole } from "@prisma/client"

export async function getSession() {
  return await auth()
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth() {
  const session = await getSession()
  if (!session || !session.user) {
    throw new Error("Unauthorized")
  }
  return session.user
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

export function isAdmin(userRole: UserRole): boolean {
  return hasRole(userRole, [UserRole.OWNER, UserRole.ADMIN])
}

export function isSupervisorOrAbove(userRole: UserRole): boolean {
  return hasRole(userRole, [UserRole.OWNER, UserRole.ADMIN, UserRole.SUPERVISOR])
}

export { auth, signIn, signOut } from "./config"
