"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { recordAudit } from "@/lib/audit"
import { getActionUser, parseInput, err, ok, type ActionResult } from "@/lib/action-utils"

const CATEGORIES = ["ADMIN", "COMPLIANCE", "FINANCE", "PARENT_UPDATES"] as const
const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(CATEGORIES),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
})

const updateSchema = createSchema.extend({
  id: z.string().min(1),
  status: z.enum(STATUSES),
})

export async function createTask(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(createSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  // Validate assignee belongs to the same org.
  if (d.assignedToId) {
    const assignee = await prisma.user.findFirst({
      where: { id: d.assignedToId, organisationId: user.organisationId },
    })
    if (!assignee) return err("Assigned user not found")
  }

  const task = await prisma.task.create({
    data: {
      title: d.title,
      description: d.description || null,
      category: d.category,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      assignedToId: d.assignedToId || null,
      status: "PENDING",
      organisationId: user.organisationId,
      createdById: user.id,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "CREATE",
    entityType: "Task",
    entityId: task.id,
    summary: `Created task "${task.title}"`,
  })

  revalidatePath("/tasks")
  return ok()
}

export async function updateTask(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(updateSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const existing = await prisma.task.findFirst({
    where: { id: d.id, organisationId: user.organisationId },
  })
  if (!existing) return err("Task not found")

  if (d.assignedToId) {
    const assignee = await prisma.user.findFirst({
      where: { id: d.assignedToId, organisationId: user.organisationId },
    })
    if (!assignee) return err("Assigned user not found")
  }

  await prisma.task.update({
    where: { id: d.id },
    data: {
      title: d.title,
      description: d.description || null,
      category: d.category,
      status: d.status,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      assignedToId: d.assignedToId || null,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "Task",
    entityId: d.id,
    summary: `Updated task "${d.title}"`,
  })

  revalidatePath("/tasks")
  return ok()
}

export async function setTaskStatus(id: string, status: (typeof STATUSES)[number]): Promise<ActionResult> {
  const user = await getActionUser()
  const existing = await prisma.task.findFirst({
    where: { id, organisationId: user.organisationId },
  })
  if (!existing) return err("Task not found")

  await prisma.task.update({ where: { id }, data: { status } })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "STATUS",
    entityType: "Task",
    entityId: id,
    summary: `Marked task "${existing.title}" as ${status.toLowerCase().replace("_", " ")}`,
  })

  revalidatePath("/tasks")
  return ok()
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const user = await getActionUser()
  const existing = await prisma.task.findFirst({
    where: { id, organisationId: user.organisationId },
  })
  if (!existing) return err("Task not found")

  await prisma.task.delete({ where: { id } })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "DELETE",
    entityType: "Task",
    entityId: id,
    summary: `Deleted task "${existing.title}"`,
  })

  revalidatePath("/tasks")
  return ok()
}
