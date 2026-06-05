"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { recordAudit } from "@/lib/audit"
import { getActionUser, parseInput, err, ok, type ActionResult } from "@/lib/action-utils"

const createSchema = z.object({
  childId: z.string().min(1, "Child is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required").max(20),
  description: z.string().min(1, "Description is required").max(2000),
  actionTaken: z.string().max(2000).optional().nullable(),
  witnesses: z.string().max(500).optional().nullable(),
})

const updateSchema = createSchema.extend({
  id: z.string().min(1),
})

async function childName(childId: string): Promise<string> {
  const child = await prisma.child.findUnique({ where: { id: childId } })
  return child ? `${child.firstName} ${child.lastName}` : "child"
}

export async function logIncident(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(createSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const child = await prisma.child.findFirst({
    where: { id: d.childId, organisationId: user.organisationId },
  })
  if (!child) return err("Child not found")

  const incident = await prisma.incidentLog.create({
    data: {
      childId: d.childId,
      date: new Date(d.date),
      time: d.time,
      description: d.description,
      actionTaken: d.actionTaken || null,
      witnesses: d.witnesses || null,
      organisationId: user.organisationId,
      createdById: user.id,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "CREATE",
    entityType: "IncidentLog",
    entityId: incident.id,
    summary: `Logged incident for ${child.firstName} ${child.lastName}`,
  })

  revalidatePath("/incidents")
  return ok()
}

export async function updateIncident(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(updateSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const existing = await prisma.incidentLog.findFirst({
    where: { id: d.id, organisationId: user.organisationId },
  })
  if (!existing) return err("Incident not found")

  const child = await prisma.child.findFirst({
    where: { id: d.childId, organisationId: user.organisationId },
  })
  if (!child) return err("Child not found")

  await prisma.incidentLog.update({
    where: { id: d.id },
    data: {
      childId: d.childId,
      date: new Date(d.date),
      time: d.time,
      description: d.description,
      actionTaken: d.actionTaken || null,
      witnesses: d.witnesses || null,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "IncidentLog",
    entityId: d.id,
    summary: `Updated incident for ${child.firstName} ${child.lastName}`,
  })

  revalidatePath("/incidents")
  return ok()
}

export async function markParentNotified(id: string): Promise<ActionResult> {
  const user = await getActionUser()
  const existing = await prisma.incidentLog.findFirst({
    where: { id, organisationId: user.organisationId },
  })
  if (!existing) return err("Incident not found")

  await prisma.incidentLog.update({
    where: { id },
    data: { parentNotified: true, parentNotifiedAt: new Date() },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "STATUS",
    entityType: "IncidentLog",
    entityId: id,
    summary: `Marked parent notified for incident (${await childName(existing.childId)})`,
  })

  revalidatePath("/incidents")
  return ok()
}

export async function deleteIncident(id: string): Promise<ActionResult> {
  const user = await getActionUser()
  const existing = await prisma.incidentLog.findFirst({
    where: { id, organisationId: user.organisationId },
  })
  if (!existing) return err("Incident not found")

  await prisma.incidentLog.delete({ where: { id } })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "DELETE",
    entityType: "IncidentLog",
    entityId: id,
    summary: `Deleted incident (${await childName(existing.childId)})`,
  })

  revalidatePath("/incidents")
  return ok()
}
