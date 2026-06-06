"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { recordAudit } from "@/lib/audit"
import {
  getActionUser,
  parseInput,
  err,
  ok,
  requireAdmin,
  type ActionResult,
} from "@/lib/action-utils"
import { isOwner } from "@/lib/auth"

// ============================================
// ORGANISATION DETAILS
// ============================================

const orgSchema = z.object({
  name: z.string().min(1, "Organisation name is required").max(200),
  address: z.string().max(500).optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  phone: z.string().max(50).optional().nullable(),
})

export async function updateOrganisation(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const adminErr = requireAdmin(user.role)
  if (adminErr) return err(adminErr)

  const parsed = parseInput(orgSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  await prisma.organisation.update({
    where: { id: user.organisationId },
    data: {
      name: d.name,
      address: d.address || null,
      email: d.email || null,
      phone: d.phone || null,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "Organisation",
    entityId: user.organisationId,
    summary: `Updated organisation details`,
  })

  revalidatePath("/settings")
  return ok()
}

// ============================================
// DAILY UPDATES SCHEDULE
// ============================================

const APPROVERS = ["SUPERVISOR", "ADMIN"] as const
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

const scheduleSchema = z.object({
  dailyUpdateScheduleTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  dailyUpdateScheduleDays: z.array(z.enum(DAYS)),
  dailyUpdateDefaultApprover: z.enum(APPROVERS),
})

export async function updateSchedule(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const adminErr = requireAdmin(user.role)
  if (adminErr) return err(adminErr)

  const parsed = parseInput(scheduleSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  await prisma.organisation.update({
    where: { id: user.organisationId },
    data: {
      dailyUpdateScheduleTime: d.dailyUpdateScheduleTime,
      dailyUpdateScheduleDays: JSON.stringify(d.dailyUpdateScheduleDays),
      dailyUpdateDefaultApprover: d.dailyUpdateDefaultApprover,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "Organisation",
    entityId: user.organisationId,
    summary: `Updated daily updates schedule`,
  })

  revalidatePath("/settings")
  return ok()
}

// ============================================
// USER MANAGEMENT
// ============================================

const ROLES = ["OWNER", "ADMIN", "SUPERVISOR", "STAFF"] as const

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(ROLES),
})

export async function createUser(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const adminErr = requireAdmin(user.role)
  if (adminErr) return err(adminErr)

  const parsed = parseInput(createUserSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  // Only an existing owner may mint another owner.
  if (d.role === "OWNER" && !isOwner(user.role)) {
    return err("Only the organisation owner can grant the Owner role.")
  }

  const existing = await prisma.user.findUnique({ where: { email: d.email } })
  if (existing) return err("A user with that email already exists")

  const passwordHash = await bcrypt.hash(d.password, 10)

  const created = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email,
      passwordHash,
      role: d.role,
      organisationId: user.organisationId,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "CREATE",
    entityType: "User",
    entityId: created.id,
    summary: `Added user "${created.name}" (${created.role})`,
  })

  revalidatePath("/settings")
  return ok()
}

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES),
})

export async function updateUserRole(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const adminErr = requireAdmin(user.role)
  if (adminErr) return err(adminErr)

  const parsed = parseInput(updateRoleSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const target = await prisma.user.findFirst({
    where: { id: d.userId, organisationId: user.organisationId },
  })
  if (!target) return err("User not found")

  // Owner accounts may only be promoted/demoted by an owner, and the Owner role
  // may only be granted by an owner.
  if ((target.role === "OWNER" || d.role === "OWNER") && !isOwner(user.role)) {
    return err("Only the organisation owner can change Owner-level access.")
  }

  // Never let the organisation lose its last owner/administrator.
  if (
    (target.role === "OWNER" || target.role === "ADMIN") &&
    d.role !== "OWNER" &&
    d.role !== "ADMIN"
  ) {
    const remainingAdmins = await prisma.user.count({
      where: {
        organisationId: user.organisationId,
        role: { in: ["OWNER", "ADMIN"] },
        id: { not: target.id },
      },
    })
    if (remainingAdmins === 0) {
      return err("You cannot remove the last administrator from the organisation.")
    }
  }

  await prisma.user.update({
    where: { id: d.userId },
    data: { role: d.role },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "User",
    entityId: d.userId,
    summary: `Changed role of "${target.name}" to ${d.role}`,
  })

  revalidatePath("/settings")
  return ok()
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const user = await getActionUser()
  const adminErr = requireAdmin(user.role)
  if (adminErr) return err(adminErr)

  if (userId === user.id) return err("You cannot delete your own account")

  const target = await prisma.user.findFirst({
    where: { id: userId, organisationId: user.organisationId },
  })
  if (!target) return err("User not found")

  // Owner accounts may only be removed by an owner.
  if (target.role === "OWNER" && !isOwner(user.role)) {
    return err("Only the organisation owner can remove an Owner account.")
  }

  // Never let the organisation lose its last owner/administrator.
  if (target.role === "OWNER" || target.role === "ADMIN") {
    const remainingAdmins = await prisma.user.count({
      where: {
        organisationId: user.organisationId,
        role: { in: ["OWNER", "ADMIN"] },
        id: { not: target.id },
      },
    })
    if (remainingAdmins === 0) {
      return err("You cannot remove the last administrator from the organisation.")
    }
  }

  await prisma.user.delete({ where: { id: userId } })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "DELETE",
    entityType: "User",
    entityId: userId,
    summary: `Removed user "${target.name}"`,
  })

  revalidatePath("/settings")
  return ok()
}
