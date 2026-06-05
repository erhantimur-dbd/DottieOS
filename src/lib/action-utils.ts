import { z } from "zod"
import { requireAuth, isSupervisorOrAbove, isAdmin, isOwner } from "@/lib/auth"
import type { UserRole } from "@prisma/client"

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export interface ActionUser {
  id: string
  name: string
  email: string
  role: UserRole
  organisationId: string
  organisationName: string
}

/** Resolve the current authenticated user for use inside a server action. */
export async function getActionUser(): Promise<ActionUser> {
  const user = await requireAuth()
  return {
    id: user.id,
    name: user.name ?? user.email ?? "Unknown",
    email: user.email ?? "",
    role: user.role,
    organisationId: user.organisationId,
    organisationName: user.organisationName,
  }
}

export function err(message: string): { ok: false; error: string } {
  return { ok: false, error: message }
}

export function ok<T>(data?: T): { ok: true; data?: T } {
  return { ok: true, data }
}

/** Parse input with a zod schema, returning a flat error message on failure. */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown
): { success: true; data: z.infer<S> } | { success: false; error: string } {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? "Invalid input" }
  }
  return { success: true, data: parsed.data }
}

export function requireSupervisor(role: UserRole): string | null {
  return isSupervisorOrAbove(role) ? null : "You do not have permission to perform this action."
}

export function requireAdmin(role: UserRole): string | null {
  return isAdmin(role) ? null : "Only administrators can perform this action."
}

export function requireOwner(role: UserRole): string | null {
  return isOwner(role) ? null : "Only the organisation owner can perform this action."
}
