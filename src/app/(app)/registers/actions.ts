"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { recordAudit } from "@/lib/audit"
import { getActionUser, parseInput, err, ok, type ActionResult } from "@/lib/action-utils"

const STATUSES = ["PRESENT", "ABSENT", "HOLIDAY", "SICK"] as const

/** Today (or a given yyyy-mm-dd) at UTC midnight to match the @db.Date column. */
function dateAtUtcMidnight(dateStr?: string | null): Date {
  const base = dateStr ? new Date(dateStr) : new Date()
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()))
}

const childDateSchema = z.object({
  childId: z.string().min(1, "Child is required"),
  date: z.string().optional().nullable(),
})

const statusSchema = childDateSchema.extend({
  status: z.enum(STATUSES),
})

const notesSchema = childDateSchema.extend({
  notes: z.string().max(2000),
})

async function ensureChild(organisationId: string, childId: string) {
  return prisma.child.findFirst({ where: { id: childId, organisationId } })
}

export async function checkIn(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(childDateSchema, input)
  if (!parsed.success) return err(parsed.error)
  const { childId, date } = parsed.data

  const child = await ensureChild(user.organisationId, childId)
  if (!child) return err("Child not found")

  const day = dateAtUtcMidnight(date)
  const now = new Date()

  await prisma.attendance.upsert({
    where: { childId_date: { childId, date: day } },
    create: {
      childId,
      date: day,
      checkInTime: now,
      status: "PRESENT",
      organisationId: user.organisationId,
    },
    update: {
      checkInTime: now,
      status: "PRESENT",
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "STATUS",
    entityType: "Attendance",
    entityId: childId,
    summary: `Checked in ${child.firstName} ${child.lastName}`,
  })

  revalidatePath("/registers")
  return ok()
}

export async function checkOut(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(childDateSchema, input)
  if (!parsed.success) return err(parsed.error)
  const { childId, date } = parsed.data

  const child = await ensureChild(user.organisationId, childId)
  if (!child) return err("Child not found")

  const day = dateAtUtcMidnight(date)
  const now = new Date()

  await prisma.attendance.upsert({
    where: { childId_date: { childId, date: day } },
    create: {
      childId,
      date: day,
      checkInTime: now,
      checkOutTime: now,
      status: "PRESENT",
      organisationId: user.organisationId,
    },
    update: {
      checkOutTime: now,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "STATUS",
    entityType: "Attendance",
    entityId: childId,
    summary: `Checked out ${child.firstName} ${child.lastName}`,
  })

  revalidatePath("/registers")
  return ok()
}

export async function setAttendanceStatus(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(statusSchema, input)
  if (!parsed.success) return err(parsed.error)
  const { childId, date, status } = parsed.data

  const child = await ensureChild(user.organisationId, childId)
  if (!child) return err("Child not found")

  const day = dateAtUtcMidnight(date)

  await prisma.attendance.upsert({
    where: { childId_date: { childId, date: day } },
    create: {
      childId,
      date: day,
      status,
      organisationId: user.organisationId,
    },
    update: {
      status,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "STATUS",
    entityType: "Attendance",
    entityId: childId,
    summary: `Set ${child.firstName} ${child.lastName} attendance to ${status.toLowerCase()}`,
  })

  revalidatePath("/registers")
  return ok()
}

export async function setAttendanceNotes(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(notesSchema, input)
  if (!parsed.success) return err(parsed.error)
  const { childId, date, notes } = parsed.data

  const child = await ensureChild(user.organisationId, childId)
  if (!child) return err("Child not found")

  const day = dateAtUtcMidnight(date)
  const trimmed = notes.trim() || null

  await prisma.attendance.upsert({
    where: { childId_date: { childId, date: day } },
    create: {
      childId,
      date: day,
      status: "PRESENT",
      notes: trimmed,
      organisationId: user.organisationId,
    },
    update: {
      notes: trimmed,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "Attendance",
    entityId: childId,
    summary: `Updated attendance notes for ${child.firstName} ${child.lastName}`,
  })

  revalidatePath("/registers")
  return ok()
}
