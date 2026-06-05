"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { recordAudit } from "@/lib/audit"
import { getActionUser, parseInput, err, ok, requireAdmin, type ActionResult } from "@/lib/action-utils"

const STATUSES = ["READY", "NOT_READY"] as const

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().min(1, "Category is required").max(100),
})

const updateSchema = createSchema.extend({
  id: z.string().min(1),
  notes: z.string().max(2000).optional().nullable(),
})

export async function createEvidenceItem(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(createSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const item = await prisma.evidenceItem.create({
    data: {
      name: d.name,
      description: d.description || null,
      category: d.category,
      status: "NOT_READY",
      organisationId: user.organisationId,
      createdById: user.id,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "CREATE",
    entityType: "EvidenceItem",
    entityId: item.id,
    summary: `Created evidence item "${item.name}"`,
  })

  revalidatePath("/evidence-vault")
  return ok()
}

export async function setEvidenceStatus(
  id: string,
  status: (typeof STATUSES)[number]
): Promise<ActionResult> {
  if (!STATUSES.includes(status)) return err("Invalid status")
  const user = await getActionUser()
  const existing = await prisma.evidenceItem.findFirst({
    where: { id, organisationId: user.organisationId },
  })
  if (!existing) return err("Evidence item not found")

  await prisma.evidenceItem.update({
    where: { id },
    data: {
      status,
      updatedById: user.id,
      ...(status === "READY" ? { lastReviewedAt: new Date() } : {}),
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "STATUS",
    entityType: "EvidenceItem",
    entityId: id,
    summary: `Marked evidence item "${existing.name}" as ${status === "READY" ? "ready" : "not ready"}`,
  })

  revalidatePath("/evidence-vault")
  return ok()
}

export async function updateEvidenceItem(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(updateSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const existing = await prisma.evidenceItem.findFirst({
    where: { id: d.id, organisationId: user.organisationId },
  })
  if (!existing) return err("Evidence item not found")

  await prisma.evidenceItem.update({
    where: { id: d.id },
    data: {
      name: d.name,
      description: d.description || null,
      category: d.category,
      notes: d.notes || null,
      updatedById: user.id,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "EvidenceItem",
    entityId: d.id,
    summary: `Updated evidence item "${d.name}"`,
  })

  revalidatePath("/evidence-vault")
  return ok()
}

export async function deleteEvidenceItem(id: string): Promise<ActionResult> {
  const user = await getActionUser()
  const adminErr = requireAdmin(user.role)
  if (adminErr) return err(adminErr)

  const existing = await prisma.evidenceItem.findFirst({
    where: { id, organisationId: user.organisationId },
  })
  if (!existing) return err("Evidence item not found")

  await prisma.evidenceItem.delete({ where: { id } })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "DELETE",
    entityType: "EvidenceItem",
    entityId: id,
    summary: `Deleted evidence item "${existing.name}"`,
  })

  revalidatePath("/evidence-vault")
  return ok()
}
